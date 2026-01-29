import { useState, useMemo } from "react";
import RankingMonitor from "./RankingMonitor";
import { Radio, Clock, Music, Wifi, FileText, BarChart3, Calendar, TrendingUp, Search, Dna, Activity, Settings2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StatsCard from "./StatsCard";
import GradeView from "./GradeView";
import RadioReport from "./RadioReport";
import ArlConfig from "./ArlConfig";
import DeezerSearch from "./DeezerSearch";
import SystemDashboard from "./SystemDashboard";
import DNAViewer from "./DNAViewer";
import StationManager from "./StationManager";
import rawRadioData from "@/data/radioData.json";
import { parseRadioData } from "@/utils/parseRadioData";
import type { RawRadioData, Station } from "@/types/radio";

const RadioPlayer = () => {
  const initialStations = useMemo(() => {
    return parseRadioData(rawRadioData as RawRadioData);
  }, []);

  const [stations, setStations] = useState<Station[]>(initialStations);

  const lastUpdate = useMemo(() => {
    return (rawRadioData as RawRadioData).ultima_atualizacao || "";
  }, []);

  const [currentStationIndex, setCurrentStationIndex] = useState(0);
  const [activeTab, setActiveTab] = useState("dashboard");

  const station: Station | undefined = stations[currentStationIndex];

  const radioColors: Record<string, string> = {
    bh: "border-cyan-400 bg-cyan-400/10",
    band: "border-purple-400 bg-purple-400/10",
    clube: "border-green-400 bg-green-400/10",
    globo: "border-yellow-400 bg-yellow-400/10",
  };

  if (!station) {
    return (
      <div className="glass-card p-8 neon-border text-center">
        <p className="text-muted-foreground">Carregando estações...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full grid grid-cols-5 md:grid-cols-9 bg-muted/30 border border-muted/50 p-1 h-auto">
          <TabsTrigger
            value="dashboard" 
            className="font-mono text-[10px] md:text-xs data-[state=active]:bg-primary/20 data-[state=active]:text-primary py-2"
          >
            <Activity className="w-3 h-3 md:w-4 md:h-4 md:mr-2" />
            <span className="hidden md:inline">Dashboard</span>
          </TabsTrigger>
          <TabsTrigger 
            value="monitor" 
            className="font-mono text-[10px] md:text-xs data-[state=active]:bg-cyan-400/20 data-[state=active]:text-cyan-400 py-2"
          >
            <Radio className="w-3 h-3 md:w-4 md:h-4 md:mr-2" />
            <span className="hidden md:inline">Monitor</span>
          </TabsTrigger>
          <TabsTrigger 
            value="ranking" 
            className="font-mono text-[10px] md:text-xs data-[state=active]:bg-yellow-400/20 data-[state=active]:text-yellow-400 py-2"
          >
            <TrendingUp className="w-3 h-3 md:w-4 md:h-4 md:mr-2" />
            <span className="hidden md:inline">Ranking</span>
          </TabsTrigger>
          <TabsTrigger 
            value="grade" 
            className="font-mono text-[10px] md:text-xs data-[state=active]:bg-green-400/20 data-[state=active]:text-green-400 py-2"
          >
            <Calendar className="w-3 h-3 md:w-4 md:h-4 md:mr-2" />
            <span className="hidden md:inline">Grade</span>
          </TabsTrigger>
          <TabsTrigger 
            value="dna" 
            className="font-mono text-[10px] md:text-xs data-[state=active]:bg-secondary/20 data-[state=active]:text-secondary py-2"
          >
            <Dna className="w-3 h-3 md:w-4 md:h-4 md:mr-2" />
            <span className="hidden md:inline">DNA</span>
          </TabsTrigger>
          <TabsTrigger 
            value="deezer" 
            className="font-mono text-[10px] md:text-xs data-[state=active]:bg-pink-400/20 data-[state=active]:text-pink-400 py-2"
          >
            <Search className="w-3 h-3 md:w-4 md:h-4 md:mr-2" />
            <span className="hidden md:inline">Deezer</span>
          </TabsTrigger>
          <TabsTrigger 
            value="relatorio" 
            className="font-mono text-[10px] md:text-xs data-[state=active]:bg-orange-400/20 data-[state=active]:text-orange-400 py-2"
          >
            <FileText className="w-3 h-3 md:w-4 md:h-4 md:mr-2" />
            <span className="hidden md:inline">Relatório</span>
          </TabsTrigger>
          <TabsTrigger 
            value="estatisticas" 
            className="font-mono text-[10px] md:text-xs data-[state=active]:bg-accent/20 data-[state=active]:text-accent py-2"
          >
            <BarChart3 className="w-3 h-3 md:w-4 md:h-4 md:mr-2" />
            <span className="hidden md:inline">Stats</span>
          </TabsTrigger>
          <TabsTrigger 
            value="gerenciar" 
            className="font-mono text-[10px] md:text-xs data-[state=active]:bg-primary/20 data-[state=active]:text-primary py-2"
          >
            <Settings2 className="w-3 h-3 md:w-4 md:h-4 md:mr-2" />
            <span className="hidden md:inline">Config</span>
          </TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="mt-6">
          <SystemDashboard stations={stations} lastUpdate={lastUpdate} />
        </TabsContent>

        {/* Monitor Tab */}
        <TabsContent value="monitor" className="mt-6">
          {/* Station List & Recent Tracks */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Station List */}
            <div className="glass-card p-6">
              <h3 className="font-mono text-sm text-muted-foreground mb-4">
                <span className="text-primary">{">"}</span> estacoes_monitoradas
              </h3>
              <div className="space-y-2">
                {stations.map((s, i) => (
                  <button
                    key={s.id}
                    onClick={() => setCurrentStationIndex(i)}
                    className={`w-full p-4 rounded-xl text-left transition-all border-l-4 ${
                      i === currentStationIndex
                        ? `${radioColors[s.key]} border border-primary/50 glow-primary`
                        : "bg-muted/30 hover:bg-muted/50 border-transparent border"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className={`font-semibold ${i === currentStationIndex ? "text-primary" : "text-foreground"}`}>
                            {s.name}
                          </h4>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground">
                            {s.key.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground font-mono">{s.genre}</p>
                        <p className="text-xs text-accent/70 font-mono">{s.frequency}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-foreground font-medium truncate max-w-[150px]">
                          {s.nowPlaying.title}
                        </p>
                        <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                          {s.nowPlaying.artist}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Recent Tracks */}
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-mono text-sm text-muted-foreground">
                  <span className="text-secondary">{">"}</span> ultimas_tocadas
                </h3>
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-primary" />
                  <span className="text-sm font-mono text-primary">{station.name}</span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-accent/20 text-accent">
                    {station.frequency}
                  </span>
                </div>
              </div>

              {/* Now Playing */}
              <div className="p-4 mb-4 rounded-xl bg-primary/10 border border-primary/30">
                <div className="flex items-center gap-2 mb-2">
                  <Wifi className="w-3 h-3 text-primary animate-pulse" />
                  <span className="text-xs font-mono text-primary">TOCANDO AGORA</span>
                </div>
                <p className="font-semibold text-foreground">{station.nowPlaying.title}</p>
                <p className="text-sm text-muted-foreground">{station.nowPlaying.artist}</p>
                <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full bg-accent/20 text-accent text-xs font-mono">
                  <Clock className="w-3 h-3" />
                  {station.nowPlaying.timeAgo}
                </span>
              </div>

              <div className="space-y-3">
                {station.recentTracks.slice(0, 5).map((track, i) => (
                  <div
                    key={`${track.dna}-${i}`}
                    className="flex items-center gap-4 p-3 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg bg-secondary/20 flex items-center justify-center">
                      <Music className="w-5 h-5 text-secondary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{track.title}</p>
                      <p className="text-sm text-muted-foreground truncate">{track.artist}</p>
                    </div>
                    <span className="text-xs font-mono text-muted-foreground whitespace-nowrap">
                      {track.timeAgo}
                    </span>
                  </div>
                ))}
              </div>

              {/* Histórico Completo */}
              {station.historico.length > 0 && (
                <div className="mt-6 pt-4 border-t border-muted/20">
                  <h4 className="font-mono text-xs text-muted-foreground mb-3">
                    <span className="text-accent">$</span> historico_completo ({station.historico.length})
                  </h4>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {station.historico.slice(0, 10).map((track, i) => (
                      <div
                        key={`hist-${track.dna}-${i}`}
                        className="flex items-center justify-between p-2 rounded bg-muted/10 text-xs"
                      >
                        <span className="text-foreground truncate flex-1">{track.artist} - {track.title}</span>
                        <span className="text-muted-foreground ml-2">{track.timeAgo}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Ranking Tab */}
        <TabsContent value="ranking" className="mt-6">
          <RankingMonitor stations={stations} />
        </TabsContent>

        {/* Grade Tab */}
        <TabsContent value="grade" className="mt-6">
          <div className="space-y-6">
            <GradeView stations={stations} />
          </div>
        </TabsContent>

        {/* DNA Tab */}
        <TabsContent value="dna" className="mt-6">
          <DNAViewer stations={stations} />
        </TabsContent>

        {/* Deezer Tab */}
        <TabsContent value="deezer" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-1">
              <ArlConfig />
            </div>
            <div className="lg:col-span-2">
              <DeezerSearch />
            </div>
          </div>
        </TabsContent>

        {/* Relatório Tab */}
        <TabsContent value="relatorio" className="mt-6">
          <RadioReport stations={stations} lastUpdate={lastUpdate} />
        </TabsContent>

        {/* Estatísticas Tab */}
        <TabsContent value="estatisticas" className="mt-6">
          <StatsCard stations={stations} lastUpdate={lastUpdate} />
        </TabsContent>

        {/* Gerenciar Tab */}
        <TabsContent value="gerenciar" className="mt-6">
          <StationManager stations={stations} onStationsChange={setStations} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RadioPlayer;
