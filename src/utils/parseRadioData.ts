import type {
  RawRadioData,
  Station,
  Track,
  DNAData,
  RankingData,
  SystemStats,
} from "@/types/radio";
import {
  getDNA,
  mapStationToKey,
  getGenreFromStation,
  extractFrequency,
} from "./dnaUtils";

/**
 * Parseia uma string de música nos formatos suportados:
 * 
 * Formato 1 (MyTuner com quebras de linha):
 * "Título da Música\n\nNome do Artista\nX min ago"
 * 
 * Formato 2 (radio_monitor_supabase.py):
 * "Artista - Música"
 * 
 * Formato 3:
 * "Título da Música\n\nNome do Artista\nLIVE"
 */
function parseTrackString(raw: string, timestamp?: string): Track {
  if (!raw || typeof raw !== 'string') {
    return {
      title: "Sem informação",
      artist: "Desconhecido",
      timeAgo: "agora",
      dna: "",
      timestamp,
    };
  }

  let title = "Música";
  let artist = "Artista";
  let timeAgo = "agora";

  // Remove indicadores de tempo no final (ex: "3 min ago", "LIVE")
  const timeMatch = raw.match(/\s+(\d+\s*(min|sec|seg|hour|hora)s?\s*(ago|atrás)?|LIVE)\s*$/i);
  if (timeMatch) {
    timeAgo = timeMatch[1].trim();
    if (timeAgo.toUpperCase() === "LIVE") {
      timeAgo = "AO VIVO";
    }
    raw = raw.replace(timeMatch[0], "").trim();
  }

  // Tenta detectar o formato
  if (raw.includes(" - ")) {
    // Formato: "Artista - Música" (radio_monitor_supabase.py)
    const parts = raw.split(" - ");
    if (parts.length >= 2) {
      artist = parts[0].trim();
      title = parts.slice(1).join(" - ").trim();
    }
  } else if (raw.includes(" – ")) {
    // Formato com travessão
    const parts = raw.split(" – ");
    if (parts.length >= 2) {
      artist = parts[0].trim();
      title = parts.slice(1).join(" – ").trim();
    }
  } else if (raw.includes("\n")) {
    // Formato com quebra de linha (MyTuner)
    const parts = raw.split("\n").filter((p) => p.trim());
    
    if (parts.length >= 1) {
      title = parts[0].trim();
    }

    if (parts.length >= 2) {
      artist = parts[1].trim();
    }

    if (parts.length >= 3) {
      const possibleTime = parts[2].trim();
      if (/^\d+\s*(min|sec|seg|hour|hora)/i.test(possibleTime) || possibleTime.toUpperCase() === "LIVE") {
        timeAgo = possibleTime.toUpperCase() === "LIVE" ? "AO VIVO" : possibleTime;
      }
    }
  } else {
    // Texto simples sem separador - assume que é o título
    title = raw.trim();
    artist = "Desconhecido";
  }

  const dna = getDNA(`${artist} - ${title}`);

  return {
    title,
    artist,
    timeAgo,
    dna,
    timestamp,
  };
}

/**
 * Processa os dados brutos do JSON e retorna estações formatadas
 * Suporta o formato do radio_monitor_supabase.py
 */
export function parseRadioData(raw: RawRadioData): Station[] {
  const stations: Station[] = [];
  const radiosData = raw.radios || {};

  // Agrupa por chave de estação (bh, band, clube, globo)
  const stationsByKey: Record<string, Station> = {};

  for (const [id, radioInfo] of Object.entries(radiosData)) {
    // A chave já pode ser bh, band, clube, globo direto do JSON
    const key = id.toLowerCase() === "bh" || id.toLowerCase() === "band" || 
                id.toLowerCase() === "clube" || id.toLowerCase() === "globo" 
                ? id.toLowerCase() 
                : mapStationToKey(radioInfo.nome || id);
    
    const ultimoDado = radioInfo.ultimo_dado;

    if (!ultimoDado) continue;

    // Parseia música atual
    const nowPlaying = parseTrackString(
      ultimoDado.tocando_agora,
      ultimoDado.timestamp
    );

    // Parseia últimas tocadas
    const recentTracks = (ultimoDado.ultimas_tocadas || []).map((track) =>
      parseTrackString(track, ultimoDado.timestamp)
    );

    // Parseia histórico completo (suporta "historico" ou "historico_completo")
    const historicoRaw = radioInfo.historico_completo || radioInfo.historico || [];
    const historico = historicoRaw.map((entry) => {
      // Suporta formato com "musica" ou "tocando_agora"
      const songText = entry.musica || entry.tocando_agora || "";
      return parseTrackString(songText, entry.timestamp);
    }).filter(t => t.title && t.title !== "Sem informação");

    // Usa frequencia do JSON ou extrai do nome
    const frequency = radioInfo.frequencia || extractFrequency(radioInfo.nome || id);

    const station: Station = {
      id,
      key,
      name: ultimoDado.nome || radioInfo.nome || id.toUpperCase(),
      genre: getGenreFromStation(key),
      frequency,
      url: ultimoDado.url || radioInfo.url || "",
      nowPlaying,
      recentTracks,
      historico,
      lastUpdate: ultimoDado.timestamp,
    };

    // Se já existe uma estação com essa chave, combina os dados
    // (pega o mais recente baseado no timestamp)
    if (stationsByKey[key]) {
      const existing = stationsByKey[key];
      const existingTime = new Date(existing.lastUpdate).getTime();
      const newTime = new Date(station.lastUpdate).getTime();

      if (newTime > existingTime) {
        // Combina históricos
        station.historico = [
          ...station.historico,
          ...existing.historico.filter(
            (t) => !station.historico.some((s) => s.dna === t.dna)
          ),
        ];
        stationsByKey[key] = station;
      } else {
        // Adiciona histórico da nova estação à existente
        existing.historico = [
          ...existing.historico,
          ...station.historico.filter(
            (t) => !existing.historico.some((s) => s.dna === t.dna)
          ),
        ];
      }
    } else {
      stationsByKey[key] = station;
    }
  }

  // Converte para array mantendo ordem consistente
  const keyOrder = ["bh", "band", "clube", "globo"];
  for (const key of keyOrder) {
    if (stationsByKey[key]) {
      stations.push(stationsByKey[key]);
    }
  }

  // Adiciona qualquer estação que não estava na ordem
  for (const [key, station] of Object.entries(stationsByKey)) {
    if (!keyOrder.includes(key)) {
      stations.push(station);
    }
  }

  return stations;
}

/**
 * Constrói o mapa de DNA a partir das estações
 * Espelha DNAManager do Python
 */
export function buildDNAData(stations: Station[]): DNAData {
  const dnaData: DNAData = {};

  for (const station of stations) {
    const allTracks = [station.nowPlaying, ...station.recentTracks, ...station.historico];

    for (const track of allTracks) {
      if (!track.dna) continue;

      if (!dnaData[track.dna]) {
        dnaData[track.dna] = { total: 0, radios: {} };
      }

      dnaData[track.dna].total++;
      dnaData[track.dna].radios[station.key] =
        (dnaData[track.dna].radios[station.key] || 0) + 1;
    }
  }

  return dnaData;
}

/**
 * Constrói o ranking de músicas mais tocadas
 * Espelha RankingManager do Python
 */
export function buildRankingData(stations: Station[]): RankingData {
  const ranking: RankingData = {};

  for (const station of stations) {
    const allTracks = [station.nowPlaying, ...station.recentTracks, ...station.historico];

    for (const track of allTracks) {
      if (!track.dna) continue;
      ranking[track.dna] = (ranking[track.dna] || 0) + 1;
    }
  }

  return ranking;
}

/**
 * Obtém as N músicas mais tocadas
 */
export function getTopTracks(
  stations: Station[],
  limit: number = 30
): { track: Track; count: number; radios: string[] }[] {
  const ranking = buildRankingData(stations);
  const dnaData = buildDNAData(stations);

  // Mapa de DNA para Track (para recuperar informações)
  const trackByDNA: Record<string, Track> = {};
  for (const station of stations) {
    const allTracks = [station.nowPlaying, ...station.recentTracks, ...station.historico];
    for (const track of allTracks) {
      if (track.dna && !trackByDNA[track.dna]) {
        trackByDNA[track.dna] = track;
      }
    }
  }

  // Ordena por contagem
  const sorted = Object.entries(ranking)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit);

  return sorted.map(([dna, count]) => ({
    track: trackByDNA[dna] || { title: "?", artist: "?", timeAgo: "", dna },
    count,
    radios: Object.keys(dnaData[dna]?.radios || {}),
  }));
}

/**
 * Calcula estatísticas do sistema
 */
export function getSystemStats(
  stations: Station[],
  lastUpdate: string
): SystemStats {
  const dnaData = buildDNAData(stations);

  const porRadio: Record<string, number> = {};
  for (const entry of Object.values(dnaData)) {
    for (const [radio, count] of Object.entries(entry.radios)) {
      porRadio[radio] = (porRadio[radio] || 0) + count;
    }
  }

  return {
    totalMusicas: Object.keys(dnaData).length,
    porRadio,
    ultimaAtualizacao: lastUpdate,
  };
}
