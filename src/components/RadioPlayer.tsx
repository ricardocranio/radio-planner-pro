import { useState, useMemo } from "react";
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Radio, Clock, Music, Wifi } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import AudioVisualizer from "./AudioVisualizer";
import StatsCard from "./StatsCard";
import rawRadioData from "@/data/radioData.json";
import { parseRadioData } from "@/utils/parseRadioData";
import type { RawRadioData, Station } from "@/types/radio";

const RadioPlayer = () => {
  const stations = useMemo(() => {
    return parseRadioData(rawRadioData as RawRadioData);
  }, []);

  const lastUpdate = useMemo(() => {
    return (rawRadioData as RawRadioData).ultima_atualizacao || "";
  }, []);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStationIndex, setCurrentStationIndex] = useState(0);
  const [volume, setVolume] = useState([75]);
  const [isMuted, setIsMuted] = useState(false);
  const [showStats, setShowStats] = useState(false);

  const station: Station | undefined = stations[currentStationIndex];

  const nextStation = () => {
    setCurrentStationIndex((prev) => (prev + 1) % stations.length);
  };

  const prevStation = () => {
    setCurrentStationIndex((prev) => (prev - 1 + stations.length) % stations.length);
  };

  if (!station) {
    return (
      <div className="glass-card p-8 neon-border text-center">
        <p className="text-muted-foreground">Carregando estações...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Main Player Card */}
      <div className="glass-card p-8 neon-border">
        {/* Station Info */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/30">
              <Radio className="w-4 h-4 text-primary" />
              <span className="text-sm font-mono text-primary">{station.genre}</span>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/30">
              <Wifi className="w-3 h-3 text-accent" />
              <span className="text-xs font-mono text-accent">{station.frequency}</span>
            </div>
          </div>
          <h2 className="text-3xl font-bold gradient-text mb-2">{station.name}</h2>
          <div className="font-mono text-muted-foreground text-sm">
            <span className="text-primary">$</span> tocando_agora
            <span className="ml-2 text-xs text-accent">[{station.key.toUpperCase()}]</span>
          </div>
        </div>

        {/* Visualizer */}
        <div className="my-8">
          <AudioVisualizer isPlaying={isPlaying} />
        </div>

        {/* Now Playing */}
        <div className="text-center mb-8">
          <h3 className="text-xl font-semibold text-foreground mb-1">
            {station.nowPlaying.title}
          </h3>
          <p className="text-muted-foreground">{station.nowPlaying.artist}</p>
          <span className="inline-flex items-center gap-1 mt-2 px-3 py-1 rounded-full bg-accent/20 text-accent text-xs font-mono">
            <Clock className="w-3 h-3" />
            {station.nowPlaying.timeAgo}
          </span>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-6 mb-8">
          <button
            onClick={prevStation}
            className="p-3 rounded-full bg-muted/50 hover:bg-muted transition-all hover:glow-primary"
          >
            <SkipBack className="w-6 h-6 text-foreground" />
          </button>

          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="relative p-6 rounded-full bg-primary text-primary-foreground glow-primary hover:scale-105 transition-transform"
          >
            {isPlaying && (
              <>
                <span className="pulse-ring" />
                <span className="pulse-ring" style={{ animationDelay: "0.5s" }} />
              </>
            )}
            {isPlaying ? (
              <Pause className="w-8 h-8 relative z-10" />
            ) : (
              <Play className="w-8 h-8 relative z-10 ml-1" />
            )}
          </button>

          <button
            onClick={nextStation}
            className="p-3 rounded-full bg-muted/50 hover:bg-muted transition-all hover:glow-primary"
          >
            <SkipForward className="w-6 h-6 text-foreground" />
          </button>
        </div>

        {/* Volume */}
        <div className="flex items-center gap-4 max-w-xs mx-auto">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="text-muted-foreground hover:text-primary transition-colors"
          >
            {isMuted || volume[0] === 0 ? (
              <VolumeX className="w-5 h-5" />
            ) : (
              <Volume2 className="w-5 h-5" />
            )}
          </button>
          <Slider
            value={isMuted ? [0] : volume}
            onValueChange={setVolume}
            max={100}
            step={1}
            className="flex-1"
          />
          <span className="text-sm font-mono text-muted-foreground w-10">
            {isMuted ? 0 : volume[0]}%
          </span>
        </div>

        {/* Toggle Stats Button */}
        <div className="text-center mt-6">
          <button
            onClick={() => setShowStats(!showStats)}
            className="px-4 py-2 rounded-lg bg-muted/30 hover:bg-muted/50 border border-muted/50 text-sm font-mono text-muted-foreground hover:text-foreground transition-all"
          >
            {showStats ? "< ocultar_estatisticas" : "> ver_estatisticas"}
          </button>
        </div>
      </div>

      {/* Stats Section */}
      {showStats && (
        <div className="mt-8">
          <StatsCard stations={stations} lastUpdate={lastUpdate} />
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6 mt-8">
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
                className={`w-full p-4 rounded-xl text-left transition-all ${
                  i === currentStationIndex
                    ? "bg-primary/20 border border-primary/50 glow-primary"
                    : "bg-muted/30 hover:bg-muted/50 border border-transparent"
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
                  {i === currentStationIndex && isPlaying && (
                    <div className="flex items-end gap-0.5 h-4">
                      {[1, 2, 3].map((bar) => (
                        <div
                          key={bar}
                          className="w-1 bg-primary rounded-full equalizer-bar"
                          style={{ animationDelay: `${bar * 0.1}s` }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Tracks */}
        <div className="glass-card p-6">
          <h3 className="font-mono text-sm text-muted-foreground mb-4">
            <span className="text-secondary">{">"}</span> ultimas_tocadas
          </h3>
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
    </div>
  );
};

export default RadioPlayer;
