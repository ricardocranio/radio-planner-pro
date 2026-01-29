import { memo } from "react";
import type { Station } from "@/types/radio";
import { useRadioConfig } from "@/hooks/useRadioData";

interface StationListProps {
  stations: Station[];
  currentIndex: number;
  onSelectStation: (index: number) => void;
}

const StationList = memo(function StationList({ 
  stations, 
  currentIndex, 
  onSelectStation 
}: StationListProps) {
  const radioConfig = useRadioConfig();

  return (
    <div className="glass-card p-6">
      <h3 className="font-mono text-sm text-muted-foreground mb-4">
        <span className="text-primary">{">"}</span> estacoes_monitoradas
      </h3>
      <div className="space-y-2">
        {stations.map((station, index) => {
          const config = radioConfig[station.key as keyof typeof radioConfig];
          const isActive = index === currentIndex;

          return (
            <button
              key={station.id}
              onClick={() => onSelectStation(index)}
              className={`w-full p-4 rounded-xl text-left transition-all border-l-4 ${
                isActive
                  ? `${config?.bgColor} ${config?.borderColor} border border-primary/50 glow-primary`
                  : "bg-muted/30 hover:bg-muted/50 border-transparent border"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className={`font-semibold ${isActive ? "text-primary" : "text-foreground"}`}>
                      {station.name}
                    </h4>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground">
                      {station.key.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground font-mono">{station.genre}</p>
                  <p className="text-xs text-accent/70 font-mono">{station.frequency}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-foreground font-medium truncate max-w-[150px]">
                    {station.nowPlaying.title}
                  </p>
                  <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                    {station.nowPlaying.artist}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
});

export default StationList;
