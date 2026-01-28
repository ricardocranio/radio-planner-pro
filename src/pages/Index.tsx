import TerminalHeader from "@/components/TerminalHeader";
import RadioPlayer from "@/components/RadioPlayer";
import FloatingOrbs from "@/components/FloatingOrbs";

const Index = () => {
  return (
    <div className="min-h-screen relative">
      <FloatingOrbs />
      
      <div className="relative z-10">
        <TerminalHeader />
        
        <main className="px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Tagline */}
            <div className="text-center mb-12">
              <p className="font-mono text-muted-foreground">
                <span className="text-primary">{"// "}</span>
                Monitore suas rádios favoritas em tempo real
                <span className="animate-pulse">_</span>
              </p>
            </div>

            <RadioPlayer />

            {/* Footer */}
            <footer className="mt-16 text-center">
              <p className="font-mono text-sm text-muted-foreground">
                <span className="text-primary">console</span>
                <span className="text-secondary">.log</span>
                <span className="text-foreground">(</span>
                <span className="text-accent">"Keep coding, keep vibing"</span>
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
