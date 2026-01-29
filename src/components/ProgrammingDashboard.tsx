import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileText,
  AlertTriangle,
  Settings,
  Music,
  Download,
  BarChart3,
} from "lucide-react";
import type { Station } from "@/types/radio";
import GradeGenerator from "./GradeGenerator";
import FaltandoManager from "./FaltandoManager";
import ArlConfig from "./ArlConfig";
import { FolderConfig } from "./FolderConfig";
import StatsCard from "./StatsCard";
import type { GradeCompleta } from "@/utils/gradeGenerator";

interface ProgrammingDashboardProps {
  stations: Station[];
}

const ProgrammingDashboard = ({ stations }: ProgrammingDashboardProps) => {
  const [currentTab, setCurrentTab] = useState("grade");
  const [gradeGerada, setGradeGerada] = useState<GradeCompleta | null>(null);
  const [faltantes, setFaltantes] = useState<string[]>([]);

  const handleGradeGenerated = (grade: GradeCompleta) => {
    setGradeGerada(grade);
    setFaltantes(grade.estatisticas.faltantes);
    // Auto-switch para aba faltando se houver faltantes
    if (grade.estatisticas.faltantes.length > 0) {
      setCurrentTab("faltando");
    }
  };

  return (
    <div className="glass-card p-6">
      <Tabs value={currentTab} onValueChange={setCurrentTab}>
        <TabsList className="grid w-full grid-cols-4 bg-muted/30 p-1 rounded-xl">
          <TabsTrigger
            value="grade"
            className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg font-mono text-xs"
          >
            <FileText className="w-4 h-4" />
            Grade
          </TabsTrigger>
          <TabsTrigger
            value="faltando"
            className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg font-mono text-xs relative"
          >
            <Download className="w-4 h-4" />
            Faltando
            {faltantes.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center">
                {faltantes.length > 9 ? "9+" : faltantes.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="stats"
            className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg font-mono text-xs"
          >
            <BarChart3 className="w-4 h-4" />
            Stats
          </TabsTrigger>
          <TabsTrigger
            value="config"
            className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg font-mono text-xs"
          >
            <Settings className="w-4 h-4" />
            Config
          </TabsTrigger>
        </TabsList>

        {/* Grade Tab */}
        <TabsContent value="grade" className="mt-6">
          <GradeGeneratorWrapper
            stations={stations}
            onGradeGenerated={handleGradeGenerated}
          />
        </TabsContent>

        {/* Faltando Tab */}
        <TabsContent value="faltando" className="mt-6">
          {faltantes.length > 0 ? (
            <FaltandoManager faltantes={faltantes} />
          ) : (
            <div className="text-center py-12">
              <Music className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground font-mono text-sm">
                Nenhuma música faltante
              </p>
              <p className="text-muted-foreground/60 font-mono text-xs mt-2">
                Gere uma grade primeiro na aba "Grade"
              </p>
            </div>
          )}
        </TabsContent>

        {/* Stats Tab */}
        <TabsContent value="stats" className="mt-6">
          <StatsCard stations={stations} />
        </TabsContent>

        {/* Config Tab */}
        <TabsContent value="config" className="mt-6 space-y-6">
          <ArlConfig />
          <FolderConfig />
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Wrapper para capturar a grade gerada
interface GradeGeneratorWrapperProps {
  stations: Station[];
  onGradeGenerated: (grade: GradeCompleta) => void;
}

const GradeGeneratorWrapper = ({
  stations,
  onGradeGenerated,
}: GradeGeneratorWrapperProps) => {
  return (
    <GradeGeneratorWithCallback
      stations={stations}
      onGradeGenerated={onGradeGenerated}
    />
  );
};

// Componente interno que extende GradeGenerator com callback
import { useState as useStateInternal } from "react";
import {
  FileText as FileTextIcon,
  Download as DownloadIcon,
  Clock,
  AlertTriangle as AlertTriangleIcon,
  CheckCircle,
  Music as MusicIcon,
} from "lucide-react";
import {
  generateGrade,
  formatGradeToTxt,
  formatFaltandoTxt,
  type GradeCompleta as GradeCompletaType,
} from "@/utils/gradeGenerator";

interface GradeGeneratorWithCallbackProps {
  stations: Station[];
  onGradeGenerated: (grade: GradeCompletaType) => void;
}

const GradeGeneratorWithCallback = ({
  stations,
  onGradeGenerated,
}: GradeGeneratorWithCallbackProps) => {
  const [horaInicio, setHoraInicio] = useStateInternal(5);
  const [horaFim, setHoraFim] = useStateInternal(24);
  const [gradeGerada, setGradeGerada] = useStateInternal<GradeCompletaType | null>(null);

  const handleGenerate = () => {
    const grade = generateGrade(stations, horaInicio, horaFim);
    setGradeGerada(grade);
    onGradeGenerated(grade);
  };

  const handleDownloadGrade = () => {
    if (!gradeGerada) return;

    const content = formatGradeToTxt(gradeGerada);
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `GRADE_${gradeGerada.diaSemana}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadFaltando = () => {
    if (!gradeGerada) return;

    const content = formatFaltandoTxt(gradeGerada);
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "faltando.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const radioColors: Record<string, string> = {
    BH: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
    BAND: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    CLUBE: "bg-green-500/20 text-green-400 border-green-500/30",
    GLOBO: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    VHT: "bg-muted/30 text-muted-foreground border-muted/30",
    CORINGA: "bg-red-500/20 text-red-400 border-red-500/30",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <FileTextIcon className="w-5 h-5 text-primary" />
        <h3 className="font-mono text-sm text-muted-foreground">
          <span className="text-primary">{">"}</span> gerador_grade
        </h3>
      </div>

      {/* Configuração */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-mono text-muted-foreground mb-2">
            Hora Início
          </label>
          <select
            value={horaInicio}
            onChange={(e) => setHoraInicio(Number(e.target.value))}
            className="w-full p-2 rounded-lg bg-muted/30 border border-muted/50 text-foreground font-mono text-sm"
          >
            {Array.from({ length: 24 }, (_, i) => (
              <option key={i} value={i}>
                {i.toString().padStart(2, "0")}:00
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-mono text-muted-foreground mb-2">
            Hora Fim
          </label>
          <select
            value={horaFim}
            onChange={(e) => setHoraFim(Number(e.target.value))}
            className="w-full p-2 rounded-lg bg-muted/30 border border-muted/50 text-foreground font-mono text-sm"
          >
            {Array.from({ length: 24 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {(i + 1).toString().padStart(2, "0")}:00
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Botão Gerar */}
      <button
        onClick={handleGenerate}
        className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-mono font-semibold hover:bg-primary/90 transition-colors glow-primary"
      >
        $ gerar_grade --dia={new Date().toLocaleDateString("pt-BR")}
      </button>

      {/* Resultado */}
      {gradeGerada && (
        <div className="space-y-4">
          {/* Estatísticas */}
          <div className="p-4 rounded-xl bg-muted/20 border border-primary/20">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-sm font-mono text-green-400">
                Grade gerada com sucesso!
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground font-mono">Músicas:</span>
                <span className="ml-2 text-primary font-bold">
                  {gradeGerada.estatisticas.totalMusicas}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground font-mono">Coringas:</span>
                <span className="ml-2 text-red-400 font-bold">
                  {gradeGerada.estatisticas.coringas}
                </span>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {Object.entries(gradeGerada.estatisticas.porRadio).map(([radio, count]) => (
                <span
                  key={radio}
                  className={`px-2 py-1 rounded text-xs font-mono border ${radioColors[radio] || "bg-muted/30 text-foreground"}`}
                >
                  {radio}: {count}
                </span>
              ))}
            </div>
          </div>

          {/* Faltantes Notice */}
          {gradeGerada.estatisticas.faltantes.length > 0 && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <div className="flex items-center gap-2">
                <AlertTriangleIcon className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-mono text-amber-400">
                  {gradeGerada.estatisticas.faltantes.length} músicas faltantes
                </span>
              </div>
              <p className="text-xs text-amber-400/70 font-mono mt-1">
                Vá para a aba "Faltando" para buscar no Deezer e baixar via Deemix
              </p>
            </div>
          )}

          {/* Preview da Grade */}
          <div className="p-4 rounded-xl bg-muted/10 border border-muted/20">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono text-muted-foreground">
                <Clock className="w-3 h-3 inline mr-1" />
                Preview (primeiros 3 blocos)
              </span>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {gradeGerada.blocos.slice(0, 3).map((bloco, i) => (
                <div key={i} className="p-2 rounded-lg bg-muted/20 text-xs">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-primary font-bold">
                      {bloco.horario}
                    </span>
                    <span className="text-muted-foreground">({bloco.programa})</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {bloco.entries.slice(0, 6).map((entry, j) => (
                      <span
                        key={j}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-mono border ${radioColors[entry.fonte] || "bg-muted/30"}`}
                      >
                        {entry.tipo === "vht" ? "VHT" : entry.tipo === "coringa" ? "MUS" : entry.fonte}
                      </span>
                    ))}
                    {bloco.entries.length > 6 && (
                      <span className="text-muted-foreground">+{bloco.entries.length - 6}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Botões de Download */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleDownloadGrade}
              className="flex items-center justify-center gap-2 py-3 rounded-xl bg-primary/20 border border-primary/30 text-primary font-mono text-sm hover:bg-primary/30 transition-colors"
            >
              <DownloadIcon className="w-4 h-4" />
              GRADE_{gradeGerada.diaSemana}.txt
            </button>
            <button
              onClick={handleDownloadFaltando}
              className="flex items-center justify-center gap-2 py-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 font-mono text-sm hover:bg-red-500/30 transition-colors"
            >
              <DownloadIcon className="w-4 h-4" />
              faltando.txt
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgrammingDashboard;
