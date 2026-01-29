import { useState, useEffect } from "react";
import {
  AlertTriangle,
  Search,
  Download,
  Music,
  Loader2,
  Check,
  ExternalLink,
  Play,
  FileDown,
  RefreshCw,
  Trash2,
  Copy,
} from "lucide-react";
import { searchDeezer, type DeezerTrack, getDeemixDownloadInfo, getStoredArl } from "@/utils/deezerApi";
import { getFileName } from "@/utils/dnaUtils";
import { toast } from "sonner";

interface FaltandoManagerProps {
  faltantes: string[];
  onDownloadReady?: (tracks: DeezerTrack[]) => void;
}

interface FaltanteItem {
  original: string;
  horario: string;
  artista: string;
  titulo: string;
  searchQuery: string;
  status: "pending" | "searching" | "found" | "not_found" | "selected";
  deezerTrack?: DeezerTrack;
  alternatives?: DeezerTrack[];
}

const FaltandoManager = ({ faltantes, onDownloadReady }: FaltandoManagerProps) => {
  const [items, setItems] = useState<FaltanteItem[]>([]);
  const [selectedTracks, setSelectedTracks] = useState<DeezerTrack[]>([]);
  const [isSearchingAll, setIsSearchingAll] = useState(false);
  const [arl, setArl] = useState<string | null>(null);

  useEffect(() => {
    setArl(getStoredArl());
  }, []);

  useEffect(() => {
    // Parse faltantes para extrair info
    const parsed: FaltanteItem[] = faltantes.map((f) => {
      // Formato: "[HH:MM] Artista - Título"
      const match = f.match(/\[(\d{2}:\d{2})\]\s*(.+?)\s*-\s*(.+)/);
      if (match) {
        return {
          original: f,
          horario: match[1],
          artista: match[2].trim(),
          titulo: match[3].trim(),
          searchQuery: `${match[2].trim()} ${match[3].trim()}`,
          status: "pending" as const,
        };
      }
      // Fallback se não bater o padrão
      const parts = f.replace(/\[.*?\]\s*/, "").split(" - ");
      return {
        original: f,
        horario: "",
        artista: parts[0] || "",
        titulo: parts[1] || f,
        searchQuery: f.replace(/\[.*?\]\s*/, ""),
        status: "pending" as const,
      };
    });
    setItems(parsed);
  }, [faltantes]);

  const searchSingle = async (index: number) => {
    const item = items[index];
    if (!item) return;

    setItems((prev) =>
      prev.map((it, i) => (i === index ? { ...it, status: "searching" } : it))
    );

    const results = await searchDeezer(item.searchQuery, 5);

    setItems((prev) =>
      prev.map((it, i) => {
        if (i !== index) return it;
        if (results.length > 0) {
          return {
            ...it,
            status: "found",
            deezerTrack: results[0],
            alternatives: results.slice(1),
          };
        }
        return { ...it, status: "not_found" };
      })
    );
  };

  const searchAll = async () => {
    setIsSearchingAll(true);

    for (let i = 0; i < items.length; i++) {
      if (items[i].status === "pending" || items[i].status === "not_found") {
        await searchSingle(i);
        // Delay para não sobrecarregar API
        await new Promise((r) => setTimeout(r, 300));
      }
    }

    setIsSearchingAll(false);
    toast.success("Busca concluída!");
  };

  const selectTrack = (index: number, track: DeezerTrack) => {
    setItems((prev) =>
      prev.map((it, i) =>
        i === index ? { ...it, status: "selected", deezerTrack: track } : it
      )
    );

    setSelectedTracks((prev) => {
      // Remove se já existir e adiciona o novo
      const filtered = prev.filter((t) => t.id !== track.id);
      return [...filtered, track];
    });
  };

  const deselectTrack = (trackId: number) => {
    setSelectedTracks((prev) => prev.filter((t) => t.id !== trackId));
    setItems((prev) =>
      prev.map((it) =>
        it.deezerTrack?.id === trackId ? { ...it, status: "found" } : it
      )
    );
  };

  const selectAllFound = () => {
    const foundItems = items.filter((it) => it.status === "found" && it.deezerTrack);
    const newTracks = foundItems
      .map((it) => it.deezerTrack!)
      .filter((t) => !selectedTracks.some((st) => st.id === t.id));

    setSelectedTracks((prev) => [...prev, ...newTracks]);
    setItems((prev) =>
      prev.map((it) =>
        it.status === "found" && it.deezerTrack ? { ...it, status: "selected" } : it
      )
    );
    toast.success(`${newTracks.length} músicas selecionadas`);
  };

  const generateDeemixList = () => {
    // Gera lista de URLs do Deezer para Deemix
    const lines = selectedTracks.map(
      (track) => `https://www.deezer.com/track/${track.id}`
    );
    return lines.join("\n");
  };

  const generateFaltandoTxt = () => {
    // Gera faltando.txt no formato: Artista - Titulo
    const lines = selectedTracks.map(
      (track) => `${track.artist.name} - ${track.title}`
    );
    return lines.join("\n");
  };

  const downloadDeemixList = () => {
    const content = generateDeemixList();
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "deemix_download.txt";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Lista Deemix gerada!");
  };

  const copyDeemixList = () => {
    const content = generateDeemixList();
    navigator.clipboard.writeText(content);
    toast.success("Lista copiada para a área de transferência!");
  };

  const downloadFaltandoTxt = () => {
    const content = generateFaltandoTxt();
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "faltando.txt";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("faltando.txt gerado!");
  };

  const getStatusIcon = (status: FaltanteItem["status"]) => {
    switch (status) {
      case "pending":
        return <Search className="w-4 h-4 text-muted-foreground" />;
      case "searching":
        return <Loader2 className="w-4 h-4 text-primary animate-spin" />;
      case "found":
        return <Music className="w-4 h-4 text-green-400" />;
      case "selected":
        return <Check className="w-4 h-4 text-primary" />;
      case "not_found":
        return <AlertTriangle className="w-4 h-4 text-red-400" />;
    }
  };

  const getStatusColor = (status: FaltanteItem["status"]) => {
    switch (status) {
      case "pending":
        return "border-muted/30";
      case "searching":
        return "border-primary/50";
      case "found":
        return "border-green-500/30 bg-green-500/5";
      case "selected":
        return "border-primary/50 bg-primary/10";
      case "not_found":
        return "border-red-500/30 bg-red-500/5";
    }
  };

  const foundCount = items.filter((it) => it.status === "found" || it.status === "selected").length;
  const notFoundCount = items.filter((it) => it.status === "not_found").length;

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <span className="font-mono text-sm text-muted-foreground">
              {items.length} músicas faltantes
            </span>
          </div>
          {foundCount > 0 && (
            <span className="px-2 py-1 rounded-lg bg-green-500/20 text-green-400 text-xs font-mono">
              {foundCount} encontradas
            </span>
          )}
          {notFoundCount > 0 && (
            <span className="px-2 py-1 rounded-lg bg-red-500/20 text-red-400 text-xs font-mono">
              {notFoundCount} não encontradas
            </span>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={searchAll}
            disabled={isSearchingAll}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-mono text-sm hover:bg-primary/90 disabled:opacity-50"
          >
            {isSearchingAll ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            {isSearchingAll ? "Buscando..." : "Buscar Todas"}
          </button>

          {foundCount > 0 && (
            <button
              onClick={selectAllFound}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500/20 border border-green-500/30 text-green-400 font-mono text-sm hover:bg-green-500/30"
            >
              <Check className="w-4 h-4" />
              Selecionar Encontradas
            </button>
          )}
        </div>
      </div>

      {/* ARL Warning */}
      {!arl && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5" />
          <div className="text-xs text-amber-400/80 font-mono">
            <p className="font-medium">ARL não configurado</p>
            <p className="opacity-80">Configure o ARL na aba Configurações para habilitar downloads via Deemix.</p>
          </div>
        </div>
      )}

      {/* Lista de Faltantes */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {items.map((item, index) => (
          <div
            key={index}
            className={`p-3 rounded-xl border transition-colors ${getStatusColor(item.status)}`}
          >
            <div className="flex items-center gap-3">
              {/* Status Icon */}
              <div className="flex-shrink-0">{getStatusIcon(item.status)}</div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {item.horario && (
                    <span className="text-[10px] font-mono text-primary px-1.5 py-0.5 rounded bg-primary/20">
                      {item.horario}
                    </span>
                  )}
                  <span className="font-mono text-sm text-foreground truncate">
                    {item.artista} - {item.titulo}
                  </span>
                </div>

                {/* Track encontrada */}
                {item.deezerTrack && (item.status === "found" || item.status === "selected") && (
                  <div className="flex items-center gap-2 mt-2">
                    <img
                      src={item.deezerTrack.album.cover_small}
                      alt=""
                      className="w-8 h-8 rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-mono truncate">
                        {item.deezerTrack.artist.name} - {item.deezerTrack.title}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {item.deezerTrack.album.title}
                      </p>
                    </div>
                    {item.deezerTrack.preview && (
                      <a
                        href={item.deezerTrack.preview}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg bg-muted/30 hover:bg-muted/50"
                        title="Preview 30s"
                      >
                        <Play className="w-3 h-3 text-muted-foreground" />
                      </a>
                    )}
                    <a
                      href={item.deezerTrack.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg bg-muted/30 hover:bg-muted/50"
                      title="Abrir no Deezer"
                    >
                      <ExternalLink className="w-3 h-3 text-muted-foreground" />
                    </a>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                {item.status === "pending" && (
                  <button
                    onClick={() => searchSingle(index)}
                    className="p-2 rounded-lg bg-muted/30 hover:bg-muted/50"
                    title="Buscar"
                  >
                    <Search className="w-4 h-4 text-muted-foreground" />
                  </button>
                )}

                {item.status === "found" && item.deezerTrack && (
                  <button
                    onClick={() => selectTrack(index, item.deezerTrack!)}
                    className="p-2 rounded-lg bg-green-500/20 hover:bg-green-500/30 text-green-400"
                    title="Selecionar"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                )}

                {item.status === "selected" && item.deezerTrack && (
                  <button
                    onClick={() => deselectTrack(item.deezerTrack!.id)}
                    className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400"
                    title="Remover"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}

                {item.status === "not_found" && (
                  <button
                    onClick={() => searchSingle(index)}
                    className="p-2 rounded-lg bg-muted/30 hover:bg-muted/50"
                    title="Tentar novamente"
                  >
                    <RefreshCw className="w-4 h-4 text-muted-foreground" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Selected Tracks Summary */}
      {selectedTracks.length > 0 && (
        <div className="p-4 rounded-xl bg-primary/10 border border-primary/30 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Download className="w-5 h-5 text-primary" />
              <span className="font-mono text-sm text-primary font-medium">
                {selectedTracks.length} músicas prontas para download
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={downloadDeemixList}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-mono text-sm hover:bg-primary/90"
            >
              <FileDown className="w-4 h-4" />
              Baixar deemix_download.txt
            </button>

            <button
              onClick={copyDeemixList}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted/30 border border-muted/50 text-foreground font-mono text-sm hover:bg-muted/50"
            >
              <Copy className="w-4 h-4" />
              Copiar URLs
            </button>

            <button
              onClick={downloadFaltandoTxt}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted/30 border border-muted/50 text-foreground font-mono text-sm hover:bg-muted/50"
            >
              <FileDown className="w-4 h-4" />
              Baixar faltando.txt
            </button>
          </div>

          {/* Preview da lista */}
          <div className="mt-3 p-3 rounded-lg bg-muted/20 max-h-32 overflow-y-auto">
            <p className="text-[10px] font-mono text-muted-foreground mb-1">
              Preview deemix_download.txt:
            </p>
            <div className="space-y-0.5">
              {selectedTracks.slice(0, 5).map((track) => (
                <p key={track.id} className="text-xs font-mono text-foreground/70 truncate">
                  https://www.deezer.com/track/{track.id}
                </p>
              ))}
              {selectedTracks.length > 5 && (
                <p className="text-xs font-mono text-muted-foreground">
                  ... e mais {selectedTracks.length - 5} URLs
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FaltandoManager;
