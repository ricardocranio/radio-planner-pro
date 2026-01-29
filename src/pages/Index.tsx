import { useState } from "react";
import TerminalHeader from "@/components/TerminalHeader";
import RadioPlayer from "@/components/RadioPlayer";
import FloatingOrbs from "@/components/FloatingOrbs";
import ProgrammingDashboard from "@/components/ProgrammingDashboard";
import { parseRadioData } from "@/utils/parseRadioData";
import rawRadioData from "@/data/radioData.json";
import type { RawRadioData } from "@/types/radio";

const Index = () => {
  const [showDashboard, setShowDashboard] = useState(false);
  
  // Parse dados das rádios
  const stations = parseRadioData(rawRadioData as RawRadioData);

  return (
    <div className="min-h-screen relative">
      <FloatingOrbs />
      
      <div className="relative z-10">
        <TerminalHeader />
        
        <main className="px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Tagline */}
            <div className="text-center mb-8">
              <p className="font-mono text-muted-foreground">
                <span className="text-primary">{"// "}</span>
                Sistema de Monitoramento e Programação de Rádios
                <span className="animate-pulse">_</span>
              </p>
            </div>

            {/* Toggle View */}
            <div className="flex justify-center mb-8">
              <div className="inline-flex rounded-xl bg-muted/30 p-1">
                <button
                  onClick={() => setShowDashboard(false)}
                  className={`px-4 py-2 rounded-lg font-mono text-sm transition-colors ${
                    !showDashboard
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  📻 Monitor
                </button>
                <button
                  onClick={() => setShowDashboard(true)}
                  className={`px-4 py-2 rounded-lg font-mono text-sm transition-colors ${
                    showDashboard
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  📊 Programação
                </button>
              </div>
            </div>

            {/* Content */}
            {showDashboard ? (
              <ProgrammingDashboard stations={stations} />
            ) : (
              <RadioPlayer />
            )}

            {/* Footer */}
            <footer className="mt-16 text-center">
              <p className="font-mono text-sm text-muted-foreground">
                <span className="text-primary">console</span>
                <span className="text-secondary">.log</span>
                <span className="text-foreground">(</span>
                <span className="text-accent">"PGM-FM System v2.0"</span>
                <span className="text-foreground">);</span>
              </p>
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Index;
