import { useState, useEffect } from "react";
import { Folder, Save, Download, Music, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export interface FolderPaths {
  grade: string;
  downloads: string;
  acervo: string;
}

const DEFAULT_PATHS: FolderPaths = {
  grade: "C:/PGM-FM/Grade",
  downloads: "C:/PGM-FM/Downloads",
  acervo: "C:/PGM-FM/Acervo",
};

const STORAGE_KEY = "pgm_fm_folder_paths";

export function getStoredPaths(): FolderPaths {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
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

  useEffect(() => {
    setPaths(getStoredPaths());
  }, []);

  const handleChange = (key: keyof FolderPaths, value: string) => {
    setPaths((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    savePaths(paths);
    setHasChanges(false);
    toast.success("Caminhos salvos com sucesso!");
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

        {/* Acervo Path */}
        <div className="space-y-2">
          <Label htmlFor="acervo-path" className="flex items-center gap-2 text-muted-foreground">
            <Music className="h-4 w-4" />
            Pasta do Acervo Musical
          </Label>
          <Input
            id="acervo-path"
            value={paths.acervo}
            onChange={(e) => handleChange("acervo", e.target.value)}
            placeholder="C:/PGM-FM/Acervo"
            className="font-mono text-sm bg-background/50 border-border"
          />
          <p className="text-xs text-muted-foreground">
            Pasta raiz para busca de músicas no acervo local
          </p>
        </div>
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
        <p className="font-medium text-foreground mb-1">💡 Nota:</p>
        <p>
          Os caminhos são salvos localmente no navegador. Para acesso real ao sistema de arquivos,
          é necessário integrar com um backend (API local ou Electron).
        </p>
      </div>
    </div>
  );
}
