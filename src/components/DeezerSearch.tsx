import { useState } from "react";
import { Search, Music, Download, ExternalLink, Play, Loader2 } from "lucide-react";
import { searchDeezer, type DeezerTrack } from "@/utils/deezerApi";

interface DeezerSearchProps {
  onSelectTrack?: (track: DeezerTrack) => void;
  faltantes?: string[];
}

const DeezerSearch = ({ onSelectTrack, faltantes = [] }: DeezerSearchProps) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<DeezerTrack[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState<string | null>(null);

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    setSearching(searchQuery);
    
    const tracks = await searchDeezer(searchQuery, 10);
    setResults(tracks);
    setLoading(false);
  };

  const handleSearchFaltante = async (faltante: string) => {
    // Extrai artista - título do formato "[HH:MM] Artista - Título"
    const match = faltante.match(/\[.*?\]\s*(.+)/);
    if (match) {
      const trackInfo = match[1];
      setQuery(trackInfo);
      await handleSearch(trackInfo);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="glass-card p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Music className="w-5 h-5 text-primary" />
        <h3 className="font-mono text-sm text-muted-foreground">
          <span className="text-primary">{">"}</span> deezer_search
        </h3>
      </div>

      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch(query)}
          placeholder="Buscar música no Deezer..."
          className="w-full px-4 py-3 pl-10 rounded-xl bg-muted/30 border border-muted/50 text-foreground font-mono text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
        />
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <button
          onClick={() => handleSearch(query)}
          disabled={loading}
          className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-mono hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : "Buscar"}
        </button>
      </div>

      {/* Músicas Faltantes */}
      {faltantes.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-mono text-muted-foreground">
            Músicas faltantes (clique para buscar):
          </p>
          <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
            {faltantes.slice(0, 10).map((f, i) => (
              <button
                key={i}
                onClick={() => handleSearchFaltante(f)}
                className="px-2 py-1 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-[10px] font-mono hover:bg-red-500/30 truncate max-w-[200px]"
                title={f}
              >
                {f.replace(/\[.*?\]\s*/, "")}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
          <span className="ml-2 text-sm font-mono text-muted-foreground">
            Buscando "{searching}"...
          </span>
        </div>
      )}

      {/* Results */}
      {!loading && results.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-mono text-muted-foreground">
            {results.length} resultados encontrados:
          </p>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {results.map((track) => (
              <div
                key={track.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-muted/20 border border-muted/30 hover:border-primary/30 transition-colors group"
              >
                {/* Album Cover */}
                <img
                  src={track.album.cover_small}
                  alt={track.album.title}
                  className="w-12 h-12 rounded-lg object-cover"
                />

                {/* Track Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-sm text-foreground truncate">
                    {track.title}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {track.artist.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground/60">
                    {formatDuration(track.duration)} • {track.album.title}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {track.preview && (
                    <a
                      href={track.preview}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-primary/20 text-primary hover:bg-primary/30"
                      title="Preview 30s"
                    >
                      <Play className="w-4 h-4" />
                    </a>
                  )}
                  <a
                    href={track.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-muted/30 text-muted-foreground hover:bg-muted/50"
                    title="Abrir no Deezer"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  {onSelectTrack && (
                    <button
                      onClick={() => onSelectTrack(track)}
                      className="p-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30"
                      title="Usar esta música"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Results */}
      {!loading && results.length === 0 && query && (
        <div className="text-center py-6">
          <p className="text-sm font-mono text-muted-foreground">
            Nenhum resultado para "{query}"
          </p>
        </div>
      )}
    </div>
  );
};

export default DeezerSearch;
