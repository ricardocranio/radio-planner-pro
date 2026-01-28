import { useState, useMemo, useEffect } from "react";
import { Clock, Eye, Download, Calendar, Radio, Music, ChevronRight, X, AlertTriangle } from "lucide-react";
import type { Station } from "@/types/radio";
import {
  generateGrade,
  formatGradeToTxt,
  type GradeCompleta,
  type BlocoGrade,
} from "@/utils/gradeGenerator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface GradeViewProps {
  stations: Station[];
}

const radioColors: Record<string, string> = {
  BH: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  BAND: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  CLUBE: "bg-green-500/20 text-green-400 border-green-500/30",
  GLOBO: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  VHT: "bg-muted/30 text-muted-foreground border-muted/30",
  CORINGA: "bg-red-500/20 text-red-400 border-red-500/30",
};

/**
 * Encontra o índice do bloco atual baseado no horário
 */
function getCurrentBlockIndex(blocos: BlocoGrade[]): number {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTimeStr = `${currentHour.toString().padStart(2, "0")}:${currentMinute >= 30 ? "30" : "00"}`;

  const index = blocos.findIndex((bloco) => bloco.horario === currentTimeStr);
  return index >= 0 ? index : 0;
}

const GradeView = ({ stations }: GradeViewProps) => {
  const [selectedBloco, setSelectedBloco] = useState<BlocoGrade | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Atualiza o horário a cada minuto
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Gera a grade automaticamente
  const grade = useMemo<GradeCompleta>(() => {
    return generateGrade(stations, 5, 24);
  }, [stations]);

  // Encontra blocos: atual + 3 próximos
  const currentBlockIndex = useMemo(() => {
    return getCurrentBlockIndex(grade.blocos);
  }, [grade.blocos, currentTime]);

  const displayBlocks = useMemo(() => {
    const blocks: { bloco: BlocoGrade; label: string; isCurrent: boolean }[] = [];
    
    for (let i = 0; i < 4; i++) {
      const index = currentBlockIndex + i;
      if (index < grade.blocos.length) {
        blocks.push({
          bloco: grade.blocos[index],
          label: i === 0 ? "ATUAL" : `+${i * 30}min`,
          isCurrent: i === 0,
        });
      }
    }
    
    return blocks;
  }, [grade.blocos, currentBlockIndex]);

  const handleViewBloco = (bloco: BlocoGrade) => {
    setSelectedBloco(bloco);
    setIsDialogOpen(true);
  };

  const handleDownloadGrade = () => {
    const content = formatGradeToTxt(grade);
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `GRADE_${grade.diaSemana}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            <h3 className="font-mono text-sm text-muted-foreground">
              <span className="text-primary">{">"}</span> grade_automatica
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-muted-foreground">
              {grade.diaSemana} - {grade.data}
            </span>
            <button
              onClick={handleDownloadGrade}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/20 border border-primary/30 text-primary text-xs font-mono hover:bg-primary/30 transition-colors"
            >
              <Download className="w-3 h-3" />
              Exportar
            </button>
          </div>
        </div>

        {/* Estatísticas resumidas */}
        <div className="grid grid-cols-3 gap-4 p-4 rounded-xl bg-muted/10 border border-muted/20">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">{grade.estatisticas.totalMusicas}</p>
            <p className="text-xs font-mono text-muted-foreground">músicas</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-400">{grade.estatisticas.coringas}</p>
            <p className="text-xs font-mono text-muted-foreground">coringas</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-400">{grade.blocos.length}</p>
            <p className="text-xs font-mono text-muted-foreground">blocos</p>
          </div>
        </div>
      </div>

      {/* Blocos: Atual + 3 próximos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {displayBlocks.map(({ bloco, label, isCurrent }) => (
          <div
            key={bloco.horario}
            className={`glass-card p-4 transition-all ${
              isCurrent
                ? "border-2 border-primary glow-primary"
                : "border border-muted/30 hover:border-muted/50"
            }`}
          >
            {/* Bloco Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Clock className={`w-4 h-4 ${isCurrent ? "text-primary" : "text-muted-foreground"}`} />
                <span className={`font-mono font-bold ${isCurrent ? "text-primary" : "text-foreground"}`}>
                  {bloco.horario}
                </span>
              </div>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                  isCurrent
                    ? "bg-primary/20 text-primary"
                    : "bg-muted/30 text-muted-foreground"
                }`}
              >
                {label}
              </span>
            </div>

            {/* Programa */}
            <p className="text-xs font-mono text-muted-foreground mb-3">
              {bloco.programa}
            </p>

            {/* Preview das entradas */}
            <div className="flex flex-wrap gap-1 mb-3">
              {bloco.entries.slice(0, 8).map((entry, j) => (
                <span
                  key={j}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono border ${
                    radioColors[entry.fonte] || "bg-muted/30 text-foreground"
                  }`}
                >
                  {entry.tipo === "vht"
                    ? "VHT"
                    : entry.tipo === "coringa"
                    ? "MUS"
                    : entry.fonte}
                </span>
              ))}
              {bloco.entries.length > 8 && (
                <span className="text-[10px] text-muted-foreground">
                  +{bloco.entries.length - 8}
                </span>
              )}
            </div>

            {/* Contador de músicas */}
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono text-muted-foreground">
                <Music className="w-3 h-3 inline mr-1" />
                {bloco.entries.filter((e) => e.tipo === "musica").length} músicas
              </span>
              {bloco.entries.filter((e) => e.tipo === "coringa").length > 0 && (
                <span className="text-red-400 font-mono">
                  {bloco.entries.filter((e) => e.tipo === "coringa").length} coringas
                </span>
              )}
            </div>

            {/* Botão Visualizar */}
            <button
              onClick={() => handleViewBloco(bloco)}
              className={`w-full mt-3 py-2 rounded-lg flex items-center justify-center gap-2 text-xs font-mono transition-colors ${
                isCurrent
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "bg-muted/20 text-foreground hover:bg-muted/30 border border-muted/30"
              }`}
            >
              <Eye className="w-3 h-3" />
              Visualizar
            </button>
          </div>
        ))}
      </div>

      {/* Faltantes */}
      {grade.estatisticas.faltantes.length > 0 && (
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span className="text-sm font-mono text-red-400">
              {grade.estatisticas.faltantes.length} músicas faltantes no banco
            </span>
          </div>
          <div className="max-h-24 overflow-y-auto space-y-1">
            {grade.estatisticas.faltantes.slice(0, 5).map((f, i) => (
              <p key={i} className="text-xs font-mono text-muted-foreground truncate">
                {f}
              </p>
            ))}
            {grade.estatisticas.faltantes.length > 5 && (
              <p className="text-xs font-mono text-red-400">
                ... e mais {grade.estatisticas.faltantes.length - 5}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Dialog de Visualização Detalhada */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-background border border-muted">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-mono">
              <Clock className="w-5 h-5 text-primary" />
              Bloco {selectedBloco?.horario} - {selectedBloco?.programa}
            </DialogTitle>
          </DialogHeader>

          {selectedBloco && (
            <div className="space-y-4">
              {/* Lista completa de entradas */}
              <div className="space-y-2">
                {selectedBloco.entries.map((entry, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-lg flex items-center gap-3 ${
                      entry.tipo === "vht"
                        ? "bg-muted/20"
                        : entry.tipo === "coringa"
                        ? "bg-red-500/10 border border-red-500/20"
                        : "bg-muted/10 border border-muted/20"
                    }`}
                  >
                    <span
                      className={`px-2 py-1 rounded text-xs font-mono font-bold border ${
                        radioColors[entry.fonte] || "bg-muted/30"
                      }`}
                    >
                      {entry.fonte}
                    </span>
                    <div className="flex-1">
                      {entry.tipo === "vht" ? (
                        <span className="text-sm text-muted-foreground italic">
                          Vinheta de transição
                        </span>
                      ) : entry.tipo === "coringa" ? (
                        <span className="text-sm text-red-400 font-mono">
                          [CORINGA] Música do banco
                        </span>
                      ) : (
                        <span className="text-sm text-foreground">
                          {entry.musica}
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-mono text-muted-foreground">
                      #{i + 1}
                    </span>
                  </div>
                ))}
              </div>

              {/* Resumo do bloco */}
              <div className="grid grid-cols-3 gap-3 p-4 rounded-xl bg-muted/10 border border-muted/20">
                <div className="text-center">
                  <p className="text-lg font-bold text-primary">
                    {selectedBloco.entries.filter((e) => e.tipo === "musica").length}
                  </p>
                  <p className="text-[10px] font-mono text-muted-foreground">músicas</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-muted-foreground">
                    {selectedBloco.entries.filter((e) => e.tipo === "vht").length}
                  </p>
                  <p className="text-[10px] font-mono text-muted-foreground">VHTs</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-red-400">
                    {selectedBloco.entries.filter((e) => e.tipo === "coringa").length}
                  </p>
                  <p className="text-[10px] font-mono text-muted-foreground">coringas</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GradeView;
