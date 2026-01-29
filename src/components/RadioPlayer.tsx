import { useState, useMemo, lazy, Suspense, memo } from "react";
import { Radio, Activity, Search, Dna, Settings2, Terminal, TrendingUp, Calendar, BarChart3, FileText } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRadioData } from "@/hooks/useRadioData";
import type { Station } from "@/types/radio";

// Componentes carregados de forma lazy para melhor performance
const MonitorTab = lazy(() => import("./monitor/MonitorTab"));
const RankingMonitor = lazy(() => import("./RankingMonitor"));
const GradeView = lazy(() => import("./GradeView"));
const DNAViewer = lazy(() => import("./DNAViewer"));
const DeezerSearch = lazy(() => import("./DeezerSearch"));
const ArlConfig = lazy(() => import("./ArlConfig"));
const RadioReport = lazy(() => import("./RadioReport"));
const StatsCard = lazy(() => import("./StatsCard"));
const StationManager = lazy(() => import("./StationManager"));
const PythonScripts = lazy(() => import("./PythonScripts"));
const SystemDashboard = lazy(() => import("./SystemDashboard"));

// Loading fallback component
const TabLoading = memo(function TabLoading() {
  return (
    <div className="glass-card p-8 flex items-center justify-center min-h-[200px]">
      <div className="flex items-center gap-3">
        <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
        <span className="text-sm font-mono text-muted-foreground">Carregando...</span>
      </div>
    </div>
  );
});

// Tab configuration for cleaner rendering
const TAB_CONFIG = [
  { value: "dashboard", icon: Activity, label: "Dashboard", activeClass: "data-[state=active]:bg-primary/20 data-[state=active]:text-primary" },
  { value: "monitor", icon: Radio, label: "Monitor", activeClass: "data-[state=active]:bg-cyan-400/20 data-[state=active]:text-cyan-400" },
  { value: "ranking", icon: TrendingUp, label: "Ranking", activeClass: "data-[state=active]:bg-yellow-400/20 data-[state=active]:text-yellow-400" },
  { value: "grade", icon: Calendar, label: "Grade", activeClass: "data-[state=active]:bg-green-400/20 data-[state=active]:text-green-400" },
  { value: "dna", icon: Dna, label: "DNA", activeClass: "data-[state=active]:bg-secondary/20 data-[state=active]:text-secondary" },
  { value: "deezer", icon: Search, label: "Deezer", activeClass: "data-[state=active]:bg-pink-400/20 data-[state=active]:text-pink-400" },
  { value: "relatorio", icon: FileText, label: "Relatório", activeClass: "data-[state=active]:bg-orange-400/20 data-[state=active]:text-orange-400" },
  { value: "estatisticas", icon: BarChart3, label: "Stats", activeClass: "data-[state=active]:bg-accent/20 data-[state=active]:text-accent" },
  { value: "gerenciar", icon: Settings2, label: "Config", activeClass: "data-[state=active]:bg-primary/20 data-[state=active]:text-primary" },
  { value: "scripts", icon: Terminal, label: "Python", activeClass: "data-[state=active]:bg-secondary/20 data-[state=active]:text-secondary" },
] as const;

const RadioPlayer = memo(function RadioPlayer() {
  const { stations: initialStations, lastUpdate } = useRadioData();
  const [stations, setStations] = useState<Station[]>(initialStations);
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full grid grid-cols-5 md:grid-cols-10 bg-muted/30 border border-muted/50 p-1 h-auto">
          {TAB_CONFIG.map(({ value, icon: Icon, label, activeClass }) => (
            <TabsTrigger
              key={value}
              value={value}
              className={`font-mono text-[10px] md:text-xs py-2 ${activeClass}`}
            >
              <Icon className="w-3 h-3 md:w-4 md:h-4 md:mr-2" />
              <span className="hidden md:inline">{label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <Suspense fallback={<TabLoading />}>
          <TabsContent value="dashboard" className="mt-6">
            <SystemDashboard stations={stations} lastUpdate={lastUpdate} />
          </TabsContent>

          <TabsContent value="monitor" className="mt-6">
            <MonitorTab stations={stations} />
          </TabsContent>

          <TabsContent value="ranking" className="mt-6">
            <RankingMonitor stations={stations} />
          </TabsContent>

          <TabsContent value="grade" className="mt-6">
            <GradeView stations={stations} />
          </TabsContent>

          <TabsContent value="dna" className="mt-6">
            <DNAViewer stations={stations} />
          </TabsContent>

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

          <TabsContent value="relatorio" className="mt-6">
            <RadioReport stations={stations} lastUpdate={lastUpdate} />
          </TabsContent>

          <TabsContent value="estatisticas" className="mt-6">
            <StatsCard stations={stations} lastUpdate={lastUpdate} />
          </TabsContent>

          <TabsContent value="gerenciar" className="mt-6">
            <StationManager stations={stations} onStationsChange={setStations} />
          </TabsContent>

          <TabsContent value="scripts" className="mt-6">
            <PythonScripts />
          </TabsContent>
        </Suspense>
      </Tabs>
    </div>
  );
});

export default RadioPlayer;
