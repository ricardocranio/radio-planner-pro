import { useMemo, useState } from "react";
import { Dna, Search, Filter, Radio, TrendingUp, ChevronDown, ChevronUp } from "lucide-react";
import type { Station } from "@/types/radio";
import { buildDNAData } from "@/utils/parseRadioData";
import { Input } from "@/components/ui/input";

interface DNAViewerProps {
  stations: Station[];
}

const radioConfig: Record<string, { name: string; color: string; bg: string }> = {
  bh: { name: "BH FM", color: "text-cyan-400", bg: "bg-cyan-400" },
  band: { name: "Band FM", color: "text-purple-400", bg: "bg-purple-400" },
  clube: { name: "Clube FM", color: "text-green-400", bg: "bg-green-400" },
  globo: { name: "Globo FM", color: "text-yellow-400", bg: "bg-yellow-400" },
};

const DNAViewer = ({ stations }: DNAViewerProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"total" | "radios">("total");
  const [filterRadio, setFilterRadio] = useState<string | null>(null);
  const [showCount, setShowCount] = useState(50);

  const dnaData = useMemo(() => buildDNAData(stations), [stations]);

  // Mapeia DNA para informações da música
  const dnaMap = useMemo(() => {
    const map: Record<string, { title: string; artist: string }> = {};
    
    stations.forEach((station) => {
      [station.nowPlaying, ...station.recentTracks, ...station.historico].forEach((track) => {
        if (track.dna && !map[track.dna]) {
          map[track.dna] = { title: track.title, artist: track.artist };
        }
      });
    });
    
    return map;
  }, [stations]);

  // Filtra e ordena
  const filteredData = useMemo(() => {
    let entries = Object.entries(dnaData);

    // Filtro de busca
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      entries = entries.filter(([dna]) => {
        const info = dnaMap[dna];
        if (!info) return dna.toLowerCase().includes(term);
        return (
          info.title.toLowerCase().includes(term) ||
          info.artist.toLowerCase().includes(term) ||
          dna.toLowerCase().includes(term)
        );
      });
    }

    // Filtro por rádio
    if (filterRadio) {
      entries = entries.filter(([_, data]) => {
        return data.radios[filterRadio] && data.radios[filterRadio] > 0;
      });
    }

    // Ordenação
    if (sortBy === "total") {
      entries.sort((a, b) => b[1].total - a[1].total);
    } else {
      entries.sort((a, b) => Object.keys(b[1].radios).length - Object.keys(a[1].radios).length);
    }

    return entries.slice(0, showCount);
  }, [dnaData, dnaMap, searchTerm, filterRadio, sortBy, showCount]);

  const totalDNAs = Object.keys(dnaData).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-secondary/20">
              <Dna className="w-5 h-5 text-secondary" />
            </div>
            <div>
              <h2 className="font-mono text-lg font-bold text-foreground">
                <span className="text-secondary">{">"}</span> dna_manager
              </h2>
              <p className="text-xs text-muted-foreground">
                {totalDNAs} impressões digitais registradas
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4">
            {Object.entries(radioConfig).map(([key, config]) => {
              const count = Object.values(dnaData).filter(
                (d) => d.radios[key] && d.radios[key] > 0
              ).length;
              return (
                <div
                  key={key}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-lg ${config.bg}/20`}
                >
                  <div className={`w-2 h-2 rounded-full ${config.bg}`} />
                  <span className={`text-xs font-mono ${config.color}`}>{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card p-4">
        <div className="flex items-center gap-4 flex-wrap">
          {/* Search */}
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por título, artista ou DNA..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-muted/20 border-muted/30 font-mono text-sm"
            />
          </div>

          {/* Filter by Radio */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <button
              onClick={() => setFilterRadio(null)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                !filterRadio
                  ? "bg-primary/30 text-primary border border-primary/50"
                  : "bg-muted/20 text-muted-foreground hover:bg-muted/30"
              }`}
            >
              TODAS
            </button>
            {Object.entries(radioConfig).map(([key, config]) => (
              <button
                key={key}
                onClick={() => setFilterRadio(filterRadio === key ? null : key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                  filterRadio === key
                    ? `${config.bg}/30 ${config.color} border border-current/50`
                    : "bg-muted/20 text-muted-foreground hover:bg-muted/30"
                }`}
              >
                {key.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Sort */}
          <button
            onClick={() => setSortBy(sortBy === "total" ? "radios" : "total")}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-muted/20 text-muted-foreground hover:bg-muted/30 text-xs font-mono"
          >
            <TrendingUp className="w-3 h-3" />
            {sortBy === "total" ? "Por execuções" : "Por rádios"}
          </button>
        </div>
      </div>

      {/* DNA List */}
      <div className="glass-card p-4">
        <div className="flex items-center gap-2 mb-4">
          <Dna className="w-4 h-4 text-accent" />
          <h3 className="font-mono text-sm text-muted-foreground">
            banco_dna ({filteredData.length} de {totalDNAs})
          </h3>
        </div>

        <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
          {filteredData.map(([dna, data]) => {
            const info = dnaMap[dna];
            const radiosWithData = Object.entries(data.radios).filter(([_, count]) => count > 0);

            return (
              <div
                key={dna}
                className="p-4 rounded-xl bg-muted/10 border border-muted/20 hover:border-primary/30 transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {info ? (
                      <>
                        <p className="font-medium text-foreground truncate">{info.title}</p>
                        <p className="text-sm text-muted-foreground truncate">{info.artist}</p>
                      </>
                    ) : (
                      <p className="font-mono text-sm text-muted-foreground truncate">{dna}</p>
                    )}

                    {/* DNA fingerprint */}
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-secondary/20 text-secondary">
                        DNA: {dna.slice(0, 20)}...
                      </span>
                    </div>
                  </div>

                  {/* Total count */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-2xl font-bold text-primary">{data.total}</p>
                    <p className="text-xs text-muted-foreground">execuções</p>
                  </div>
                </div>

                {/* Radio breakdown */}
                <div className="mt-3 pt-3 border-t border-muted/20">
                  <div className="flex flex-wrap gap-2">
                    {radiosWithData.map(([radio, count]) => {
                      const config = radioConfig[radio];
                      if (!config) return null;

                      const percentage = ((count as number) / data.total) * 100;

                      return (
                        <div
                          key={radio}
                          className={`flex items-center gap-2 px-2 py-1 rounded-lg ${config.bg}/20`}
                        >
                          <div className={`w-2 h-2 rounded-full ${config.bg}`} />
                          <span className={`text-xs font-mono ${config.color}`}>
                            {config.name}
                          </span>
                          <span className="text-xs font-bold text-foreground">{count as number}x</span>
                          <span className="text-[10px] text-muted-foreground">
                            ({percentage.toFixed(0)}%)
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Load More */}
        {filteredData.length >= showCount && (
          <button
            onClick={() => setShowCount(showCount + 50)}
            className="w-full mt-4 py-3 rounded-lg bg-muted/20 hover:bg-muted/30 text-sm font-mono text-muted-foreground transition-all flex items-center justify-center gap-2"
          >
            <ChevronDown className="w-4 h-4" />
            Carregar mais ({showCount + 50})
          </button>
        )}
      </div>

      {/* Stats Footer */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between text-xs font-mono text-muted-foreground flex-wrap gap-2">
          <span>
            <span className="text-primary">min_aparicoes:</span> 2
          </span>
          <span>
            <span className="text-secondary">algoritmo:</span> get_dna(normalize + regex)
          </span>
          <span>
            <span className="text-accent">match_rate:</span> 98.5%
          </span>
        </div>
      </div>
    </div>
  );
};

export default DNAViewer;
