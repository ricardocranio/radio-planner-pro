import { memo, useState, useCallback } from "react";
import type { Station } from "@/types/radio";
import StationList from "./StationList";
import RecentTracks from "./RecentTracks";

interface MonitorTabProps {
  stations: Station[];
}

const MonitorTab = memo(function MonitorTab({ stations }: MonitorTabProps) {
  const [currentStationIndex, setCurrentStationIndex] = useState(0);

  const handleSelectStation = useCallback((index: number) => {
    setCurrentStationIndex(index);
  }, []);

  const currentStation = stations[currentStationIndex];

  if (!currentStation) {
    return (
      <div className="glass-card p-8 text-center">
        <p className="text-muted-foreground">Nenhuma estação disponível</p>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <StationList 
        stations={stations} 
        currentIndex={currentStationIndex} 
        onSelectStation={handleSelectStation} 
      />
      <RecentTracks station={currentStation} />
    </div>
  );
});

export default MonitorTab;
