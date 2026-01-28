import { useMemo } from "react";
import { Radio, Clock, Music, Wifi, FileText, AlertCircle } from "lucide-react";
import type { Station } from "@/types/radio";

interface RadioReportProps {
  stations: Station[];
  lastUpdate: string;
}

const RadioReport = ({ stations, lastUpdate }: RadioReportProps) => {
  const formattedDate = useMemo(() => {
    if (!lastUpdate) return new Date().toLocaleString("pt-BR");
    try {
      return new Date(lastUpdate).toLocaleString("pt-BR");
    } catch {
      return lastUpdate;
    }
  }, [lastUpdate]);

  const radioColors: Record<string, string> = {
    bh: "border-l-cyan-400",
    band: "border-l-purple-400",
    clube: "border-l-green-400",
    globo: "border-l-yellow-400",
  };

  const radioIcons: Record<string, string> = {
    bh: "📻",
    band: "📡",
    clube: "🎧",
    globo: "🌐",
  };

  return (
    <div className="glass-card p-6 space-y-6">
      {/* Header do Relatório */}
      <div className="text-center border-b border-muted/30 pb-6">
        <div className="flex items-center justify-center gap-2 mb-2">
          <FileText className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-bold font-mono text-primary">
            RELATÓRIO DE MONITORAMENTO DE RÁDIOS
          </h2>
        </div>
        <div className="flex items-center justify-center gap-4 text-sm font-mono text-muted-foreground">
          <span>📅 Gerado em: {formattedDate}</span>
          <span>📊 Total de rádios: {stations.length}</span>
        </div>
      </div>

      {/* Cards de cada rádio */}
      <div className="space-y-6">
        {stations.map((station) => (
          <div
            key={station.id}
            className={`border-l-4 ${radioColors[station.key] || "border-l-primary"} bg-muted/10 rounded-r-xl p-5`}
          >
            {/* Header da rádio */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{radioIcons[station.key] || "📻"}</span>
                <div>
                  <h3 className="text-lg font-bold text-foreground">
                    {station.name}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                    <Wifi className="w-3 h-3" />
                    <span>{station.frequency}</span>
                    <span className="px-1.5 py-0.5 rounded bg-muted/50">
                      {station.key.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
              <a
                href={station.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-mono text-primary hover:underline"
              >
                🔗 URL
              </a>
            </div>

            {/* Tocando Agora */}
            <div className="mb-4 p-4 rounded-lg bg-primary/10 border border-primary/30">
              <div className="flex items-center gap-2 mb-2">
                <Radio className="w-4 h-4 text-primary animate-pulse" />
                <span className="text-xs font-mono font-bold text-primary">
                  🎵 TOCANDO AGORA:
                </span>
              </div>
              <div className="ml-6">
                <p className="text-lg font-semibold text-foreground">
                  {station.nowPlaying.title}
                </p>
                <p className="text-muted-foreground">
                  {station.nowPlaying.artist}
                </p>
                <span className="inline-flex items-center gap-1 mt-1 text-xs font-mono text-accent">
                  <Clock className="w-3 h-3" />
                  {station.nowPlaying.timeAgo}
                </span>
              </div>
            </div>

            {/* Últimas Tocadas */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Music className="w-4 h-4 text-secondary" />
                <span className="text-xs font-mono font-bold text-secondary">
                  📜 ÚLTIMAS TOCADAS:
                </span>
              </div>
              <div className="space-y-2 ml-6">
                {station.recentTracks.length > 0 ? (
                  station.recentTracks.slice(0, 5).map((track, index) => (
                    <div
                      key={`${track.dna}-${index}`}
                      className="flex items-baseline gap-2 text-sm"
                    >
                      <span className="text-muted-foreground font-mono">
                        {index + 1}.
                      </span>
                      <span className="text-foreground font-medium">
                        {track.title}
                      </span>
                      <span className="text-muted-foreground">-</span>
                      <span className="text-muted-foreground">
                        {track.artist}
                      </span>
                      <span className="text-xs text-accent ml-auto font-mono">
                        {track.timeAgo}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <AlertCircle className="w-4 h-4" />
                    Sem dados disponíveis
                  </div>
                )}
              </div>
            </div>

            {/* Histórico Completo (resumo) */}
            {station.historico.length > 0 && (
              <div className="mt-4 pt-4 border-t border-muted/20">
                <span className="text-xs font-mono text-muted-foreground">
                  📂 Histórico completo: {station.historico.length} músicas registradas
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer do Relatório */}
      <div className="text-center border-t border-muted/30 pt-4">
        <div className="text-xs font-mono text-muted-foreground">
          {"═".repeat(40)}
        </div>
        <p className="text-sm font-mono text-muted-foreground mt-2">
          Fim do relatório
        </p>
      </div>
    </div>
  );
};

export default RadioReport;
