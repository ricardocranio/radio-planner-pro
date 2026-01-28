// Tipos que espelham a estrutura do sistema PGM-FM Python

// Dados brutos vindos do radio_historico.json
export interface RawHistoricoEntry {
  musica: string;
  timestamp: string;
}

export interface RawUltimoDado {
  url: string;
  nome: string;
  tocando_agora: string;
  ultimas_tocadas: string[];
  timestamp: string;
  erro: string | null;
}

export interface RawRadioInfo {
  nome: string;
  url: string;
  historico_completo: RawHistoricoEntry[];
  ultimo_dado: RawUltimoDado;
}

export interface RawRadioData {
  radios: Record<string, RawRadioInfo>;
  ultima_atualizacao: string;
}

// Estrutura processada para o frontend
export interface Track {
  title: string;
  artist: string;
  timeAgo: string;
  dna: string; // Impressão digital normalizada
  timestamp?: string;
}

export interface Station {
  id: string;
  key: string; // bh, band, clube, globo
  name: string;
  genre: string;
  frequency: string;
  url: string;
  city?: string; // Cidade de transmissão
  state?: string; // Estado (UF)
  nowPlaying: Track;
  recentTracks: Track[];
  historico: Track[]; // Histórico completo
  lastUpdate: string;
}

// DNA de músicas por rádio (espelha DNAManager do Python)
export interface DNAEntry {
  total: number;
  radios: Record<string, number>;
}

export interface DNAData {
  [songDNA: string]: DNAEntry;
}

// Ranking de músicas mais tocadas
export interface RankingData {
  [songDNA: string]: number;
}

// Estatísticas do sistema
export interface SystemStats {
  totalMusicas: number;
  porRadio: Record<string, number>;
  ultimaAtualizacao: string;
}

// Configuração de distribuição por rádio
export interface RadioConfig {
  key: string;
  nome: string;
  ativo: boolean;
  posicaoInicio: number;
  posicaoFim: number;
}
