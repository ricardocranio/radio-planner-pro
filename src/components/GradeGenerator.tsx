import { useState } from "react";
import { FileText, Download, Clock, AlertTriangle, CheckCircle, Music } from "lucide-react";
import type { Station } from "@/types/radio";
import {
  generateGrade,
  formatGradeToTxt,
  formatFaltandoTxt,
  type GradeCompleta,
} from "@/utils/gradeGenerator";
import DeezerSearch from "./DeezerSearch";
import type { DeezerTrack } from "@/utils/deezerApi";

interface GradeGeneratorProps {
  stations: Station[];
}

const GradeGenerator = ({ stations }: GradeGeneratorProps) => {
  const [horaInicio, setHoraInicio] = useState(5);
  const [horaFim, setHoraFim] = useState(24);
  const [gradeGerada, setGradeGerada] = useState<GradeCompleta | null>(null);
  const [showDeezerSearch, setShowDeezerSearch] = useState(false);
  const [selectedTracks, setSelectedTracks] = useState<DeezerTrack[]>([]);

  const handleGenerate = () => {
    const grade = generateGrade(stations, horaInicio, horaFim);
    setGradeGerada(grade);
    // Mostra busca Deezer se houver faltantes
    if (grade.estatisticas.faltantes.length > 0) {
      setShowDeezerSearch(true);
    }
  };

  const handleSelectDeezerTrack = (track: DeezerTrack) => {
    setSelectedTracks((prev) => {
      // Evita duplicatas
      if (prev.some((t) => t.id === track.id)) return prev;
      return [...prev, track];
    });
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
    <div className="glass-card p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <FileText className="w-5 h-5 text-primary" />
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

          {/* Faltantes */}
          {gradeGerada.estatisticas.faltantes.length > 0 && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span className="text-sm font-mono text-red-400">
                    {gradeGerada.estatisticas.faltantes.length} músicas faltantes
                  </span>
                </div>
                <button
                  onClick={() => setShowDeezerSearch(!showDeezerSearch)}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-primary/20 text-primary text-xs font-mono hover:bg-primary/30"
                >
                  <Music className="w-3 h-3" />
                  {showDeezerSearch ? "Ocultar Deezer" : "Buscar no Deezer"}
                </button>
              </div>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {gradeGerada.estatisticas.faltantes.slice(0, 10).map((f, i) => (
                  <p key={i} className="text-xs font-mono text-muted-foreground truncate">
                    {f}
                  </p>
                ))}
                {gradeGerada.estatisticas.faltantes.length > 10 && (
                  <p className="text-xs font-mono text-red-400">
                    ... e mais {gradeGerada.estatisticas.faltantes.length - 10}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Deezer Search */}
          {showDeezerSearch && (
            <DeezerSearch
              faltantes={gradeGerada.estatisticas.faltantes}
              onSelectTrack={handleSelectDeezerTrack}
            />
          )}

          {/* Músicas selecionadas do Deezer */}
          {selectedTracks.length > 0 && (
            <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
              <div className="flex items-center gap-2 mb-3">
                <Music className="w-4 h-4 text-green-400" />
                <span className="text-sm font-mono text-green-400">
                  {selectedTracks.length} músicas do Deezer selecionadas
                </span>
              </div>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {selectedTracks.map((track) => (
                  <div
                    key={track.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-muted/20 text-xs"
                  >
                    <span className="font-mono truncate">
                      {track.artist.name} - {track.title}
                    </span>
                    <button
                      onClick={() => setSelectedTracks((prev) => prev.filter((t) => t.id !== track.id))}
                      className="text-red-400 hover:text-red-300 ml-2"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
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
              <Download className="w-4 h-4" />
              GRADE_{gradeGerada.diaSemana}.txt
            </button>
            <button
              onClick={handleDownloadFaltando}
              className="flex items-center justify-center gap-2 py-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 font-mono text-sm hover:bg-red-500/30 transition-colors"
            >
              <Download className="w-4 h-4" />
              faltando.txt
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GradeGenerator;
