import { Terminal, Wifi, Signal } from "lucide-react";

const TerminalHeader = () => {
  return (
    <header className="w-full py-6 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="glass-card p-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/20 border border-primary/50 glow-primary">
              <Terminal className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="font-bold text-xl">
                <span className="text-primary">{"<"}</span>
                <span className="text-foreground">Radio</span>
                <span className="text-secondary">Coder</span>
                <span className="text-primary">{"/>"}</span>
              </h1>
              <p className="text-xs font-mono text-muted-foreground">v1.0.0 | streaming...</p>
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-accent">
              <Signal className="w-4 h-4" />
              <span className="text-sm font-mono">LIVE</span>
            </div>
            <div className="flex items-center gap-2 text-primary">
              <Wifi className="w-4 h-4" />
              <span className="text-sm font-mono hidden sm:inline">128kbps</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default TerminalHeader;
