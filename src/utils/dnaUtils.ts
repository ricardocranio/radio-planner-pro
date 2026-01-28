/**
 * Utilitários de DNA - Espelha as funções do PGM-FM Python
 * Gera "impressões digitais" normalizadas de strings para comparação
 */

/**
 * Remove acentos de uma string
 */
export function removeAccents(text: string): string {
  if (!text) return "";
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/**
 * Gera uma 'impressão digital' normalizada de uma string
 * Espelha a função get_dna() do Python
 */
export function getDNA(s: string): string {
  if (!s) return "";

  // Decodifica entidades HTML
  let result = s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'");

  // Remove acentos
  result = removeAccents(result);

  // Remove padrões comuns
  const patterns = [
    /\(.*?\)/g, // Conteúdo entre parênteses
    /\[.*?\]/g, // Conteúdo entre colchetes
    /\bao vivo\b/gi,
    /\blive\b/gi,
    /\bacoustic\b/gi,
    /\bacustico\b/gi,
    /\bfeat\b/gi,
    /\bft\b/gi,
    /clipe oficial/gi,
    /video oficial/gi,
    /oficial/gi,
    /\bhd\b/gi,
    /\b4k\b/gi,
    /lyric/gi,
    /audio/gi,
    /remaster/gi,
    /20\d{2}/g, // Anos 2000-2099
    /\b-\b/g,
  ];

  for (const pattern of patterns) {
    result = result.replace(pattern, "");
  }

  // Remove caracteres não alfanuméricos
  result = result.replace(/[^a-zA-Z0-9]/g, "");

  return result.toLowerCase().trim();
}

/**
 * Extrai o nome do artista do formato "Artista - Música"
 */
export function getArtistFromTitle(fullTitle: string): string {
  if (fullTitle.includes(" - ")) {
    return fullTitle.split(" - ")[0].trim();
  }
  return "";
}

/**
 * Mapeia nome da estação para chave usada no sistema
 * Espelha _map_station_to_key() do Python
 */
export function mapStationToKey(stationName: string): string {
  const nameLower = stationName.toLowerCase();

  if (nameLower.includes("bh")) return "bh";
  if (nameLower.includes("band")) return "band";
  if (nameLower.includes("clube")) return "clube";
  if (nameLower.includes("globo")) return "globo";

  // Retorna nome simplificado
  return nameLower.replace(/[^a-z0-9]/g, "").slice(0, 10);
}

/**
 * Determina o gênero baseado no nome da rádio
 */
export function getGenreFromStation(stationKey: string): string {
  const genres: Record<string, string> = {
    bh: "Pop/Sertanejo",
    band: "Sertanejo/Pop",
    clube: "Hits/Variados",
    globo: "Pagode/MPB",
  };

  return genres[stationKey] || "Variados";
}

/**
 * Extrai a frequência do nome da rádio
 */
export function extractFrequency(stationName: string): string {
  const match = stationName.match(/(\d+\.?\d*)/);
  return match ? `${match[1]} FM` : "FM";
}

/**
 * Formata timestamp para exibição relativa
 */
export function formatTimeAgo(timestamp: string): string {
  try {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "agora";
    if (diffMins === 1) return "1 min ago";
    if (diffMins < 60) return `${diffMins} min ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return "1 hora atrás";
    if (diffHours < 24) return `${diffHours} horas atrás`;

    return date.toLocaleDateString("pt-BR");
  } catch {
    return timestamp;
  }
}
