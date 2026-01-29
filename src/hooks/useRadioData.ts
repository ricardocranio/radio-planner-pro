import { useMemo, useCallback } from "react";
import type { Station, RawRadioData, Track, SystemStats, DNAData } from "@/types/radio";
import rawRadioData from "@/data/radioData.json";
import { parseRadioData, buildDNAData, getSystemStats, getTopTracks, buildRankingData } from "@/utils/parseRadioData";

/**
 * Hook otimizado para gerenciar dados das rádios com memoização
 * Centraliza o parsing e cálculos para evitar reprocessamento
 */
export function useRadioData() {
  // Parse inicial dos dados - só recalcula se rawRadioData mudar
  const stations = useMemo(() => {
    return parseRadioData(rawRadioData as RawRadioData);
  }, []);

  const lastUpdate = useMemo(() => {
    return (rawRadioData as RawRadioData).ultima_atualizacao || "";
  }, []);

  return { stations, lastUpdate };
}

/**
 * Hook para estatísticas do sistema com memoização
 */
export function useSystemStats(stations: Station[], lastUpdate: string) {
  const stats = useMemo(() => getSystemStats(stations, lastUpdate), [stations, lastUpdate]);
  const dnaData = useMemo(() => buildDNAData(stations), [stations]);
  
  return { stats, dnaData };
}

/**
 * Hook para ranking de músicas
 */
export function useTopTracks(stations: Station[], limit: number = 30) {
  return useMemo(() => getTopTracks(stations, limit), [stations, limit]);
}

/**
 * Hook para buscar track por DNA
 */
export function useTrackLookup(stations: Station[]) {
  const trackByDNA = useMemo(() => {
    const map: Record<string, Track> = {};
    for (const station of stations) {
      const allTracks = [station.nowPlaying, ...station.recentTracks, ...station.historico];
      for (const track of allTracks) {
        if (track.dna && !map[track.dna]) {
          map[track.dna] = track;
        }
      }
    }
    return map;
  }, [stations]);

  const findByDNA = useCallback((dna: string): Track | undefined => {
    return trackByDNA[dna];
  }, [trackByDNA]);

  return { trackByDNA, findByDNA };
}

/**
 * Hook para configuração de cores por rádio
 */
export function useRadioConfig() {
  return useMemo(() => ({
    bh: { 
      name: "BH FM", 
      color: "text-cyan-400", 
      bgColor: "bg-cyan-400/10",
      borderColor: "border-cyan-400",
      statusColor: "bg-cyan-400" 
    },
    band: { 
      name: "Band FM", 
      color: "text-purple-400", 
      bgColor: "bg-purple-400/10",
      borderColor: "border-purple-400",
      statusColor: "bg-purple-400" 
    },
    clube: { 
      name: "Clube FM", 
      color: "text-green-400", 
      bgColor: "bg-green-400/10",
      borderColor: "border-green-400",
      statusColor: "bg-green-400" 
    },
    globo: { 
      name: "Globo FM", 
      color: "text-yellow-400", 
      bgColor: "bg-yellow-400/10",
      borderColor: "border-yellow-400",
      statusColor: "bg-yellow-400" 
    },
  }), []);
}
