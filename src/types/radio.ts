export interface Track {
  title: string;
  artist: string;
  timeAgo: string;
}

export interface Station {
  id: string;
  name: string;
  url: string;
  genre: string;
  nowPlaying: Track;
  recentTracks: Track[];
  timestamp: string;
}

export interface RawRadioData {
  radios: {
    [key: string]: {
      nome: string;
      url: string;
      historico_completo: Array<{
        musica: string;
        timestamp: string;
      }>;
      ultimo_dado: {
        url: string;
        nome: string;
        tocando_agora: string;
        ultimas_tocadas: string[];
        timestamp: string;
        erro: string | null;
      };
    };
  };
}
