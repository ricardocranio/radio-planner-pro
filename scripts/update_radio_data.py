#!/usr/bin/env python3
"""
PGM-FM Radio Data Updater
Script para atualizar os dados das rádios no projeto clone.

Uso:
    python scripts/update_radio_data.py

Dependências:
    pip install requests beautifulsoup4 selenium webdriver-manager

O script vai:
1. Ler as rádios configuradas em src/data/radioData.json
2. Buscar dados atualizados de cada rádio no MyTuner
3. Atualizar o arquivo JSON com os novos dados
"""

import json
import os
import re
import unicodedata
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict, Any, List

try:
    from selenium import webdriver
    from selenium.webdriver.chrome.service import Service
    from selenium.webdriver.chrome.options import Options
    from selenium.webdriver.common.by import By
    from selenium.webdriver.support.ui import WebDriverWait
    from selenium.webdriver.support import expected_conditions as EC
    from webdriver_manager.chrome import ChromeDriverManager
    SELENIUM_AVAILABLE = True
except ImportError:
    SELENIUM_AVAILABLE = False
    print("⚠️  Selenium não instalado. Execute: pip install selenium webdriver-manager")


# Caminho base do projeto
PROJECT_ROOT = Path(__file__).parent.parent
DATA_FILE = PROJECT_ROOT / "src" / "data" / "radioData.json"


def get_dna(title: str, artist: str) -> str:
    """
    Gera DNA (impressão digital) normalizada de uma música.
    Replica a lógica do Python original.
    """
    def normalize(text: str) -> str:
        if not text:
            return ""
        # Remove acentos
        text = unicodedata.normalize('NFD', text)
        text = ''.join(c for c in text if unicodedata.category(c) != 'Mn')
        # Lowercase e remove caracteres especiais
        text = text.lower()
        text = re.sub(r'[^a-z0-9\s]', '', text)
        # Remove espaços extras
        text = re.sub(r'\s+', ' ', text).strip()
        return text
    
    return f"{normalize(title)}|{normalize(artist)}"


def parse_track_info(raw_text: str) -> Dict[str, str]:
    """
    Parseia texto bruto da rádio em título, artista e tempo.
    Formato esperado: "Título\n\nArtista\nTempo ago"
    """
    if not raw_text:
        return {"title": "Unknown", "artist": "Unknown", "timeAgo": ""}
    
    parts = raw_text.strip().split('\n')
    parts = [p.strip() for p in parts if p.strip()]
    
    title = parts[0] if len(parts) > 0 else "Unknown"
    artist = parts[1] if len(parts) > 1 else "Unknown"
    time_ago = parts[2] if len(parts) > 2 else "LIVE"
    
    return {
        "title": title,
        "artist": artist,
        "timeAgo": time_ago,
        "dna": get_dna(title, artist)
    }


class RadioScraper:
    """Scraper para buscar dados das rádios no MyTuner."""
    
    def __init__(self):
        self.driver = None
        
    def init_driver(self):
        """Inicializa o driver do Selenium."""
        if not SELENIUM_AVAILABLE:
            raise RuntimeError("Selenium não disponível")
            
        options = Options()
        options.add_argument("--headless")
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        options.add_argument("--disable-gpu")
        options.add_argument("--window-size=1920,1080")
        options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
        
        service = Service(ChromeDriverManager().install())
        self.driver = webdriver.Chrome(service=service, options=options)
        
    def close(self):
        """Fecha o driver."""
        if self.driver:
            self.driver.quit()
            self.driver = None
            
    def scrape_radio(self, url: str, nome: str) -> Optional[Dict[str, Any]]:
        """
        Busca dados de uma rádio específica.
        Retorna None se falhar.
        """
        if not self.driver:
            self.init_driver()
            
        try:
            print(f"  📻 Buscando: {nome}...")
            self.driver.get(url)
            
            # Aguarda carregamento
            WebDriverWait(self.driver, 15).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, ".now-playing, .track-info, .song-info"))
            )
            
            # Tenta diferentes seletores para "tocando agora"
            tocando_agora = None
            selectors_now = [
                ".now-playing .track-name",
                ".now-playing-info",
                ".track-info",
                ".song-title",
                "[data-testid='now-playing']"
            ]
            
            for selector in selectors_now:
                try:
                    elem = self.driver.find_element(By.CSS_SELECTOR, selector)
                    if elem.text.strip():
                        tocando_agora = elem.text.strip()
                        break
                except:
                    continue
                    
            # Tenta buscar últimas tocadas
            ultimas_tocadas = []
            selectors_recent = [
                ".recent-tracks .track",
                ".playlist-item",
                ".track-list .track",
                ".history-item"
            ]
            
            for selector in selectors_recent:
                try:
                    elements = self.driver.find_elements(By.CSS_SELECTOR, selector)
                    for elem in elements[:5]:  # Máximo 5 últimas
                        text = elem.text.strip()
                        if text and text != tocando_agora:
                            ultimas_tocadas.append(text)
                    if ultimas_tocadas:
                        break
                except:
                    continue
            
            if not tocando_agora:
                print(f"    ⚠️  Não foi possível extrair dados de {nome}")
                return None
                
            timestamp = datetime.now().isoformat()
            
            return {
                "url": url,
                "nome": nome,
                "tocando_agora": tocando_agora,
                "ultimas_tocadas": ultimas_tocadas,
                "timestamp": timestamp,
                "erro": None
            }
            
        except Exception as e:
            print(f"    ❌ Erro ao buscar {nome}: {e}")
            return {
                "url": url,
                "nome": nome,
                "tocando_agora": "",
                "ultimas_tocadas": [],
                "timestamp": datetime.now().isoformat(),
                "erro": str(e)
            }


def load_radio_data() -> Dict[str, Any]:
    """Carrega dados existentes do arquivo JSON."""
    if DATA_FILE.exists():
        with open(DATA_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {"radios": {}, "ultima_atualizacao": ""}


def save_radio_data(data: Dict[str, Any]):
    """Salva dados atualizados no arquivo JSON."""
    # Atualiza timestamp
    data["ultima_atualizacao"] = datetime.now().strftime("%d/%m/%Y %H:%M:%S")
    
    with open(DATA_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"\n✅ Dados salvos em: {DATA_FILE}")


def update_radio_history(radio_data: Dict, new_data: Dict):
    """Atualiza histórico de uma rádio com novos dados."""
    if not new_data.get("tocando_agora"):
        return
        
    # Verifica se é uma música nova
    historico = radio_data.get("historico_completo", [])
    nova_musica = new_data["tocando_agora"]
    
    # Não duplica se a última entrada for igual
    if historico and historico[-1].get("musica") == nova_musica:
        return
        
    # Adiciona ao histórico
    historico.append({
        "musica": nova_musica,
        "timestamp": new_data["timestamp"]
    })
    
    # Mantém apenas últimas 100 entradas por rádio
    radio_data["historico_completo"] = historico[-100:]
    radio_data["ultimo_dado"] = new_data


def main():
    """Função principal de atualização."""
    print("=" * 60)
    print("🎵 PGM-FM Radio Data Updater")
    print("=" * 60)
    
    if not SELENIUM_AVAILABLE:
        print("\n❌ Instale as dependências primeiro:")
        print("   pip install selenium webdriver-manager")
        return
    
    # Carrega dados existentes
    data = load_radio_data()
    radios = data.get("radios", {})
    
    if not radios:
        print("\n⚠️  Nenhuma rádio configurada em radioData.json")
        return
        
    print(f"\n📻 {len(radios)} rádio(s) encontrada(s)")
    
    # Inicializa scraper
    scraper = RadioScraper()
    
    try:
        scraper.init_driver()
        
        for radio_id, radio_info in radios.items():
            url = radio_info.get("url")
            nome = radio_info.get("nome", radio_id)
            
            if not url:
                print(f"  ⚠️  {nome}: URL não configurada")
                continue
                
            # Busca novos dados
            new_data = scraper.scrape_radio(url, nome)
            
            if new_data and not new_data.get("erro"):
                update_radio_history(radio_info, new_data)
                print(f"    ✅ {nome}: {parse_track_info(new_data['tocando_agora'])['title']}")
            elif new_data and new_data.get("erro"):
                radio_info["ultimo_dado"] = new_data
                
    finally:
        scraper.close()
    
    # Salva dados atualizados
    save_radio_data(data)
    
    print("\n" + "=" * 60)
    print("🎉 Atualização concluída!")
    print("=" * 60)


if __name__ == "__main__":
    main()
