import { useState, useMemo, useEffect } from "react";
import { Clock, Eye, Download, Calendar, Radio, Music, AlertTriangle, GripVertical, RotateCcw, Settings, Play } from "lucide-react";
import type { Station, RadioConfig } from "@/types/radio";
import {
  generateGrade,
  formatGradeToTxt,
  type GradeCompleta,
  type BlocoGrade,
  type DistribuicaoConfig,
} from "@/utils/gradeGenerator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface GradeViewProps {
  stations: Station[];
}

const DEFAULT_CONFIG: RadioConfig[] = [
  { key: "bh", nome: "BH FM", ativo: true, posicaoInicio: 1, posicaoFim: 3 },
  { key: "band", nome: "Band FM", ativo: true, posicaoInicio: 4, posicaoFim: 6 },
  { key: "clube", nome: "Clube FM", ativo: true, posicaoInicio: 7, posicaoFim: 8 },
  { key: "globo", nome: "Rádio Globo", ativo: true, posicaoInicio: 9, posicaoFim: 10 },
];

const radioColors: Record<string, string> = {
  BH: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  BAND: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  CLUBE: "bg-green-500/20 text-green-400 border-green-500/30",
  GLOBO: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  VHT: "bg-muted/30 text-muted-foreground border-muted/30",
  CORINGA: "bg-red-500/20 text-red-400 border-red-500/30",
};

const radioColorsDrag: Record<string, string> = {
  bh: "bg-cyan-500/20 border-cyan-500/50 text-cyan-400",
  band: "bg-purple-500/20 border-purple-500/50 text-purple-400",
  clube: "bg-green-500/20 border-green-500/50 text-green-400",
  globo: "bg-yellow-500/20 border-yellow-500/50 text-yellow-400",
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

/**
 * Converte RadioConfig[] para DistribuicaoConfig
 */
function configToDistribuicao(config: RadioConfig[]): DistribuicaoConfig {
  const dist: DistribuicaoConfig = {};
  config.filter(c => c.ativo).forEach(c => {
    dist[c.key] = { posicaoInicio: c.posicaoInicio, posicaoFim: c.posicaoFim };
  });
  return dist;
}

const GradeView = ({ stations }: GradeViewProps) => {
  const [selectedBloco, setSelectedBloco] = useState<BlocoGrade | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Configuração de rádios e horários
  const [config, setConfig] = useState<RadioConfig[]>(DEFAULT_CONFIG);
  const [horaInicio, setHoraInicio] = useState(5);
  const [horaFim, setHoraFim] = useState(24);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("visualizar");

  // Atualiza o horário a cada minuto
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Gera a grade com configuração customizada
  const grade = useMemo<GradeCompleta>(() => {
    const distribuicao = configToDistribuicao(config);
    return generateGrade(stations, horaInicio, horaFim, distribuicao);
  }, [stations, config, horaInicio, horaFim]);

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

  // Drag and drop handlers
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newConfig = [...config];
    const draggedItem = newConfig[draggedIndex];
    newConfig.splice(draggedIndex, 1);
    newConfig.splice(index, 0, draggedItem);

    // Recalcula posições automaticamente
    let currentPos = 1;
    newConfig.forEach((item) => {
      const slots = item.posicaoFim - item.posicaoInicio + 1;
      item.posicaoInicio = currentPos;
      item.posicaoFim = currentPos + slots - 1;
      currentPos = item.posicaoFim + 1;
    });

    setConfig(newConfig);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleSlotsChange = (index: number, slots: number) => {
    const newConfig = [...config];
    const item = newConfig[index];
    item.posicaoFim = item.posicaoInicio + slots - 1;

    // Recalcula posições subsequentes
    let currentPos = item.posicaoFim + 1;
    for (let i = index + 1; i < newConfig.length; i++) {
      const nextSlots = newConfig[i].posicaoFim - newConfig[i].posicaoInicio + 1;
      newConfig[i].posicaoInicio = currentPos;
      newConfig[i].posicaoFim = currentPos + nextSlots - 1;
      currentPos = newConfig[i].posicaoFim + 1;
    }

    setConfig(newConfig);
  };

  const handleToggleActive = (index: number) => {
    const newConfig = [...config];
    newConfig[index].ativo = !newConfig[index].ativo;
    
    // Recalcula posições
    let currentPos = 1;
    newConfig.forEach((item) => {
      if (item.ativo) {
        const slots = item.posicaoFim - item.posicaoInicio + 1;
        item.posicaoInicio = currentPos;
        item.posicaoFim = currentPos + slots - 1;
        currentPos = item.posicaoFim + 1;
      }
    });
    
    setConfig(newConfig);
  };

  const handleReset = () => {
    setConfig(DEFAULT_CONFIG);
    setHoraInicio(5);
    setHoraFim(24);
  };

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

  const totalSlots = config
    .filter((c) => c.ativo)
    .reduce((acc, c) => acc + (c.posicaoFim - c.posicaoInicio + 1), 0);

  const totalBlocos = (horaFim - horaInicio) * 2;

  return (
    <div className="space-y-6">
      {/* Header com Tabs */}
      <div className="glass-card p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              <h3 className="font-mono text-sm text-muted-foreground">
                <span className="text-primary">{">"}</span> grade_programacao
              </h3>
            </div>
            <TabsList className="bg-muted/30">
              <TabsTrigger value="visualizar" className="font-mono text-xs gap-1">
                <Play className="w-3 h-3" />
                Visualizar
              </TabsTrigger>
              <TabsTrigger value="configurar" className="font-mono text-xs gap-1">
                <Settings className="w-3 h-3" />
                Configurar
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Tab Configurar */}
          <TabsContent value="configurar" className="space-y-6 mt-4">
            {/* Horários */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-muted-foreground mb-2">
                  <Clock className="w-3 h-3 inline mr-1" />
                  Hora Início
                </label>
                <select
                  value={horaInicio}
                  onChange={(e) => setHoraInicio(Number(e.target.value))}
                  className="w-full p-2 rounded-lg bg-muted/30 border border-muted/50 text-foreground font-mono text-sm focus:border-primary/50 focus:outline-none"
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={i} className="bg-background">
                      {i.toString().padStart(2, "0")}:00
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-mono text-muted-foreground mb-2">
                  <Clock className="w-3 h-3 inline mr-1" />
                  Hora Fim
                </label>
                <select
                  value={horaFim}
                  onChange={(e) => setHoraFim(Number(e.target.value))}
                  className="w-full p-2 rounded-lg bg-muted/30 border border-muted/50 text-foreground font-mono text-sm focus:border-primary/50 focus:outline-none"
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i + 1} value={i + 1} className="bg-background">
                      {(i + 1).toString().padStart(2, "0")}:00
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Sequência de Rádios */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-mono text-muted-foreground">
                  Sequência de Rádios (arraste para reordenar)
                </label>
                <button
                  onClick={handleReset}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-muted/30 text-muted-foreground text-xs font-mono hover:bg-muted/50 transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  Reset
                </button>
              </div>
              <div className="space-y-2">
                {config.map((radio, index) => (
                  <div
                    key={radio.key}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-move ${
                      draggedIndex === index
                        ? "opacity-50 scale-95"
                        : radio.ativo
                          ? radioColorsDrag[radio.key]
                          : "bg-muted/10 border-muted/20 text-muted-foreground opacity-50"
                    }`}
                  >
                    <GripVertical className="w-4 h-4 opacity-50" />

                    <button
                      onClick={() => handleToggleActive(index)}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                        radio.ativo
                          ? "border-current bg-current/20"
                          : "border-muted/50"
                      }`}
                    >
                      {radio.ativo && <span className="text-xs">✓</span>}
                    </button>

                    <div className="flex-1">
                      <span className="font-mono font-semibold">{radio.nome}</span>
                      <span className="text-xs ml-2 opacity-70">
                        pos. {radio.posicaoInicio}-{radio.posicaoFim}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono opacity-70">Slots:</span>
                      <select
                        value={radio.posicaoFim - radio.posicaoInicio + 1}
                        onChange={(e) => handleSlotsChange(index, Number(e.target.value))}
                        disabled={!radio.ativo}
                        className="w-14 p-1 rounded bg-background/50 border border-current/30 text-center font-mono text-sm focus:outline-none disabled:opacity-50"
                      >
                        {[1, 2, 3, 4, 5].map((n) => (
                          <option key={n} value={n} className="bg-background">
                            {n}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Preview Visual da Sequência */}
            <div>
              <label className="block text-xs font-mono text-muted-foreground mb-3">
                Preview da Sequência (por bloco)
              </label>
              <div className="flex gap-1 flex-wrap">
                {config
                  .filter((r) => r.ativo)
                  .flatMap((radio) => {
                    const slots = radio.posicaoFim - radio.posicaoInicio + 1;
                    return Array.from({ length: slots }, (_, i) => (
                      <div
                        key={`${radio.key}-${i}`}
                        className={`w-10 h-10 rounded-lg flex items-center justify-center text-xs font-mono font-bold border ${radioColorsDrag[radio.key]}`}
                        title={`${radio.nome} - Posição ${radio.posicaoInicio + i}`}
                      >
                        {radio.key.slice(0, 2).toUpperCase()}
                      </div>
                    ));
                  })}
              </div>
            </div>

            {/* Estatísticas da Configuração */}
            <div className="grid grid-cols-3 gap-4 p-4 rounded-xl bg-muted/10 border border-muted/20">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary font-mono">{totalSlots}</div>
                <div className="text-xs text-muted-foreground">Músicas/Bloco</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary font-mono">{totalBlocos}</div>
                <div className="text-xs text-muted-foreground">Blocos/Dia</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary font-mono">
                  {totalSlots * totalBlocos}
                </div>
                <div className="text-xs text-muted-foreground">Total Músicas</div>
              </div>
            </div>

            {/* Botão Aplicar */}
            <button
              onClick={() => setActiveTab("visualizar")}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-mono font-semibold hover:bg-primary/90 transition-colors glow-primary flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4" />
              Aplicar e Visualizar Grade
            </button>
          </TabsContent>

          {/* Tab Visualizar */}
          <TabsContent value="visualizar" className="mt-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono text-muted-foreground">
                {grade.diaSemana} - {grade.data}
              </span>
              <button
                onClick={handleDownloadGrade}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/20 border border-primary/30 text-primary text-xs font-mono hover:bg-primary/30 transition-colors"
              >
                <Download className="w-3 h-3" />
                Exportar TXT
              </button>
            </div>

            {/* Estatísticas resumidas */}
            <div className="grid grid-cols-4 gap-4 p-4 rounded-xl bg-muted/10 border border-muted/20">
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
              <div className="text-center">
                <p className="text-2xl font-bold text-cyan-400">{totalSlots}</p>
                <p className="text-xs font-mono text-muted-foreground">por bloco</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Blocos: Atual + 3 próximos (sempre visível) */}
      {activeTab === "visualizar" && (
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
      )}

      {/* Faltantes */}
      {grade.estatisticas.faltantes.length > 0 && activeTab === "visualizar" && (
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
