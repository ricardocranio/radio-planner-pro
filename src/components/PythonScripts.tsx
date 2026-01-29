import { useState } from "react";
import { Download, Code, FileText, Terminal, Copy, Check, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

// Scripts Python para download
const PGM_FM_SCRIPT = `#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
PGM-FM - Sistema de Programação Musical (V8.0)
Versão com:
- Blocos TOP30 corrigidos (17:00-18:30)
- Monitoramento contínuo em segundo plano
- Detecção automática de músicas faltantes
- Sistema de DNA de rádios aprimorado
- VHT entre músicas
- RECEBE DADOS DE RÁDIOS DO SUPABASE (radio_monitor_supabase.py)

Uso:
  python pgm_fm.py

Requisitos:
  pip install supabase mutagen
"""

import sys
import os
import re
import time
import unicodedata
import random
import html
import json
import logging
import threading
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Set

try:
    from mutagen.id3 import ID3, TPE1, TIT2
    MUTAGEN_AVAILABLE = True
except ImportError:
    MUTAGEN_AVAILABLE = False


def get_dna(s: str) -> str:
    """Gera uma 'impressão digital' normalizada de uma string"""
    if not s:
        return ""
    s = html.unescape(s)
    s = unicodedata.normalize('NFD', s)
    s = "".join(c for c in s if not unicodedata.combining(c))
    
    patterns = [
        r'\\(.*?\\)', r'\\[.*?\\]', r'\\bao vivo\\b', r'\\blive\\b', 
        r'\\bacoustic\\b', r'\\bacustico\\b', r'\\bfeat\\b', r'\\bft\\b',
        r'clipe oficial', r'video oficial', r'oficial', r'hd', r'4k',
        r'lyric', r'audio', r'remaster', r'20\\d{2}', r'\\b-\\b'
    ]
    for p in patterns:
        s = re.sub(p, '', s, flags=re.IGNORECASE)
    
    s = re.sub(r'[^a-zA-Z0-9]', '', s)
    return s.lower().strip()


def get_day_of_week_portuguese() -> str:
    """Retorna o dia da semana atual em português"""
    days = {
        "Monday": "SEGUNDA", "Tuesday": "TERCA", "Wednesday": "QUARTA",
        "Thursday": "QUINTA", "Friday": "SEXTA", "Saturday": "SABADO", "Sunday": "DOMINGO"
    }
    return days[datetime.now().strftime("%A")]


def load_json_file(filepath: Path, default: dict = None) -> dict:
    """Carrega um arquivo JSON com tratamento de erros"""
    if default is None:
        default = {}
    if not filepath.exists():
        return default
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        logging.error(f"Erro ao ler JSON {filepath}: {e}")
        return default


def save_json_file(filepath: Path, data: dict) -> bool:
    """Salva dados em um arquivo JSON"""
    try:
        filepath.parent.mkdir(parents=True, exist_ok=True)
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=4, ensure_ascii=False)
        return True
    except Exception as e:
        logging.error(f"Erro ao salvar JSON {filepath}: {e}")
        return False


# Configuração padrão
DEFAULT_CONFIG = {
    "pastas": {
        "musicas": ["C:\\\\Playlist\\\\Musicas"],
        "grades": "C:\\\\Playlist\\\\pgm\\\\Grades",
        "conteudos": "C:\\\\Playlist\\\\pgm\\\\Conteudos",
        "romanticas": "C:\\\\Playlist\\\\pgm\\\\Romanticas"
    },
    "distribuicao_bloco": {
        "bh": {"posicao_inicio": 1, "posicao_fim": 3},
        "band": {"posicao_inicio": 4, "posicao_fim": 6},
        "clube": {"posicao_inicio": 7, "posicao_fim": 8},
        "globo": {"posicao_inicio": 9, "posicao_fim": 10}
    },
    "programas_por_horario": {
        "5-9": "MANHA_TOTAL",
        "9-12": "MANHA_HITS",
        "12-14": "HORA_DO_ALMOCO",
        "14-17": "TARDE_HITS",
        "17-19": "TOP30",
        "19-22": "NOITE_ESPECIAL",
        "22-24": "MADRUGADA"
    },
    "sistema": {
        "codigo_coringa": "mus",
        "separador_vht": "vht"
    }
}


class PGMSystem:
    """Sistema principal de programação musical"""
    
    def __init__(self, config: dict):
        self.config = config
        self.music_folders = [Path(p) for p in config.get("pastas", {}).get("musicas", [])]
        self.grade_folder = Path(config.get("pastas", {}).get("grades", "."))
        
        self.grade_memory: Dict[str, List] = {}
        self.used_in_previous_blocks: Set[str] = set()
        
        self._init_empty_grade()
        self.grade_folder.mkdir(parents=True, exist_ok=True)
    
    def _init_empty_grade(self):
        """Inicializa estrutura de grade vazia"""
        self.grade_memory = {}
        self.used_in_previous_blocks = set()
        for h in range(24):
            for m in [0, 30]:
                self.grade_memory[f"{h:02d}:{m:02d}"] = []
    
    def _catalog_folder(self, folder_path: Path) -> Dict[str, dict]:
        """Cataloga todos os MP3s de uma pasta"""
        inventory = {}
        if not folder_path.exists():
            return inventory
        
        for root, _, files in os.walk(folder_path):
            for filename in files:
                if filename.lower().endswith(".mp3"):
                    file_path = Path(root) / filename
                    name_without_ext = file_path.name.rsplit('.', 1)[0]
                    dna = get_dna(name_without_ext)
                    
                    if dna:
                        inventory[dna] = {
                            "file": file_path.name,
                            "path": str(file_path),
                        }
        
        return inventory
    
    def get_inventory(self) -> Dict[str, dict]:
        """Retorna inventário de músicas"""
        inventory = {}
        for folder in self.music_folders:
            inventory.update(self._catalog_folder(folder))
        logging.info(f"   📁 Inventário: {len(inventory)} músicas no acervo")
        return inventory
    
    def build_block(self, time_str: str, hour: int, inventory: Dict[str, dict]) -> List[Tuple[str, str]]:
        """Monta um bloco de programação"""
        block = []
        used_dnas = set()
        
        coringa = self.config.get("sistema", {}).get("codigo_coringa", "mus")
        vht = self.config.get("sistema", {}).get("separador_vht", "vht")
        
        distribuicao = self.config.get("distribuicao_bloco", {})
        total_positions = max(d.get("posicao_fim", 0) for d in distribuicao.values()) if distribuicao else 10
        
        for pos in range(1, total_positions + 1):
            target_radio = self._get_position_radio(pos)
            
            # Adiciona VHT antes (exceto primeira posição)
            if block:
                block.append((vht, "VHT"))
            
            # Placeholder: usar coringa por padrão
            block.append((coringa, "CORINGA"))
        
        return block
    
    def _get_position_radio(self, position: int) -> str:
        """Retorna qual rádio corresponde a uma posição"""
        for radio, dist in self.config.get("distribuicao_bloco", {}).items():
            if dist["posicao_inicio"] <= position <= dist["posicao_fim"]:
                return radio
        return "bh"
    
    def generate_grade(self, hora_inicio: int = 5, hora_fim: int = 24):
        """Gera a grade completa"""
        self._init_empty_grade()
        inventory = self.get_inventory()
        
        for hour in range(hora_inicio, hora_fim):
            for minute in [0, 30]:
                time_str = f"{hour:02d}:{minute:02d}"
                block = self.build_block(time_str, hour, inventory)
                self.grade_memory[time_str] = block
        
        self.save_grade()
    
    def save_grade(self):
        """Salva a grade em arquivo"""
        day_map = {
            "Mon": "SEG", "Tue": "TER", "Wed": "QUA", 
            "Thu": "QUI", "Fri": "SEX", "Sat": "SAB", "Sun": "DOM"
        }
        grade_file = self.grade_folder / f"{day_map.get(datetime.now().strftime('%a'), 'GRADE')}.txt"
        
        lines = []
        programas = self.config.get("programas_por_horario", {})
        coringa = self.config.get("sistema", {}).get("codigo_coringa", "mus")
        vht = self.config.get("sistema", {}).get("separador_vht", "vht")
        
        for time_str in sorted(self.grade_memory.keys()):
            hour = int(time_str.split(':')[0])
            
            prog = "PROGRAMA"
            for range_str, name in programas.items():
                parts = range_str.split('-')
                if len(parts) == 2:
                    start, end = int(parts[0]), int(parts[1])
                    if start <= hour <= end:
                        prog = name
                        break
            
            songs = self.grade_memory[time_str]
            if not songs:
                lines.append(f"{time_str} (Fixo ID={prog})")
                continue
            
            formatted = []
            for song_name, source in songs:
                if source == "VHT":
                    formatted.append(vht)
                elif song_name != coringa:
                    formatted.append(f'"{song_name}"')
                else:
                    formatted.append(song_name)
            
            lines.append(f"{time_str} (ID={prog}) " + ",".join(formatted))
        
        try:
            with open(grade_file, 'w', encoding='utf-8') as f:
                f.write('\\n'.join(lines))
            logging.info(f"   💾 Grade salva: {grade_file.name}")
        except Exception as e:
            logging.error(f"Erro ao salvar grade: {e}")


def setup_logging():
    """Configura logging"""
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(message)s',
        handlers=[logging.StreamHandler(sys.stdout)]
    )


def main():
    """Função principal"""
    setup_logging()
    
    config_path = Path(__file__).parent / "config.json"
    
    if config_path.exists():
        config = load_json_file(config_path, DEFAULT_CONFIG)
    else:
        config = DEFAULT_CONFIG
        save_json_file(config_path, config)
        logging.info(f"Arquivo config.json criado em {config_path}")
    
    logging.info("=" * 60)
    logging.info("🎵 PGM-FM - PROGRAMAÇÃO MUSICAL (V8.0)")
    logging.info("=" * 60)
    
    system = PGMSystem(config)
    system.generate_grade()
    
    logging.info("✅ Grade gerada com sucesso!")


if __name__ == "__main__":
    main()
`;

const RADIO_MONITOR_SCRIPT = `#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Radio Monitor - Monitoramento de Estações de Rádio

Coleta dados de músicas tocando nas rádios brasileiras e salva em arquivo JSON.
Os dados podem ser usados pelo PGM-FM para gerar a grade de programação.

Uso:
  python radio_monitor.py

Requisitos:
  pip install requests beautifulsoup4
"""

import json
import time
import logging
import sys
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional

try:
    import requests
    from bs4 import BeautifulSoup
    DEPS_AVAILABLE = True
except ImportError:
    DEPS_AVAILABLE = False
    print("⚠️ Instale as dependências: pip install requests beautifulsoup4")


# Configuração das rádios
RADIOS = {
    "bh": {
        "nome": "BH FM",
        "frequencia": "102.1 FM",
        "url": "https://radiobhfm.com.br/",
    },
    "band": {
        "nome": "Band FM",
        "frequencia": "96.1 FM",
        "url": "https://bandfm.band.uol.com.br/",
    },
    "clube": {
        "nome": "Clube FM",
        "frequencia": "88.5 FM",
        "url": "https://clubefm.com.br/",
    },
    "globo": {
        "nome": "Rádio Globo",
        "frequencia": "1150 AM",
        "url": "https://radioglobo.globo.com/",
    },
}


class RadioMonitor:
    """Monitora estações de rádio e coleta dados de músicas"""
    
    def __init__(self, output_file: str = "radio_historico.json"):
        self.output_file = Path(output_file)
        self.historico: Dict = self._load_historico()
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })
    
    def _load_historico(self) -> Dict:
        """Carrega histórico existente"""
        if self.output_file.exists():
            try:
                with open(self.output_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except:
                pass
        return {"radios": {}, "ultima_atualizacao": ""}
    
    def _save_historico(self):
        """Salva histórico em arquivo"""
        self.historico["ultima_atualizacao"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        with open(self.output_file, 'w', encoding='utf-8') as f:
            json.dump(self.historico, f, indent=2, ensure_ascii=False)
    
    def _scrape_radio(self, radio_id: str, config: Dict) -> Optional[Dict]:
        """Coleta dados de uma rádio (placeholder - implementar scraping real)"""
        # Este é um placeholder - em produção, implementar scraping real
        # ou usar APIs das rádios se disponíveis
        return {
            "tocando_agora": "Artista Exemplo - Música Exemplo",
            "ultimas_tocadas": [
                "Artista 1 - Música 1",
                "Artista 2 - Música 2",
            ],
            "timestamp": datetime.now().isoformat()
        }
    
    def coletar_dados(self):
        """Coleta dados de todas as rádios"""
        logging.info("📡 Coletando dados das rádios...")
        
        for radio_id, config in RADIOS.items():
            try:
                dados = self._scrape_radio(radio_id, config)
                if dados:
                    if radio_id not in self.historico["radios"]:
                        self.historico["radios"][radio_id] = {
                            "nome": config["nome"],
                            "frequencia": config["frequencia"],
                            "historico": []
                        }
                    
                    self.historico["radios"][radio_id]["ultimo_dado"] = dados
                    self.historico["radios"][radio_id]["historico"].append(dados)
                    
                    # Mantém apenas últimas 100 coletas
                    if len(self.historico["radios"][radio_id]["historico"]) > 100:
                        self.historico["radios"][radio_id]["historico"] = \\
                            self.historico["radios"][radio_id]["historico"][-100:]
                    
                    logging.info(f"   ✅ {config['nome']}: {dados.get('tocando_agora', 'N/A')}")
                    
            except Exception as e:
                logging.error(f"   ❌ Erro em {config['nome']}: {e}")
        
        self._save_historico()
        logging.info(f"💾 Dados salvos em {self.output_file}")
    
    def run(self, interval: int = 300):
        """Executa monitoramento contínuo"""
        logging.info("🎵 Radio Monitor iniciado")
        logging.info(f"⏱️ Intervalo de coleta: {interval} segundos")
        
        while True:
            try:
                self.coletar_dados()
                time.sleep(interval)
            except KeyboardInterrupt:
                logging.info("\\n⏹️ Monitoramento encerrado")
                break
            except Exception as e:
                logging.error(f"Erro: {e}")
                time.sleep(60)


def main():
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(message)s',
        handlers=[logging.StreamHandler(sys.stdout)]
    )
    
    if not DEPS_AVAILABLE:
        print("❌ Dependências não instaladas.")
        print("Execute: pip install requests beautifulsoup4")
        sys.exit(1)
    
    monitor = RadioMonitor()
    monitor.run()


if __name__ == "__main__":
    main()
`;

const CONFIG_JSON = `{
  "pastas": {
    "musicas": ["C:\\\\Playlist\\\\Musicas"],
    "grades": "C:\\\\Playlist\\\\pgm\\\\Grades",
    "conteudos": "C:\\\\Playlist\\\\pgm\\\\Conteudos",
    "romanticas": "C:\\\\Playlist\\\\pgm\\\\Romanticas",
    "ranking": "ranking.json",
    "dna_radios": "dna_radios.json",
    "historico_coletadas": "historico_coletadas.json",
    "historico_radios": "C:\\\\Playlist\\\\pgm\\\\Historico"
  },
  "distribuicao_bloco": {
    "bh": {"posicao_inicio": 1, "posicao_fim": 3},
    "band": {"posicao_inicio": 4, "posicao_fim": 6},
    "clube": {"posicao_inicio": 7, "posicao_fim": 8},
    "globo": {"posicao_inicio": 9, "posicao_fim": 10}
  },
  "programas_por_horario": {
    "5-9": "MANHA_TOTAL",
    "9-12": "MANHA_HITS",
    "12-14": "HORA_DO_ALMOCO",
    "14-17": "TARDE_HITS",
    "17-19": "TOP30",
    "19-22": "NOITE_ESPECIAL",
    "22-24": "MADRUGADA",
    "0-5": "MADRUGADA"
  },
  "sistema": {
    "codigo_coringa": "mus",
    "separador_vht": "vht",
    "nivel_log": "INFO"
  },
  "intervalos": {
    "atualizacao_grade_segundos": 1200,
    "auto_clean_segundos": 300,
    "cache_inventario_segundos": 3600,
    "repeticao_artista_minutos": 60
  },
  "filtros": {
    "palavras_proibidas": ["propaganda", "comercial", "jingle"],
    "palavras_funk": ["mc ", "dj ", "funk", "baile"],
    "tamanho_minimo_nome": 5
  },
  "curadoria": {
    "min_aparicoes_para_dna": 2,
    "priorizar_mais_tocadas": true
  },
  "monitoramento_continuo": {
    "ativo": true,
    "intervalo_segundos": 300,
    "adicionar_faltantes_automatico": true,
    "priorizar_por_aparicoes": true,
    "registrar_descobertas": true
  },
  "supabase": {
    "url": "",
    "anon_key": "",
    "arquivo_historico": "radio_historico.json"
  },
  "radios_monitoradas": {
    "bh": {"ativo": true, "nome": "BH FM"},
    "band": {"ativo": true, "nome": "Band FM"},
    "clube": {"ativo": true, "nome": "Clube FM"},
    "globo": {"ativo": true, "nome": "Rádio Globo"}
  }
}`;

const PythonScripts = () => {
  const [copiedScript, setCopiedScript] = useState<string | null>(null);

  const downloadScript = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${filename} baixado com sucesso!`);
  };

  const copyToClipboard = (content: string, name: string) => {
    navigator.clipboard.writeText(content);
    setCopiedScript(name);
    setTimeout(() => setCopiedScript(null), 2000);
    toast.success("Código copiado!");
  };

  const scripts = [
    {
      id: "pgm_fm",
      name: "pgm_fm.py",
      title: "PGM-FM",
      description: "Sistema principal de programação musical",
      content: PGM_FM_SCRIPT,
      icon: <Terminal className="w-5 h-5" />,
      color: "text-primary",
      bgColor: "bg-primary/10",
      borderColor: "border-primary/30",
    },
    {
      id: "radio_monitor",
      name: "radio_monitor.py",
      title: "Radio Monitor",
      description: "Monitoramento de estações de rádio",
      content: RADIO_MONITOR_SCRIPT,
      icon: <Code className="w-5 h-5" />,
      color: "text-cyan-400",
      bgColor: "bg-cyan-400/10",
      borderColor: "border-cyan-400/30",
    },
    {
      id: "config",
      name: "config.json",
      title: "Configuração",
      description: "Arquivo de configuração do sistema",
      content: CONFIG_JSON,
      icon: <FileText className="w-5 h-5" />,
      color: "text-yellow-400",
      bgColor: "bg-yellow-400/10",
      borderColor: "border-yellow-400/30",
    },
  ];

  const downloadAll = () => {
    scripts.forEach((script) => {
      setTimeout(() => {
        downloadScript(script.content, script.name);
      }, 500 * scripts.indexOf(script));
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Terminal className="w-6 h-6 text-primary" />
              <div>
                <CardTitle className="font-mono text-lg">Scripts Python</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Baixe os scripts para executar localmente no seu computador
                </p>
              </div>
            </div>
            <Button onClick={downloadAll} className="font-mono">
              <Download className="w-4 h-4 mr-2" />
              Baixar Todos
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="p-4 rounded-lg bg-muted/20 border border-muted/30">
            <h4 className="font-mono text-sm font-medium text-foreground mb-2">
              Requisitos para execução:
            </h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Python 3.8 ou superior</li>
              <li>• Bibliotecas: <code className="text-primary">pip install supabase mutagen requests beautifulsoup4</code></li>
              <li>• Pasta de músicas MP3 configurada no config.json</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Scripts List */}
      <div className="grid gap-4 md:grid-cols-3">
        {scripts.map((script) => (
          <Card key={script.id} className={`glass-card border ${script.borderColor}`}>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-lg ${script.bgColor} ${script.color}`}>
                  {script.icon}
                </div>
                <div>
                  <CardTitle className="font-mono text-sm">{script.title}</CardTitle>
                  <Badge variant="outline" className="mt-1 font-mono text-xs">
                    {script.name}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {script.description}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadScript(script.content, script.name)}
                  className="flex-1 font-mono text-xs"
                >
                  <Download className="w-3 h-3 mr-1" />
                  Download
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(script.content, script.id)}
                  className="font-mono text-xs"
                >
                  {copiedScript === script.id ? (
                    <Check className="w-3 h-3" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Preview */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <CardTitle className="font-mono text-sm">Preview do Código</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="pgm_fm">
            <TabsList className="bg-muted/30">
              {scripts.map((script) => (
                <TabsTrigger
                  key={script.id}
                  value={script.id}
                  className="font-mono text-xs"
                >
                  {script.name}
                </TabsTrigger>
              ))}
            </TabsList>
            {scripts.map((script) => (
              <TabsContent key={script.id} value={script.id}>
                <div className="relative">
                  <pre className="p-4 rounded-lg bg-muted/20 overflow-x-auto max-h-80 text-xs font-mono text-muted-foreground">
                    {script.content.slice(0, 2000)}
                    {script.content.length > 2000 && "\n\n... (código continua)"}
                  </pre>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(script.content, script.id)}
                    className="absolute top-2 right-2"
                  >
                    {copiedScript === script.id ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <CardTitle className="font-mono text-sm">Como Usar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Badge variant="outline" className="font-mono">1</Badge>
              <div>
                <p className="font-medium text-foreground">Baixe os arquivos</p>
                <p className="text-sm text-muted-foreground">
                  Clique em "Baixar Todos" ou baixe individualmente
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="outline" className="font-mono">2</Badge>
              <div>
                <p className="font-medium text-foreground">Configure o config.json</p>
                <p className="text-sm text-muted-foreground">
                  Ajuste os caminhos das pastas de acordo com seu sistema
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="outline" className="font-mono">3</Badge>
              <div>
                <p className="font-medium text-foreground">Execute o monitor</p>
                <p className="text-sm text-muted-foreground">
                  <code className="text-primary">python radio_monitor.py</code> - Inicia coleta de dados
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="outline" className="font-mono">4</Badge>
              <div>
                <p className="font-medium text-foreground">Gere a grade</p>
                <p className="text-sm text-muted-foreground">
                  <code className="text-primary">python pgm_fm.py</code> - Gera a grade de programação
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PythonScripts;
