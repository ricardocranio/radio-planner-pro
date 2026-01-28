import { useState } from "react";
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Radio } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import AudioVisualizer from "./AudioVisualizer";

interface Station {
  id: string;
  name: string;
  genre: string;
  nowPlaying: string;
  artist: string;
}

const stations: Station[] = [
  { id: "1", name: "CodeBeats FM", genre: "Lo-Fi", nowPlaying: "Midnight Debug", artist: "Syntax Error" },
  { id: "2", name: "Binary Waves", genre: "Electronic", nowPlaying: "Recursive Dreams", artist: "Stack Overflow" },
  { id: "3", name: "Terminal Vibes", genre: "Ambient", nowPlaying: "Memory Leak", artist: "Null Pointer" },
  { id: "4", name: "Compile Radio", genre: "Chillhop", nowPlaying: "Async Sunset", artist: "Promise.resolve" },
  { id: "5", name: "Git Push FM", genre: "Synthwave", nowPlaying: "Merge Conflict", artist: "Branch Master" },
];

const RadioPlayer = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStation, setCurrentStation] = useState(0);
  const [volume, setVolume] = useState([75]);
  const [isMuted, setIsMuted] = useState(false);

  const station = stations[currentStation];

  const nextStation = () => {
    setCurrentStation((prev) => (prev + 1) % stations.length);
  };

  const prevStation = () => {
    setCurrentStation((prev) => (prev - 1 + stations.length) % stations.length);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
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
            <span className="text-primary">$</span> now_playing
          </div>
        </div>

        {/* Visualizer */}
        <div className="my-8">
          <AudioVisualizer isPlaying={isPlaying} />
        </div>

        {/* Now Playing */}
        <div className="text-center mb-8">
          <h3 className="text-xl font-semibold text-foreground mb-1">{station.nowPlaying}</h3>
          <p className="text-muted-foreground">{station.artist}</p>
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

      {/* Station List */}
      <div className="mt-8 glass-card p-6">
        <h3 className="font-mono text-sm text-muted-foreground mb-4">
          <span className="text-primary">{">"}</span> available_stations
        </h3>
        <div className="space-y-2">
          {stations.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setCurrentStation(i)}
              className={`w-full p-4 rounded-xl text-left transition-all ${
                i === currentStation
                  ? "bg-primary/20 border border-primary/50 glow-primary"
                  : "bg-muted/30 hover:bg-muted/50 border border-transparent"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className={`font-semibold ${i === currentStation ? "text-primary" : "text-foreground"}`}>
                    {s.name}
                  </h4>
                  <p className="text-sm text-muted-foreground font-mono">{s.genre}</p>
                </div>
                {i === currentStation && isPlaying && (
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
    </div>
  );
};

export default RadioPlayer;
