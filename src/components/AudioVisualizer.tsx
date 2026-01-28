import { useEffect, useState } from "react";

interface AudioVisualizerProps {
  isPlaying: boolean;
  barCount?: number;
}

const AudioVisualizer = ({ isPlaying, barCount = 40 }: AudioVisualizerProps) => {
  const [heights, setHeights] = useState<number[]>(Array(barCount).fill(20));

  useEffect(() => {
    if (!isPlaying) {
      setHeights(Array(barCount).fill(20));
      return;
    }

    const interval = setInterval(() => {
      setHeights(
        Array(barCount)
          .fill(0)
          .map(() => Math.random() * 80 + 20)
      );
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying, barCount]);

  return (
    <div className="flex items-end justify-center gap-[3px] h-24 px-4">
      {heights.map((height, i) => (
        <div
          key={i}
          className="w-1.5 rounded-full transition-all duration-100 ease-out"
          style={{
            height: `${height}%`,
            background: `linear-gradient(to top, hsl(180 100% 50%), hsl(${150 + (i * 3)} 100% 50%))`,
            boxShadow: isPlaying
              ? `0 0 10px hsl(180 100% 50% / 0.5), 0 0 20px hsl(180 100% 50% / 0.3)`
              : "none",
            opacity: isPlaying ? 1 : 0.3,
          }}
        />
      ))}
    </div>
  );
};

export default AudioVisualizer;
