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
 * Parseia uma string de música no formato:
 * "Título da Música\n\nNome do Artista\nX min ago"
 * ou
 * "Título da Música\n\nNome do Artista\nLIVE"
 */
function parseTrackString(raw: string, timestamp?: string): Track {
  const parts = raw.split("\n").filter((p) => p.trim());

  let title = "Música";
  let artist = "Artista";
  let timeAgo = "agora";

  if (parts.length >= 1) {
    title = parts[0].trim();
  }

  if (parts.length >= 2) {
    artist = parts[1].trim();
  }

  if (parts.length >= 3) {
    timeAgo = parts[2].trim();
    // Normaliza "LIVE" para "AO VIVO"
    if (timeAgo.toUpperCase() === "LIVE") {
      timeAgo = "AO VIVO";
    }
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
 * Espelha a lógica do RadioDataProvider._get_from_local_file()
 */
export function parseRadioData(raw: RawRadioData): Station[] {
  const stations: Station[] = [];
  const radiosData = raw.radios || {};

  // Agrupa por chave de estação (bh, band, clube, globo)
  const stationsByKey: Record<string, Station> = {};

  for (const [id, radioInfo] of Object.entries(radiosData)) {
    const key = mapStationToKey(radioInfo.nome);
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

    // Parseia histórico completo
    const historico = (radioInfo.historico_completo || []).map((entry) =>
      parseTrackString(entry.musica, entry.timestamp)
    );

    const station: Station = {
      id,
      key,
      name: ultimoDado.nome || radioInfo.nome,
      genre: getGenreFromStation(key),
      frequency: extractFrequency(radioInfo.nome),
      url: ultimoDado.url || radioInfo.url,
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
