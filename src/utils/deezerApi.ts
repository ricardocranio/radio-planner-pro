/**
 * Deezer API com suporte a ARL (Deemix)
 * API do Deezer para busca e download de músicas
 */

export interface DeezerTrack {
  id: number;
  title: string;
  artist: {
    id: number;
    name: string;
  };
  album: {
    id: number;
    title: string;
    cover_small: string;
    cover_medium: string;
  };
  duration: number;
  preview: string;
  link: string;
}

export interface DeezerSearchResult {
  data: DeezerTrack[];
  total: number;
  next?: string;
}

const DEEZER_API_BASE = "https://api.deezer.com";

// Obtém o ARL salvo no localStorage
export function getStoredArl(): string | null {
  return localStorage.getItem("deemix_arl");
}

// Verifica se o ARL está configurado
export function isArlConfigured(): boolean {
  const arl = getStoredArl();
  return !!arl && arl.length > 0;
}

/**
 * Busca músicas no Deezer por query
 */
export async function searchDeezer(
  query: string,
  limit: number = 10
): Promise<DeezerTrack[]> {
  try {
    const encodedQuery = encodeURIComponent(query);
    const response = await fetch(
      `${DEEZER_API_BASE}/search?q=${encodedQuery}&limit=${limit}`
    );

    if (!response.ok) {
      console.error(`Deezer API error: ${response.status}`);
      return [];
    }

    const data: DeezerSearchResult = await response.json();
    return data.data || [];
  } catch (error) {
    console.error("Erro ao buscar no Deezer:", error);
    return [];
  }
}

/**
 * Busca músicas por gênero/chart no Deezer
 */
export async function getDeezerChart(
  genre: "pop" | "sertanejo" | "pagode" | "mpb" = "pop",
  limit: number = 25
): Promise<DeezerTrack[]> {
  try {
    const genreIds: Record<string, number> = {
      pop: 132,
      sertanejo: 466,
      pagode: 98,
      mpb: 463,
    };

    const genreId = genreIds[genre] || 132;
    const response = await fetch(
      `${DEEZER_API_BASE}/chart/${genreId}/tracks?limit=${limit}`
    );

    if (!response.ok) {
      const fallbackResponse = await fetch(
        `${DEEZER_API_BASE}/chart/0/tracks?limit=${limit}`
      );
      if (!fallbackResponse.ok) return [];
      const fallbackData = await fallbackResponse.json();
      return fallbackData.data || [];
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error("Erro ao buscar chart Deezer:", error);
    return [];
  }
}

/**
 * Busca uma música específica por artista e título
 */
export async function findTrackOnDeezer(
  artist: string,
  title: string
): Promise<DeezerTrack | null> {
  const query = `artist:"${artist}" track:"${title}"`;
  const results = await searchDeezer(query, 1);
  return results[0] || null;
}

/**
 * Formata track do Deezer para o formato do sistema
 */
export function formatDeezerTrack(track: DeezerTrack): {
  musica: string;
  artista: string;
  titulo: string;
  preview: string;
  link: string;
} {
  return {
    musica: `${track.artist.name} - ${track.title}`,
    artista: track.artist.name,
    titulo: track.title,
    preview: track.preview,
    link: track.link,
  };
}

/**
 * Gera URL de download via Deemix (requer backend com ARL)
 * Nota: O download real requer um servidor Deemix configurado
 */
export function getDeemixDownloadInfo(track: DeezerTrack, arl: string | null): {
  canDownload: boolean;
  trackId: number;
  trackUrl: string;
  message: string;
} {
  if (!arl) {
    return {
      canDownload: false,
      trackId: track.id,
      trackUrl: track.link,
      message: "ARL não configurado. Configure o ARL para habilitar downloads.",
    };
  }

  return {
    canDownload: true,
    trackId: track.id,
    trackUrl: `https://www.deezer.com/track/${track.id}`,
    message: "Pronto para download via Deemix",
  };
}

/**
 * Busca músicas para preencher coringas baseado no gênero da rádio
 */
export async function getCoringaFromDeezer(
  radioKey: string,
  usedDNAs: Set<string>,
  getDNA: (s: string) => string
): Promise<DeezerTrack | null> {
  const radioGenres: Record<string, "pop" | "sertanejo" | "pagode" | "mpb"> = {
    bh: "pop",
    band: "sertanejo",
    clube: "pop",
    globo: "pagode",
  };

  const genre = radioGenres[radioKey] || "pop";
  const tracks = await getDeezerChart(genre, 50);

  for (const track of tracks) {
    const trackDNA = getDNA(`${track.artist.name} - ${track.title}`);
    if (!usedDNAs.has(trackDNA)) {
      return track;
    }
  }

  return null;
}
