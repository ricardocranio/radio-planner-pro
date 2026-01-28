import { useMemo, useState } from "react";
import { TrendingUp, Radio, Music, Filter, ChevronDown, ChevronUp } from "lucide-react";
import type { Station, Track } from "@/types/radio";
import { getTopTracks, buildDNAData } from "@/utils/parseRadioData";

interface RankingMonitorProps {
  stations: Station[];
}

type FilterMode = "all" | "bh" | "band" | "clube" | "globo";

const radioConfig: Record<string, { name: string; color: string; bg: string }> = {
  bh: { name: "BH FM", color: "text-cyan-400", bg: "bg-cyan-400/20" },
  band: { name: "Band FM", color: "text-purple-400", bg: "bg-purple-400/20" },
  clube: { name: "Clube FM", color: "text-green-400", bg: "bg-green-400/20" },
  globo: { name: "Globo FM", color: "text-yellow-400", bg: "bg-yellow-400/20" },
};

const RankingMonitor = ({ stations }: RankingMonitorProps) => {
  const [filter, setFilter] = useState<FilterMode>("all");
  const [expandedStation, setExpandedStation] = useState<string | null>(null);

  // TOP 30 geral
  const topTracks = useMemo(() => getTopTracks(stations, 30), [stations]);

  // Filtra por rádio se necessário
  const filteredTracks = useMemo(() => {
    if (filter === "all") return topTracks;
    return topTracks.filter((item) => item.radios.includes(filter));
  }, [topTracks, filter]);

  // Músicas por emissora
  const tracksByStation = useMemo(() => {
    const result: Record<string, { track: Track; count: number }[]> = {};

    for (const station of stations) {
      const key = station.key;
      const allTracks = [station.nowPlaying, ...station.recentTracks, ...station.historico];

      // Conta por DNA
      const countMap: Record<string, { track: Track; count: number }> = {};
      for (const track of allTracks) {
        if (!track.dna) continue;
        if (!countMap[track.dna]) {
          countMap[track.dna] = { track, count: 0 };
        }
        countMap[track.dna].count++;
      }

      // Ordena e pega top 15
      result[key] = Object.values(countMap)
        .sort((a, b) => b.count - a.count)
        .slice(0, 15);
    }

    return result;
  }, [stations]);

  const getRankBadgeStyle = (index: number) => {
    if (index === 0) return "bg-yellow-500/30 text-yellow-300 border-yellow-500/50";
    if (index === 1) return "bg-slate-400/30 text-slate-300 border-slate-400/50";
    if (index === 2) return "bg-amber-600/30 text-amber-400 border-amber-600/50";
    return "bg-muted/30 text-muted-foreground border-muted/50";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/20">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-mono text-lg font-bold text-foreground">
                <span className="text-primary">{">"}</span> monitoramento_ranking
              </h2>
              <p className="text-xs text-muted-foreground">TOP 30 músicas mais tocadas</p>
            </div>
          </div>

          {/* Filtros */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <div className="flex gap-1">
              <button
                onClick={() => setFilter("all")}
                className={`px-3 py-1 rounded-full text-xs font-mono transition-all ${
                  filter === "all"
                    ? "bg-primary/30 text-primary border border-primary/50"
                    : "bg-muted/20 text-muted-foreground hover:bg-muted/30"
                }`}
              >
                TODAS
              </button>
              {Object.entries(radioConfig).map(([key, config]) => (
                <button
                  key={key}
                  onClick={() => setFilter(key as FilterMode)}
                  className={`px-3 py-1 rounded-full text-xs font-mono transition-all ${
                    filter === key
                      ? `${config.bg} ${config.color} border border-current/50`
                      : "bg-muted/20 text-muted-foreground hover:bg-muted/30"
                  }`}
                >
                  {config.name.split(" ")[0].toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* TOP 30 Ranking */}
      <div className="glass-card p-4">
        <div className="flex items-center gap-2 mb-4">
          <Music className="w-4 h-4 text-accent" />
          <h3 className="font-mono text-sm text-muted-foreground">
            top_30_mais_tocadas
            {filter !== "all" && (
              <span className={`ml-2 ${radioConfig[filter]?.color}`}>
                [{radioConfig[filter]?.name}]
              </span>
            )}
          </h3>
        </div>

        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin">
          {filteredTracks.length === 0 ? (
            <p className="text-center text-muted-foreground py-8 font-mono text-sm">
              Nenhuma música encontrada para este filtro
            </p>
          ) : (
            filteredTracks.map((item, index) => (
              <div
                key={item.track.dna}
                className="group flex items-center gap-3 p-3 rounded-xl bg-muted/10 hover:bg-muted/20 transition-all border border-transparent hover:border-primary/20"
              >
                {/* Posição */}
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold border ${getRankBadgeStyle(index)}`}
                >
                  {index + 1}
                </div>

                {/* Info da música */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate group-hover:text-primary transition-colors">
                    {item.track.title}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">
                    {item.track.artist}
                  </p>
                </div>

                {/* Contagem e rádios */}
                <div className="text-right flex-shrink-0">
                  <p className="text-lg font-bold text-primary">{item.count}x</p>
                  <div className="flex gap-1 justify-end flex-wrap">
                    {item.radios.map((radio) => (
                      <span
                        key={radio}
                        className={`text-[10px] px-1.5 py-0.5 rounded ${radioConfig[radio]?.bg} ${radioConfig[radio]?.color}`}
                      >
                        {radio.toUpperCase()}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Músicas por Emissora */}
      <div className="glass-card p-4">
        <div className="flex items-center gap-2 mb-4">
          <Radio className="w-4 h-4 text-secondary" />
          <h3 className="font-mono text-sm text-muted-foreground">
            musicas_por_emissora
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(tracksByStation).map(([stationKey, tracks]) => {
            const config = radioConfig[stationKey];
            const isExpanded = expandedStation === stationKey;
            const displayTracks = isExpanded ? tracks : tracks.slice(0, 5);

            return (
              <div
                key={stationKey}
                className={`p-4 rounded-xl border transition-all ${
                  isExpanded ? "border-primary/40 bg-muted/20" : "border-muted/20 bg-muted/10"
                }`}
              >
                {/* Header da emissora */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${config?.bg} ring-2 ring-current/30 ${config?.color}`} />
                    <span className={`font-mono font-bold ${config?.color}`}>
                      {config?.name || stationKey.toUpperCase()}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {tracks.length} músicas
                  </span>
                </div>

                {/* Lista de músicas */}
                <div className="space-y-1.5">
                  {displayTracks.map((item, idx) => (
                    <div
                      key={item.track.dna}
                      className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/20 transition-colors"
                    >
                      <span className={`w-5 h-5 rounded text-xs font-bold flex items-center justify-center ${config?.bg} ${config?.color}`}>
                        {idx + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground truncate">
                          {item.track.title}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {item.track.artist}
                        </p>
                      </div>
                      <span className={`text-sm font-bold ${config?.color}`}>
                        {item.count}x
                      </span>
                    </div>
                  ))}
                </div>

                {/* Botão expandir/recolher */}
                {tracks.length > 5 && (
                  <button
                    onClick={() => setExpandedStation(isExpanded ? null : stationKey)}
                    className={`w-full mt-3 py-2 rounded-lg text-xs font-mono flex items-center justify-center gap-1 transition-all ${config?.bg} ${config?.color} hover:opacity-80`}
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp className="w-3 h-3" />
                        recolher
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-3 h-3" />
                        ver_mais ({tracks.length - 5})
                      </>
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default RankingMonitor;
