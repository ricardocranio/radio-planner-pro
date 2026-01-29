import { useMemo } from "react";
import { BarChart3, Radio, TrendingUp, Database } from "lucide-react";
import type { Station } from "@/types/radio";
import { getSystemStats, getTopTracks, buildDNAData } from "@/utils/parseRadioData";

interface StatsCardProps {
  stations: Station[];
  lastUpdate?: string;
}

const StatsCard = ({ stations, lastUpdate }: StatsCardProps) => {
  const updateStr = lastUpdate || stations[0]?.lastUpdate || new Date().toISOString();
  const stats = useMemo(() => getSystemStats(stations, updateStr), [stations, updateStr]);
  const dnaData = useMemo(() => buildDNAData(stations), [stations]);
  const topTracks = useMemo(() => getTopTracks(stations, 10), [stations]);

  const radioColors: Record<string, string> = {
    bh: "text-cyan-400",
    band: "text-purple-400",
    clube: "text-green-400",
    globo: "text-yellow-400",
  };

  const radioNames: Record<string, string> = {
    bh: "BH FM",
    band: "Band FM",
    clube: "Clube FM",
    globo: "Globo FM",
  };

  return (
    <div className="glass-card p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <BarChart3 className="w-5 h-5 text-primary" />
        <h3 className="font-mono text-sm text-muted-foreground">
          <span className="text-primary">{">"}</span> estatisticas_sistema
        </h3>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-muted/20 border border-primary/20">
          <div className="flex items-center gap-2 mb-2">
            <Database className="w-4 h-4 text-primary" />
            <span className="text-xs font-mono text-muted-foreground">DNA_DATABASE</span>
          </div>
          <p className="text-2xl font-bold text-primary">{stats.totalMusicas}</p>
          <p className="text-xs text-muted-foreground">músicas únicas</p>
        </div>

        <div className="p-4 rounded-xl bg-muted/20 border border-secondary/20">
          <div className="flex items-center gap-2 mb-2">
            <Radio className="w-4 h-4 text-secondary" />
            <span className="text-xs font-mono text-muted-foreground">RADIOS_ATIVAS</span>
          </div>
          <p className="text-2xl font-bold text-secondary">{stations.length}</p>
          <p className="text-xs text-muted-foreground">estações</p>
        </div>
      </div>

      {/* Por Rádio */}
      <div className="space-y-3">
        <h4 className="text-xs font-mono text-muted-foreground">
          <span className="text-accent">$</span> execucoes_por_radio
        </h4>
        {Object.entries(stats.porRadio).map(([radio, count]) => (
          <div key={radio} className="flex items-center justify-between p-2 rounded-lg bg-muted/10">
            <span className={`font-mono text-sm ${radioColors[radio] || "text-foreground"}`}>
              {radioNames[radio] || radio.toUpperCase()}
            </span>
            <span className="text-sm font-bold text-foreground">{count}</span>
          </div>
        ))}
      </div>

      {/* TOP 10 */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-accent" />
          <h4 className="text-xs font-mono text-muted-foreground">
            top_10_mais_tocadas
          </h4>
        </div>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {topTracks.map((item, index) => (
            <div
              key={item.track.dna}
              className="flex items-center gap-3 p-2 rounded-lg bg-muted/10 hover:bg-muted/20 transition-colors"
            >
              <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                {index + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {item.track.title}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {item.track.artist}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-primary">{item.count}x</p>
                <div className="flex gap-1">
                  {item.radios.map((radio) => (
                    <span
                      key={radio}
                      className={`text-[10px] ${radioColors[radio] || "text-muted-foreground"}`}
                    >
                      {radio.toUpperCase()}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Última atualização */}
      <div className="text-xs font-mono text-muted-foreground text-center border-t border-muted/20 pt-4">
        <span className="text-primary">última_atualizacao:</span> {stats.ultimaAtualizacao}
      </div>
    </div>
  );
};

export default StatsCard;
