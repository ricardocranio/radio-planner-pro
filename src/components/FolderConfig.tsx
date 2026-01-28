import { useState, useEffect } from "react";
import { Folder, Save, Plus, Trash2, Download, Music, FileText, FolderPlus, ChevronDown, ChevronUp, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";

export interface DirectoryEntry {
  id: string;
  path: string;
  label: string;
  isSubdirectory?: boolean;
}

export interface FolderPaths {
  grade: string;
  downloads: string;
  acervoDirectories: DirectoryEntry[];
}

const DEFAULT_PATHS: FolderPaths = {
  grade: "C:/PGM-FM/Grade",
  downloads: "C:/PGM-FM/Downloads",
  acervoDirectories: [
    { id: "acervo_1", path: "C:/PGM-FM/Acervo", label: "Acervo Principal", isSubdirectory: false },
  ],
};

const STORAGE_KEY = "pgm_fm_folder_paths";

export function getStoredPaths(): FolderPaths {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Migração do formato antigo (se houver apenas `acervo` string)
      if (typeof parsed.acervo === "string" && !parsed.acervoDirectories) {
        return {
          grade: parsed.grade || DEFAULT_PATHS.grade,
          downloads: parsed.downloads || DEFAULT_PATHS.downloads,
          acervoDirectories: [
            { id: "acervo_1", path: parsed.acervo, label: "Acervo Principal", isSubdirectory: false },
          ],
        };
      }
      return {
        grade: parsed.grade || DEFAULT_PATHS.grade,
        downloads: parsed.downloads || DEFAULT_PATHS.downloads,
        acervoDirectories: parsed.acervoDirectories || DEFAULT_PATHS.acervoDirectories,
      };
    }
  } catch (error) {
    console.error("Erro ao carregar caminhos:", error);
  }
  return DEFAULT_PATHS;
}

export function savePaths(paths: FolderPaths): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(paths));
}

export function FolderConfig() {
  const [paths, setPaths] = useState<FolderPaths>(DEFAULT_PATHS);
  const [hasChanges, setHasChanges] = useState(false);
  const [isAcervoOpen, setIsAcervoOpen] = useState(true);
  const [newDirPath, setNewDirPath] = useState("");
  const [newDirLabel, setNewDirLabel] = useState("");
  const [isAddingDir, setIsAddingDir] = useState(false);

  useEffect(() => {
    setPaths(getStoredPaths());
  }, []);

  const handleChange = (key: "grade" | "downloads", value: string) => {
    setPaths((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleAddDirectory = () => {
    if (!newDirPath.trim()) {
      toast.error("Informe o caminho do diretório");
      return;
    }

    const newDir: DirectoryEntry = {
      id: `acervo_${Date.now()}`,
      path: newDirPath.trim(),
      label: newDirLabel.trim() || `Diretório ${paths.acervoDirectories.length + 1}`,
      isSubdirectory: false,
    };

    setPaths((prev) => ({
      ...prev,
      acervoDirectories: [...prev.acervoDirectories, newDir],
    }));

    setNewDirPath("");
    setNewDirLabel("");
    setIsAddingDir(false);
    setHasChanges(true);
    toast.success(`Diretório "${newDir.label}" adicionado`);
  };

  const handleRemoveDirectory = (id: string) => {
    if (paths.acervoDirectories.length <= 1) {
      toast.error("É necessário manter pelo menos um diretório de acervo");
      return;
    }

    const dirToRemove = paths.acervoDirectories.find((d) => d.id === id);
    setPaths((prev) => ({
      ...prev,
      acervoDirectories: prev.acervoDirectories.filter((d) => d.id !== id),
    }));
    setHasChanges(true);
    toast.info(`Diretório "${dirToRemove?.label}" removido`);
  };

  const handleUpdateDirectory = (id: string, updates: Partial<DirectoryEntry>) => {
    setPaths((prev) => ({
      ...prev,
      acervoDirectories: prev.acervoDirectories.map((d) =>
        d.id === id ? { ...d, ...updates } : d
      ),
    }));
    setHasChanges(true);
  };

  const handleToggleSubdirectory = (id: string) => {
    setPaths((prev) => ({
      ...prev,
      acervoDirectories: prev.acervoDirectories.map((d) =>
        d.id === id ? { ...d, isSubdirectory: !d.isSubdirectory } : d
      ),
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    savePaths(paths);
    setHasChanges(false);
    toast.success("Configurações salvas com sucesso!");
  };

  const handleReset = () => {
    setPaths(DEFAULT_PATHS);
    setHasChanges(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-primary">
        <Folder className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Configuração de Pastas</h3>
      </div>

      <div className="grid gap-4">
        {/* Grade Path */}
        <div className="space-y-2">
          <Label htmlFor="grade-path" className="flex items-center gap-2 text-muted-foreground">
            <FileText className="h-4 w-4" />
            Pasta da Grade (TXT exportado)
          </Label>
          <Input
            id="grade-path"
            value={paths.grade}
            onChange={(e) => handleChange("grade", e.target.value)}
            placeholder="C:/PGM-FM/Grade"
            className="font-mono text-sm bg-background/50 border-border"
          />
          <p className="text-xs text-muted-foreground">
            Onde será salvo o arquivo grade.txt e faltando.txt
          </p>
        </div>

        {/* Downloads Path */}
        <div className="space-y-2">
          <Label htmlFor="downloads-path" className="flex items-center gap-2 text-muted-foreground">
            <Download className="h-4 w-4" />
            Pasta de Downloads (Músicas baixadas)
          </Label>
          <Input
            id="downloads-path"
            value={paths.downloads}
            onChange={(e) => handleChange("downloads", e.target.value)}
            placeholder="C:/PGM-FM/Downloads"
            className="font-mono text-sm bg-background/50 border-border"
          />
          <p className="text-xs text-muted-foreground">
            Onde serão salvas as músicas baixadas via Deezer/Deemix
          </p>
        </div>

        {/* Acervo Directories - Collapsible Section */}
        <Collapsible open={isAcervoOpen} onOpenChange={setIsAcervoOpen}>
          <div className="space-y-2">
            <CollapsibleTrigger asChild>
              <button className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors w-full text-left">
                <Music className="h-4 w-4" />
                <span className="font-medium flex-1">Diretórios do Acervo Musical</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary">
                  {paths.acervoDirectories.length}
                </span>
                {isAcervoOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
            </CollapsibleTrigger>
            <p className="text-xs text-muted-foreground">
              Configure múltiplos diretórios para busca de músicas no acervo local
            </p>
          </div>

          <CollapsibleContent className="space-y-3 pt-3">
            {/* Lista de diretórios */}
            <div className="space-y-2">
              {paths.acervoDirectories.map((dir, index) => (
                <div
                  key={dir.id}
                  className="p-3 rounded-lg bg-muted/20 border border-border space-y-2"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-muted-foreground w-6">
                      #{index + 1}
                    </span>
                    <Input
                      value={dir.label}
                      onChange={(e) => handleUpdateDirectory(dir.id, { label: e.target.value })}
                      placeholder="Nome do diretório"
                      className="font-medium text-sm h-8 bg-background/50"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleRemoveDirectory(dir.id)}
                      disabled={paths.acervoDirectories.length <= 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex items-center gap-2 pl-8">
                    <Input
                      value={dir.path}
                      onChange={(e) => handleUpdateDirectory(dir.id, { path: e.target.value })}
                      placeholder="C:/Caminho/Para/Acervo"
                      className="font-mono text-xs h-8 bg-background/50"
                    />
                  </div>

                  <div className="flex items-center gap-2 pl-8">
                    <button
                      onClick={() => handleToggleSubdirectory(dir.id)}
                      className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-md transition-colors ${
                        dir.isSubdirectory
                          ? "bg-primary/20 text-primary border border-primary/30"
                          : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
                      }`}
                    >
                      <RefreshCw className="h-3 w-3" />
                      {dir.isSubdirectory ? "Busca recursiva ativa" : "Incluir subdiretórios"}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Adicionar novo diretório */}
            {isAddingDir ? (
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 space-y-3">
                <div className="flex items-center gap-2 text-primary text-sm font-medium">
                  <FolderPlus className="h-4 w-4" />
                  Novo Diretório
                </div>
                <div className="grid gap-2">
                  <Input
                    value={newDirLabel}
                    onChange={(e) => setNewDirLabel(e.target.value)}
                    placeholder="Nome (ex: Acervo 2024)"
                    className="text-sm h-8"
                  />
                  <Input
                    value={newDirPath}
                    onChange={(e) => setNewDirPath(e.target.value)}
                    placeholder="Caminho (ex: D:/Musicas/Acervo)"
                    className="font-mono text-xs h-8"
                  />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleAddDirectory} className="flex-1">
                    <Plus className="h-3 w-3 mr-1" />
                    Adicionar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setIsAddingDir(false);
                      setNewDirPath("");
                      setNewDirLabel("");
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAddingDir(true)}
                className="w-full border-dashed"
              >
                <FolderPlus className="h-4 w-4 mr-2" />
                Adicionar Diretório de Acervo
              </Button>
            )}
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <Button
          onClick={handleSave}
          disabled={!hasChanges}
          className="flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          Salvar Configurações
        </Button>
        <Button
          variant="outline"
          onClick={handleReset}
          className="text-muted-foreground"
        >
          Restaurar Padrão
        </Button>
      </div>

      {/* Info Box */}
      <div className="p-3 rounded-md bg-muted/30 border border-border text-sm text-muted-foreground">
        <p className="font-medium text-foreground mb-1">💡 Como funciona:</p>
        <ul className="space-y-1 list-disc list-inside text-xs">
          <li>Adicione quantos diretórios de acervo precisar</li>
          <li>Ative "Incluir subdiretórios" para busca recursiva em subpastas</li>
          <li>A ordem dos diretórios define a prioridade de busca</li>
          <li>Os caminhos são salvos localmente no navegador</li>
        </ul>
      </div>
    </div>
  );
}
