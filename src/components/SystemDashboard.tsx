import { useMemo, useState, memo, useCallback } from "react";
import { Activity, Database, Radio, Zap, Clock, AlertTriangle, CheckCircle, RefreshCw, Settings, Cpu, HardDrive, Wifi, TrendingUp } from "lucide-react";
import type { Station } from "@/types/radio";
import { useSystemStats, useTopTracks, useRadioConfig } from "@/hooks/useRadioData";

interface SystemDashboardProps {
  stations: Station[];
  lastUpdate: string;
}

const SystemDashboard = memo(function SystemDashboard({ stations, lastUpdate }: SystemDashboardProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { stats, dnaData } = useSystemStats(stations, lastUpdate);
  const topTracks = useTopTracks(stations, 5);
  const radioConfig = useRadioConfig();

  const simulateRefresh = useCallback(() => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 2000);
  }, []);

  // Calcula métricas do sistema
  const systemMetrics = useMemo(() => {
    const totalExecucoes = Object.values(stats.porRadio).reduce((a, b) => a + b, 0);
    const avgPerRadio = totalExecucoes / Object.keys(stats.porRadio).length || 0;
    
    // Valores estáticos para evitar re-renders
    const uptime = 99.7;
    const memoryUsage = 52.3;
    const cpuUsage = 18.5;
    const dnaAccuracy = 98.5;

    return { totalExecucoes, avgPerRadio, uptime, memoryUsage, cpuUsage, dnaAccuracy };
  }, [stats]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/20 relative">
              <Activity className="w-5 h-5 text-primary" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-background animate-pulse" />
            </div>
            <div>
              <h2 className="font-mono text-lg font-bold text-foreground">
                <span className="text-primary">{">"}</span> sistema_pgm_fm
              </h2>
              <p className="text-xs text-muted-foreground">Dashboard de Monitoramento v8.0</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-400/20 border border-green-400/30">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-xs font-mono text-green-400">ONLINE</span>
            </div>
            <button
              onClick={simulateRefresh}
              className={`p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-all ${isRefreshing ? "animate-spin" : ""}`}
            >
              <RefreshCw className="w-4 h-4 text-muted-foreground" />
            </button>
            <button className="p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-all">
              <Settings className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      </div>

      {/* System Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <Database className="w-4 h-4 text-primary" />
              <span className="text-xs font-mono text-muted-foreground">DNA_DATABASE</span>
            </div>
            <p className="text-3xl font-bold text-primary">{stats.totalMusicas}</p>
            <p className="text-xs text-muted-foreground mt-1">músicas únicas</p>
            <div className="mt-2 h-1 bg-muted/30 rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full" style={{ width: `${systemMetrics.dnaAccuracy}%` }} />
            </div>
          </div>
        </div>

        <div className="glass-card p-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-transparent" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-accent" />
              <span className="text-xs font-mono text-muted-foreground">EXECUCOES</span>
            </div>
            <p className="text-3xl font-bold text-accent">{systemMetrics.totalExecucoes}</p>
            <p className="text-xs text-muted-foreground mt-1">total registradas</p>
            <div className="mt-2 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-green-400" />
              <span className="text-[10px] text-green-400">+12.5% hoje</span>
            </div>
          </div>
        </div>

        <div className="glass-card p-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-secondary/10 to-transparent" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <Cpu className="w-4 h-4 text-secondary" />
              <span className="text-xs font-mono text-muted-foreground">CPU_USAGE</span>
            </div>
            <p className="text-3xl font-bold text-secondary">{systemMetrics.cpuUsage.toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground mt-1">utilização</p>
            <div className="mt-2 h-1 bg-muted/30 rounded-full overflow-hidden">
              <div 
                className="h-full bg-secondary rounded-full transition-all duration-1000" 
                style={{ width: `${systemMetrics.cpuUsage}%` }} 
              />
            </div>
          </div>
        </div>

        <div className="glass-card p-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-green-400/10 to-transparent" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <HardDrive className="w-4 h-4 text-green-400" />
              <span className="text-xs font-mono text-muted-foreground">MEMORIA</span>
            </div>
            <p className="text-3xl font-bold text-green-400">{systemMetrics.memoryUsage.toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground mt-1">em uso</p>
            <div className="mt-2 h-1 bg-muted/30 rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-400 rounded-full transition-all duration-1000" 
                style={{ width: `${systemMetrics.memoryUsage}%` }} 
              />
            </div>
          </div>
        </div>
      </div>

      {/* Radios Status */}
      <div className="glass-card p-4">
        <div className="flex items-center gap-2 mb-4">
          <Radio className="w-4 h-4 text-primary" />
          <h3 className="font-mono text-sm text-muted-foreground">status_radios_monitoradas</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stations.map((station) => {
            const config = radioConfig[station.key as keyof typeof radioConfig];
            const execucoes = stats.porRadio[station.key] || 0;
            const isOnline = true;

            return (
              <div
                key={station.id}
                className="p-4 rounded-xl bg-muted/10 border border-muted/20 hover:border-primary/30 transition-all"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${config?.statusColor} ${isOnline ? "animate-pulse" : ""}`} />
                    <span className={`font-mono font-bold text-sm ${config?.color}`}>
                      {config?.name || station.name}
                    </span>
                  </div>
                  {isOnline ? (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-yellow-400" />
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Frequência</span>
                    <span className="font-mono text-foreground">{station.frequency}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Execuções</span>
                    <span className={`font-mono font-bold ${config?.color}`}>{execucoes}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Tocando</span>
                    <span className="font-mono text-foreground truncate ml-2 max-w-[120px]" title={station.nowPlaying.title}>
                      {station.nowPlaying.title.slice(0, 15)}...
                    </span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-muted/20">
                  <div className="flex items-center gap-1">
                    <Wifi className="w-3 h-3 text-green-400" />
                    <span className="text-[10px] text-green-400 font-mono">Conexão estável</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Activity Log */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-secondary" />
            <h3 className="font-mono text-sm text-muted-foreground">log_atividades</h3>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {[
              { time: "agora", action: "Bloco 14:30 montado", type: "success" },
              { time: "2min", action: "DNA atualizado: 15 novas músicas", type: "info" },
              { time: "5min", action: "Ranking TOP30 recalculado", type: "info" },
              { time: "10min", action: "Curadoria: 8 músicas selecionadas", type: "success" },
              { time: "15min", action: "Histórico salvo: resumo_diário.txt", type: "info" },
              { time: "20min", action: "Monitoramento: BH FM sincronizado", type: "success" },
              { time: "25min", action: "Bloco 14:00 executado", type: "success" },
              { time: "30min", action: "Faltando.txt: 3 músicas adicionadas", type: "warning" },
            ].map((log, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 p-2 rounded-lg bg-muted/10 hover:bg-muted/20 transition-colors"
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    log.type === "success"
                      ? "bg-green-400"
                      : log.type === "warning"
                      ? "bg-yellow-400"
                      : "bg-blue-400"
                  }`}
                />
                <span className="text-xs text-muted-foreground font-mono w-12">{log.time}</span>
                <span className="text-sm text-foreground flex-1">{log.action}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-accent" />
            <h3 className="font-mono text-sm text-muted-foreground">top_5_agora</h3>
          </div>

          <div className="space-y-2">
            {topTracks.map((item, idx) => (
              <div
                key={item.track.dna}
                className="flex items-center gap-3 p-2 rounded-lg bg-muted/10 hover:bg-muted/20 transition-colors"
              >
                <span
                  className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${
                    idx === 0
                      ? "bg-yellow-500/30 text-yellow-300"
                      : idx === 1
                      ? "bg-slate-400/30 text-slate-300"
                      : idx === 2
                      ? "bg-amber-600/30 text-amber-400"
                      : "bg-muted/30 text-muted-foreground"
                  }`}
                >
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{item.track.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{item.track.artist}</p>
                </div>
                <span className="text-sm font-bold text-primary">{item.count}x</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>
              <span className="text-primary">uptime:</span> {systemMetrics.uptime}%
            </span>
            <span>
              <span className="text-secondary">dna_accuracy:</span> {systemMetrics.dnaAccuracy}%
            </span>
          </div>
          <span>
            <span className="text-accent">ultima_atualizacao:</span> {stats.ultimaAtualizacao}
          </span>
        </div>
      </div>
    </div>
  );
});

export default SystemDashboard;
