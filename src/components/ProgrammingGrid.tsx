import { useMemo, useState } from "react";
import { Clock, Calendar, Music, Radio, Zap, ChevronLeft, ChevronRight, Play, Pause, AlertCircle } from "lucide-react";
import type { Station, Track } from "@/types/radio";
import { getTopTracks, buildDNAData } from "@/utils/parseRadioData";
import { getFileName } from "@/utils/dnaUtils";

interface ProgrammingGridProps {
  stations: Station[];
}

interface BlockEntry {
  file: string;
  source: string;
  dna?: string;
}

interface TimeBlock {
  time: string;
  entries: BlockEntry[];
  isCurrentBlock: boolean;
  isNextBlock: boolean;
}

const sourceConfig: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  BH: { label: "BH FM", color: "text-cyan-400", bg: "bg-cyan-400/20", icon: "📻" },
  BAND: { label: "Band FM", color: "text-purple-400", bg: "bg-purple-400/20", icon: "📻" },
  CLUBE: { label: "Clube FM", color: "text-green-400", bg: "bg-green-400/20", icon: "📻" },
  GLOBO: { label: "Globo FM", color: "text-yellow-400", bg: "bg-yellow-400/20", icon: "📻" },
  CURADORIA_BH: { label: "Curadoria BH", color: "text-cyan-300", bg: "bg-cyan-300/15", icon: "🎯" },
  CURADORIA_BAND: { label: "Curadoria Band", color: "text-purple-300", bg: "bg-purple-300/15", icon: "🎯" },
  CURADORIA_CLUBE: { label: "Curadoria Clube", color: "text-green-300", bg: "bg-green-300/15", icon: "🎯" },
  CURADORIA_GLOBO: { label: "Curadoria Globo", color: "text-yellow-300", bg: "bg-yellow-300/15", icon: "🎯" },
  CURADORIA: { label: "Curadoria", color: "text-blue-400", bg: "bg-blue-400/20", icon: "🎯" },
  TOP30: { label: "TOP 30", color: "text-amber-400", bg: "bg-amber-400/20", icon: "🏆" },
  ROMANTICO: { label: "Romântico", color: "text-pink-400", bg: "bg-pink-400/20", icon: "💕" },
  CONTEUDO: { label: "Conteúdo", color: "text-orange-400", bg: "bg-orange-400/20", icon: "📢" },
  VHT: { label: "VHT", color: "text-slate-400", bg: "bg-slate-400/20", icon: "🎵" },
  CORINGA: { label: "Coringa", color: "text-red-400", bg: "bg-red-400/20", icon: "🃏" },
};

const ProgrammingGrid = ({ stations }: ProgrammingGridProps) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [expandedBlock, setExpandedBlock] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  // Gera os blocos simulados baseados nos dados das rádios
  const timeBlocks = useMemo(() => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentBlockTime = `${currentHour.toString().padStart(2, "0")}:${currentMinute < 30 ? "00" : "30"}`;
    const nextHour = currentMinute < 30 ? currentHour : (currentHour + 1) % 24;
    const nextMinute = currentMinute < 30 ? "30" : "00";
    const nextBlockTime = `${nextHour.toString().padStart(2, "0")}:${nextMinute}`;

    const topTracks = getTopTracks(stations, 30);
    const dnaData = buildDNAData(stations);
    const blocks: TimeBlock[] = [];

    // Gera blocos de 30 minutos para o dia
    for (let h = 0; h < 24; h++) {
      for (const m of [0, 30]) {
        const timeStr = `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
        const entries: BlockEntry[] = [];

        // Simula a distribuição por rádio (baseado no config do PGM-FM)
        const distribution = [
          { radio: "bh", positions: [1, 2, 3] },
          { radio: "band", positions: [4, 5, 6] },
          { radio: "clube", positions: [7, 8] },
          { radio: "globo", positions: [9, 10] },
        ];

        // Horários especiais
        const isTop30Block = h >= 17 && h < 19 && [0, 1, 2, 3, 4].includes(now.getDay());
        const isRomanticBlock = h >= 22 && h < 24 && [0, 1, 2, 3, 4].includes(now.getDay());

        if (isTop30Block) {
          // Bloco TOP 30
          entries.push({ file: `CONTAGEM_REGRESSIVA_${h}H.mp3`, source: "CONTEUDO" });
          const top10 = topTracks.slice(0, 10);
          top10.forEach((item, idx) => {
            if (idx > 0) entries.push({ file: "vht", source: "VHT" });
            entries.push({
              file: getFileName(item.track.artist, item.track.title),
              source: "TOP30",
              dna: item.track.dna,
            });
          });
        } else if (isRomanticBlock) {
          // Bloco Romântico
          entries.push({ file: `ROMANCE_BLOCO${m === 0 ? 1 : 2}.mp3`, source: "CONTEUDO" });
          for (let i = 0; i < 4; i++) {
            entries.push({ file: `romantica_${i + 1}.mp3`, source: "ROMANTICO" });
            entries.push({ file: "vht", source: "VHT" });
          }
        } else {
          // Bloco normal com distribuição por rádio
          distribution.forEach(({ radio, positions }) => {
            const station = stations.find((s) => s.key === radio);
            if (!station) return;

            positions.forEach((pos, idx) => {
              const trackIdx = (h * 2 + (m === 30 ? 1 : 0) + pos) % Math.max(station.historico.length, 1);
              const track = station.historico[trackIdx] || station.nowPlaying;

              if (pos > 1) entries.push({ file: "vht", source: "VHT" });

              // Decide fonte (monitoramento ou curadoria)
              const isFromMonitoring = Math.random() > 0.3;
              const source = isFromMonitoring ? radio.toUpperCase() : `CURADORIA_${radio.toUpperCase()}`;

              entries.push({
                file: getFileName(track.artist, track.title),
                source,
                dna: track.dna,
              });
            });
          });
        }

        blocks.push({
          time: timeStr,
          entries,
          isCurrentBlock: timeStr === currentBlockTime,
          isNextBlock: timeStr === nextBlockTime,
        });
      }
    }

    return blocks;
  }, [stations, selectedDate]);

  const getSourceConfig = (source: string) => {
    return sourceConfig[source] || { label: source, color: "text-muted-foreground", bg: "bg-muted/20", icon: "🎵" };
  };

  const formatDate = (date: Date) => {
    const days = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
    return `${days[date.getDay()]}, ${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}`;
  };

  const changeDate = (delta: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + delta);
    setSelectedDate(newDate);
  };

  // Estatísticas do dia
  const stats = useMemo(() => {
    let totalSongs = 0;
    let bySource: Record<string, number> = {};

    timeBlocks.forEach((block) => {
      block.entries.forEach((entry) => {
        if (entry.source !== "VHT") {
          totalSongs++;
          bySource[entry.source] = (bySource[entry.source] || 0) + 1;
        }
      });
    });

    return { totalSongs, bySource };
  }, [timeBlocks]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-400/20">
              <Calendar className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <h2 className="font-mono text-lg font-bold text-foreground">
                <span className="text-green-400">{">"}</span> grade_programacao
              </h2>
              <p className="text-xs text-muted-foreground">Sistema PGM-FM v8.0</p>
            </div>
          </div>

          {/* Date Navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => changeDate(-1)}
              className="p-2 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="px-4 py-2 rounded-lg bg-muted/30 border border-muted/50 font-mono text-sm">
              {formatDate(selectedDate)}
            </div>
            <button
              onClick={() => changeDate(1)}
              className="p-2 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Simulate Button */}
          <button
            onClick={() => setIsSimulating(!isSimulating)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-sm transition-all ${
              isSimulating
                ? "bg-green-400/30 text-green-400 border border-green-400/50"
                : "bg-muted/30 text-muted-foreground hover:bg-muted/40"
            }`}
          >
            {isSimulating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {isSimulating ? "Simulando..." : "Simular"}
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Music className="w-4 h-4 text-primary" />
            <span className="text-xs font-mono text-muted-foreground">TOTAL_MUSICAS</span>
          </div>
          <p className="text-2xl font-bold text-primary">{stats.totalSongs}</p>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Radio className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-mono text-muted-foreground">MONITORAMENTO</span>
          </div>
          <p className="text-2xl font-bold text-cyan-400">
            {(stats.bySource["BH"] || 0) + (stats.bySource["BAND"] || 0) + (stats.bySource["CLUBE"] || 0) + (stats.bySource["GLOBO"] || 0)}
          </p>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-mono text-muted-foreground">CURADORIA</span>
          </div>
          <p className="text-2xl font-bold text-blue-400">
            {Object.entries(stats.bySource)
              .filter(([k]) => k.startsWith("CURADORIA"))
              .reduce((acc, [, v]) => acc + v, 0)}
          </p>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <span className="text-xs font-mono text-muted-foreground">CORINGAS</span>
          </div>
          <p className="text-2xl font-bold text-red-400">{stats.bySource["CORINGA"] || 0}</p>
        </div>
      </div>

      {/* Time Blocks Grid */}
      <div className="glass-card p-4">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-4 h-4 text-accent" />
          <h3 className="font-mono text-sm text-muted-foreground">blocos_horarios</h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {timeBlocks.map((block) => (
            <button
              key={block.time}
              onClick={() => setExpandedBlock(expandedBlock === block.time ? null : block.time)}
              className={`p-3 rounded-xl text-left transition-all border ${
                block.isCurrentBlock
                  ? "bg-primary/20 border-primary/50 ring-2 ring-primary/30"
                  : block.isNextBlock
                  ? "bg-accent/20 border-accent/50"
                  : expandedBlock === block.time
                  ? "bg-muted/30 border-primary/30"
                  : "bg-muted/10 border-muted/20 hover:bg-muted/20"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`font-mono text-sm font-bold ${
                    block.isCurrentBlock ? "text-primary" : block.isNextBlock ? "text-accent" : "text-foreground"
                  }`}
                >
                  {block.time}
                </span>
                {block.isCurrentBlock && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/30 text-primary font-mono">ATUAL</span>
                )}
                {block.isNextBlock && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent/30 text-accent font-mono">PROX</span>
                )}
              </div>

              <div className="flex flex-wrap gap-1">
                {block.entries
                  .filter((e) => e.source !== "VHT")
                  .slice(0, 4)
                  .map((entry, idx) => {
                    const config = getSourceConfig(entry.source);
                    return (
                      <span key={idx} className={`w-2 h-2 rounded-full ${config.bg}`} title={entry.source} />
                    );
                  })}
                {block.entries.filter((e) => e.source !== "VHT").length > 4 && (
                  <span className="text-[10px] text-muted-foreground">
                    +{block.entries.filter((e) => e.source !== "VHT").length - 4}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Expanded Block Detail */}
      {expandedBlock && (
        <div className="glass-card p-4 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              <h3 className="font-mono text-lg font-bold text-foreground">
                Bloco {expandedBlock}
              </h3>
            </div>
            <button
              onClick={() => setExpandedBlock(null)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              ✕
            </button>
          </div>

          <div className="space-y-2">
            {timeBlocks
              .find((b) => b.time === expandedBlock)
              ?.entries.map((entry, idx) => {
                const config = getSourceConfig(entry.source);
                return (
                  <div
                    key={idx}
                    className={`flex items-center gap-3 p-3 rounded-lg ${config.bg} border border-transparent hover:border-current/20 transition-all`}
                  >
                    <span className="text-lg">{config.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium text-sm truncate ${config.color}`}>
                        {entry.source === "VHT" ? "Vinheta / Transição" : entry.file.replace(".mp3", "")}
                      </p>
                      <p className="text-xs text-muted-foreground">{config.label}</p>
                    </div>
                    <span
                      className={`text-xs font-mono px-2 py-1 rounded ${config.bg} ${config.color}`}
                    >
                      {idx + 1}
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="glass-card p-4">
        <h4 className="font-mono text-xs text-muted-foreground mb-3">legenda_fontes</h4>
        <div className="flex flex-wrap gap-2">
          {Object.entries(sourceConfig)
            .filter(([key]) => !key.startsWith("CURADORIA_"))
            .map(([key, config]) => (
              <div
                key={key}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-lg ${config.bg}`}
              >
                <span className="text-sm">{config.icon}</span>
                <span className={`text-xs font-mono ${config.color}`}>{config.label}</span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default ProgrammingGrid;
