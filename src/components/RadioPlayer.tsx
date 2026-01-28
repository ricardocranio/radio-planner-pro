import { useState, useMemo } from "react";
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Radio, Clock, Music } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import AudioVisualizer from "./AudioVisualizer";
import rawRadioData from "@/data/radioData.json";
import { parseRadioData } from "@/utils/parseRadioData";
import type { RawRadioData, Station } from "@/types/radio";

const RadioPlayer = () => {
  const stations = useMemo(() => {
    return parseRadioData(rawRadioData as RawRadioData);
  }, []);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStationIndex, setCurrentStationIndex] = useState(0);
  const [volume, setVolume] = useState([75]);
  const [isMuted, setIsMuted] = useState(false);

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
    <div className="w-full max-w-4xl mx-auto">
      {/* Main Player Card */}
      <div className="glass-card p-8 neon-border">
        {/* Station Info */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/30 mb-4">
            <Radio className="w-4 h-4 text-primary" />
            <span className="text-sm font-mono text-primary">{station.genre}</span>
          </div>
          <h2 className="text-3xl font-bold gradient-text mb-2">{station.name}</h2>
          <div className="font-mono text-muted-foreground text-sm">
            <span className="text-primary">$</span> tocando_agora
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
      </div>

      <div className="grid md:grid-cols-2 gap-6 mt-8">
        {/* Station List */}
        <div className="glass-card p-6">
          <h3 className="font-mono text-sm text-muted-foreground mb-4">
            <span className="text-primary">{">"}</span> estações_disponiveis
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
                    <h4 className={`font-semibold ${i === currentStationIndex ? "text-primary" : "text-foreground"}`}>
                      {s.name}
                    </h4>
                    <p className="text-sm text-muted-foreground font-mono">{s.genre}</p>
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
                key={i}
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
        </div>
      </div>
    </div>
  );
};

export default RadioPlayer;
