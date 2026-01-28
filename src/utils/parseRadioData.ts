import type { RawRadioData, Station, Track } from "@/types/radio";

const genreMap: { [key: string]: string } = {
  "BH FM": "Pop/Sertanejo",
  "BH FM 102.1": "Pop/Sertanejo", 
  "Clube FM": "Sertanejo",
  "Clube FM Brasília 105.5": "Sertanejo",
  "Band FM": "Sertanejo/Pop",
  "Band FM 96.1": "Sertanejo/Pop",
  "Rádio Globo": "Pagode/Pop",
  "Rádio Globo RJ 98.1": "Pagode/Pop",
};

export function parseTrack(rawString: string): Track {
  // Format: "Song Title\n\nArtist Name\ntime ago"
  const parts = rawString.split("\n\n");
  
  if (parts.length >= 2) {
    const title = parts[0].trim();
    const artistParts = parts[1].split("\n");
    const artist = artistParts[0].trim();
    const timeAgo = artistParts[1]?.trim() || "LIVE";
    
    return { title, artist, timeAgo };
  }
  
  // Fallback
  return { 
    title: rawString.split("\n")[0] || "Unknown", 
    artist: "Unknown Artist", 
    timeAgo: "LIVE" 
  };
}

function getGenre(stationName: string): string {
  for (const [key, genre] of Object.entries(genreMap)) {
    if (stationName.includes(key)) {
      return genre;
    }
  }
  return "Brazilian Radio";
}

export function parseRadioData(rawData: RawRadioData): Station[] {
  const stations: Station[] = [];
  const seenNames = new Set<string>();

  for (const [id, radio] of Object.entries(rawData.radios)) {
    // Avoid duplicate stations by name
    if (seenNames.has(radio.nome)) continue;
    seenNames.add(radio.nome);

    const ultimoDado = radio.ultimo_dado;
    
    if (!ultimoDado || ultimoDado.erro) continue;

    const nowPlaying = parseTrack(ultimoDado.tocando_agora);
    const recentTracks = ultimoDado.ultimas_tocadas.map(parseTrack);

    stations.push({
      id,
      name: radio.nome,
      url: radio.url,
      genre: getGenre(radio.nome),
      nowPlaying,
      recentTracks,
      timestamp: ultimoDado.timestamp,
    });
  }

  return stations;
}
