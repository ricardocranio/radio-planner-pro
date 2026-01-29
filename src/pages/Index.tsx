import { useState } from "react";
import TerminalHeader from "@/components/TerminalHeader";
import RadioPlayer from "@/components/RadioPlayer";
import FloatingOrbs from "@/components/FloatingOrbs";
import ProgrammingDashboard from "@/components/ProgrammingDashboard";
import { FolderConfig } from "@/components/FolderConfig";
import ArlConfig from "@/components/ArlConfig";
import { parseRadioData } from "@/utils/parseRadioData";
import rawRadioData from "@/data/radioData.json";
import type { RawRadioData } from "@/types/radio";
import { Settings, Radio, BarChart3 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Index = () => {
  const [activeTab, setActiveTab] = useState("monitor");
  
  // Parse dados das rádios
  const stations = parseRadioData(rawRadioData as RawRadioData);

  return (
    <div className="min-h-screen relative">
      <FloatingOrbs />
      
      <div className="relative z-10">
        <TerminalHeader />
        
        <main className="px-4 py-8">
          <div className="max-w-5xl mx-auto">
            {/* Tagline */}
            <div className="text-center mb-8">
              <p className="font-mono text-muted-foreground">
                <span className="text-primary">{"// "}</span>
                Sistema Automatizado de Monitoramento e Download
                <span className="animate-pulse">_</span>
              </p>
            </div>

            {/* Main Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full grid grid-cols-3 mb-6 bg-muted/30">
                <TabsTrigger value="monitor" className="flex items-center gap-2 font-mono text-xs">
                  <Radio className="h-4 w-4" />
                  Monitor
                </TabsTrigger>
                <TabsTrigger value="programacao" className="flex items-center gap-2 font-mono text-xs">
                  <BarChart3 className="h-4 w-4" />
                  Programação
                </TabsTrigger>
                <TabsTrigger value="config" className="flex items-center gap-2 font-mono text-xs">
                  <Settings className="h-4 w-4" />
                  Configurações
                </TabsTrigger>
              </TabsList>

              {/* Monitor Tab - Main RadioPlayer with all features */}
              <TabsContent value="monitor" className="space-y-6">
                <RadioPlayer />
              </TabsContent>

              {/* Programação Tab */}
              <TabsContent value="programacao">
                <ProgrammingDashboard stations={stations} />
              </TabsContent>

              {/* Config Tab - Folder and ARL Config */}
              <TabsContent value="config" className="space-y-6">
                <div className="grid lg:grid-cols-2 gap-6">
                  <div className="glass-card p-6">
                    <FolderConfig />
                  </div>
                  <div className="glass-card p-6">
                    <ArlConfig />
                  </div>
                </div>
                
                {/* Info Box */}
                <div className="glass-card p-6">
                  <h3 className="font-mono text-lg font-semibold mb-4 text-primary">
                    📋 Fluxo de Download Automático
                  </h3>
                  <div className="grid md:grid-cols-2 gap-6 text-sm text-muted-foreground">
                    <div>
                      <h4 className="font-medium text-foreground mb-2">1. Monitoramento</h4>
                      <p>O sistema monitora continuamente as rádios e detecta novas músicas tocadas.</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground mb-2">2. Comparação com Acervo</h4>
                      <p>Cada música é comparada com os diretórios de acervo configurados usando DNA.</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground mb-2">3. Busca no Deezer</h4>
                      <p>Músicas não encontradas são buscadas automaticamente no Deezer.</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground mb-2">4. Download via Deemix</h4>
                      <p>Com o ARL configurado, o download é iniciado automaticamente via Deemix.</p>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            {/* Footer */}
            <footer className="mt-16 text-center">
              <p className="font-mono text-sm text-muted-foreground">
                <span className="text-primary">console</span>
                <span className="text-secondary">.log</span>
                <span className="text-foreground">(</span>
                <span className="text-accent">"PGM-FM System v2.0 - Auto Download Mode"</span>
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
