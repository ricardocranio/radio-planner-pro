import { memo } from "react";
import { Radio, Clock, Music, Wifi } from "lucide-react";
import type { Station } from "@/types/radio";

interface RecentTracksProps {
  station: Station;
}

const RecentTracks = memo(function RecentTracks({ station }: RecentTracksProps) {
  return (
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
  );
});

export default RecentTracks;
