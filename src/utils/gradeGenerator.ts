/**
 * Gerador de Grade - Espelha a lógica do PGM-FM Python
 * Monta blocos de programação baseados no monitoramento das rádios
 */

import type { Station, Track } from "@/types/radio";
import { getDNA } from "./dnaUtils";

// Configuração de distribuição por posição (espelha config.json do Python)
export interface DistribuicaoConfig {
  [radio: string]: {
    posicaoInicio: number;
    posicaoFim: number;
  };
}

const DEFAULT_DISTRIBUICAO: DistribuicaoConfig = {
  bh: { posicaoInicio: 1, posicaoFim: 3 },
  band: { posicaoInicio: 4, posicaoFim: 6 },
  clube: { posicaoInicio: 7, posicaoFim: 8 },
  globo: { posicaoInicio: 9, posicaoFim: 10 },
};

// Programas por horário
const PROGRAMAS_HORARIO: Record<string, string> = {
  "5-9": "MANHA_TOTAL",
  "9-12": "MANHA_HITS",
  "12-14": "HORA_DO_ALMOCO",
  "14-17": "TARDE_HITS",
  "17-19": "TOP30",
  "19-22": "NOITE_ESPECIAL",
  "22-24": "MADRUGADA",
  "0-5": "MADRUGADA",
};

export interface GradeEntry {
  musica: string;
  fonte: string; // BH, BAND, CLUBE, GLOBO, VHT, CORINGA, CONTEUDO
  tipo: "musica" | "vht" | "coringa" | "conteudo";
}

export interface BlocoGrade {
  horario: string;
  programa: string;
  entries: GradeEntry[];
  missing: string[];
}

export interface GradeCompleta {
  data: string;
  diaSemana: string;
  blocos: BlocoGrade[];
  estatisticas: {
    totalMusicas: number;
    porRadio: Record<string, number>;
    coringas: number;
    faltantes: string[];
  };
}

/**
 * Retorna o dia da semana em português
 */
function getDiaSemana(): string {
  const dias: Record<number, string> = {
    0: "DOMINGO",
    1: "SEGUNDA",
    2: "TERCA",
    3: "QUARTA",
    4: "QUINTA",
    5: "SEXTA",
    6: "SABADO",
  };
  return dias[new Date().getDay()];
}

/**
 * Retorna o programa para um horário
 */
function getPrograma(hour: number): string {
  for (const [range, programa] of Object.entries(PROGRAMAS_HORARIO)) {
    const [start, end] = range.split("-").map(Number);
    if (hour >= start && hour < end) {
      return programa;
    }
  }
  return "PROGRAMA";
}

/**
 * Retorna qual rádio corresponde a uma posição
 */
function getPositionRadio(
  position: number,
  distribuicao: DistribuicaoConfig = DEFAULT_DISTRIBUICAO
): string {
  for (const [radio, config] of Object.entries(distribuicao)) {
    if (position >= config.posicaoInicio && position <= config.posicaoFim) {
      return radio;
    }
  }
  return "bh";
}

/**
 * Monta um bloco de programação (30 minutos)
 */
function buildBlock(
  timeStr: string,
  hour: number,
  stations: Station[],
  usedDNAs: Set<string>,
  usedArtists: Set<string>,
  distribuicao: DistribuicaoConfig = DEFAULT_DISTRIBUICAO
): BlocoGrade {
  const entries: GradeEntry[] = [];
  const missing: string[] = [];
  const programa = getPrograma(hour);

  // Calcula total de posições
  const totalPositions = Math.max(
    ...Object.values(distribuicao).map((d) => d.posicaoFim)
  );

  // Mapa de estações por chave
  const stationsByKey: Record<string, Station> = {};
  for (const station of stations) {
    stationsByKey[station.key] = station;
  }

  for (let pos = 1; pos <= totalPositions; pos++) {
    const targetRadio = getPositionRadio(pos, distribuicao);
    const station = stationsByKey[targetRadio];
    let found = false;

    if (station) {
      // Tenta músicas do monitoramento
      const allTracks = [station.nowPlaying, ...station.recentTracks, ...station.historico];

      for (const track of allTracks) {
        if (!track.dna) continue;
        if (usedDNAs.has(track.dna)) continue;

        const artistDNA = getDNA(track.artist);
        if (usedArtists.has(artistDNA)) continue;

        // Adiciona VHT antes (exceto primeira música)
        if (entries.length > 0 && entries[entries.length - 1].tipo !== "conteudo") {
          entries.push({
            musica: "vht",
            fonte: "VHT",
            tipo: "vht",
          });
        }

        // Adiciona música
        entries.push({
          musica: `${track.artist} - ${track.title}`,
          fonte: targetRadio.toUpperCase(),
          tipo: "musica",
        });

        usedDNAs.add(track.dna);
        usedArtists.add(artistDNA);
        found = true;
        break;
      }

      if (!found) {
        // Registra como faltante
        const nowPlaying = station.nowPlaying;
        if (nowPlaying && !usedDNAs.has(nowPlaying.dna)) {
          missing.push(`[${timeStr}] ${nowPlaying.artist} - ${nowPlaying.title}`);
        }
      }
    }

    // Coringa se não encontrou
    if (!found) {
      if (entries.length > 0 && entries[entries.length - 1].tipo !== "conteudo") {
        entries.push({
          musica: "vht",
          fonte: "VHT",
          tipo: "vht",
        });
      }
      entries.push({
        musica: "mus",
        fonte: "CORINGA",
        tipo: "coringa",
      });
    }
  }

  return {
    horario: timeStr,
    programa,
    entries,
    missing,
  };
}

/**
 * Gera a grade completa do dia
 */
export function generateGrade(
  stations: Station[],
  horaInicio: number = 5,
  horaFim: number = 24,
  distribuicao: DistribuicaoConfig = DEFAULT_DISTRIBUICAO
): GradeCompleta {
  const blocos: BlocoGrade[] = [];
  const usedDNAs = new Set<string>();
  const usedArtists = new Set<string>();
  const allMissing: string[] = [];
  const porRadio: Record<string, number> = {};
  let coringas = 0;
  let totalMusicas = 0;

  // Gera blocos de 30 em 30 minutos
  for (let hour = horaInicio; hour < horaFim; hour++) {
    for (const minute of [0, 30]) {
      const timeStr = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;

      const bloco = buildBlock(
        timeStr,
        hour,
        stations,
        usedDNAs,
        usedArtists,
        distribuicao
      );

      blocos.push(bloco);
      allMissing.push(...bloco.missing);

      // Estatísticas
      for (const entry of bloco.entries) {
        if (entry.tipo === "musica") {
          totalMusicas++;
          porRadio[entry.fonte] = (porRadio[entry.fonte] || 0) + 1;
        } else if (entry.tipo === "coringa") {
          coringas++;
        }
      }
    }
  }

  return {
    data: new Date().toLocaleDateString("pt-BR"),
    diaSemana: getDiaSemana(),
    blocos,
    estatisticas: {
      totalMusicas,
      porRadio,
      coringas,
      faltantes: allMissing,
    },
  };
}

/**
 * Formata a grade para TXT (igual ao Python)
 */
export function formatGradeToTxt(grade: GradeCompleta): string {
  const lines: string[] = [];

  lines.push("=".repeat(60));
  lines.push(`GRADE DE PROGRAMAÇÃO - ${grade.diaSemana} ${grade.data}`);
  lines.push("=".repeat(60));
  lines.push("");

  for (const bloco of grade.blocos) {
    const formatted = bloco.entries.map((entry) => {
      if (entry.tipo === "vht") {
        return "vht";
      } else if (entry.tipo === "coringa") {
        return "mus";
      } else {
        return `"${entry.musica}"`;
      }
    });

    lines.push(`${bloco.horario} (ID=${bloco.programa}) ${formatted.join(",")}`);
  }

  lines.push("");
  lines.push("=".repeat(60));
  lines.push("ESTATÍSTICAS");
  lines.push("=".repeat(60));
  lines.push(`Total de músicas: ${grade.estatisticas.totalMusicas}`);
  lines.push(`Coringas usados: ${grade.estatisticas.coringas}`);
  lines.push("");
  lines.push("Por rádio:");
  for (const [radio, count] of Object.entries(grade.estatisticas.porRadio)) {
    lines.push(`  ${radio}: ${count} músicas`);
  }

  if (grade.estatisticas.faltantes.length > 0) {
    lines.push("");
    lines.push("=".repeat(60));
    lines.push("MÚSICAS FALTANTES");
    lines.push("=".repeat(60));
    for (const faltante of grade.estatisticas.faltantes) {
      lines.push(faltante);
    }
  }

  return lines.join("\n");
}

/**
 * Formata o arquivo faltando.txt
 */
export function formatFaltandoTxt(grade: GradeCompleta): string {
  if (grade.estatisticas.faltantes.length === 0) {
    return "Nenhuma música faltante!";
  }

  const lines: string[] = [];
  lines.push(`--- FALTANTES ${grade.data} ${new Date().toLocaleTimeString("pt-BR")} ---`);

  for (const faltante of grade.estatisticas.faltantes) {
    lines.push(faltante);
  }

  return lines.join("\n");
}
