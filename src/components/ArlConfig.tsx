import { useState, useEffect } from "react";
import { Key, Save, Eye, EyeOff, Check, AlertCircle } from "lucide-react";

interface ArlConfigProps {
  onArlChange?: (arl: string | null) => void;
}

const ArlConfig = ({ onArlChange }: ArlConfigProps) => {
  const [arl, setArl] = useState("");
  const [savedArl, setSavedArl] = useState<string | null>(null);
  const [showArl, setShowArl] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("deemix_arl");
    if (stored) {
      setSavedArl(stored);
      setArl(stored);
      onArlChange?.(stored);
    }
  }, [onArlChange]);

  const handleSave = () => {
    if (arl.trim()) {
      localStorage.setItem("deemix_arl", arl.trim());
      setSavedArl(arl.trim());
      setIsEditing(false);
      onArlChange?.(arl.trim());
    }
  };

  const handleClear = () => {
    localStorage.removeItem("deemix_arl");
    setSavedArl(null);
    setArl("");
    setIsEditing(false);
    onArlChange?.(null);
  };

  const maskArl = (value: string) => {
    if (value.length <= 8) return value;
    return value.slice(0, 4) + "•".repeat(value.length - 8) + value.slice(-4);
  };

  return (
    <div className="glass-card p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Key className="w-4 h-4 text-primary" />
          <h3 className="font-mono text-xs text-muted-foreground">
            <span className="text-primary">{">"}</span> deemix_arl
          </h3>
        </div>
        {savedArl && !isEditing && (
          <div className="flex items-center gap-1 text-green-400">
            <Check className="w-3 h-3" />
            <span className="text-[10px] font-mono">Configurado</span>
          </div>
        )}
      </div>

      {/* Status ou Input */}
      {savedArl && !isEditing ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/20 border border-muted/30">
            <span className="font-mono text-xs text-muted-foreground flex-1 truncate">
              {showArl ? savedArl : maskArl(savedArl)}
            </span>
            <button
              onClick={() => setShowArl(!showArl)}
              className="p-1 rounded hover:bg-muted/30"
              title={showArl ? "Ocultar" : "Mostrar"}
            >
              {showArl ? (
                <EyeOff className="w-3 h-3 text-muted-foreground" />
              ) : (
                <Eye className="w-3 h-3 text-muted-foreground" />
              )}
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setIsEditing(true)}
              className="flex-1 px-3 py-1.5 rounded-lg bg-muted/30 text-muted-foreground text-xs font-mono hover:bg-muted/50"
            >
              Alterar
            </button>
            <button
              onClick={handleClear}
              className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-xs font-mono hover:bg-red-500/30"
            >
              Remover
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-start gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <AlertCircle className="w-3 h-3 text-amber-400 mt-0.5 flex-shrink-0" />
            <p className="text-[10px] text-amber-400/80 font-mono">
              O ARL é obtido nos cookies do Deezer após login. Necessário para downloads.
            </p>
          </div>
          <div className="relative">
            <input
              type={showArl ? "text" : "password"}
              value={arl}
              onChange={(e) => setArl(e.target.value)}
              placeholder="Cole seu ARL aqui..."
              className="w-full px-3 py-2 pr-20 rounded-lg bg-muted/30 border border-muted/50 text-foreground font-mono text-xs placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
              <button
                onClick={() => setShowArl(!showArl)}
                className="p-1 rounded hover:bg-muted/30"
              >
                {showArl ? (
                  <EyeOff className="w-3 h-3 text-muted-foreground" />
                ) : (
                  <Eye className="w-3 h-3 text-muted-foreground" />
                )}
              </button>
              <button
                onClick={handleSave}
                disabled={!arl.trim()}
                className="p-1 rounded bg-primary/20 text-primary hover:bg-primary/30 disabled:opacity-50"
              >
                <Save className="w-3 h-3" />
              </button>
            </div>
          </div>
          {isEditing && (
            <button
              onClick={() => {
                setIsEditing(false);
                setArl(savedArl || "");
              }}
              className="w-full px-3 py-1.5 rounded-lg bg-muted/30 text-muted-foreground text-xs font-mono hover:bg-muted/50"
            >
              Cancelar
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ArlConfig;
