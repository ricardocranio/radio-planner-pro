import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit2, Trash2, Radio, Settings2, MapPin, Folder } from "lucide-react";
import StationForm, { type StationFormData } from "./StationForm";
import { FolderConfig } from "./FolderConfig";
import type { Station } from "@/types/radio";

interface StationManagerProps {
  stations: Station[];
  onStationsChange: (stations: Station[]) => void;
}

const StationManager = ({ stations, onStationsChange }: StationManagerProps) => {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);

  // Cores por chave de rádio
  const radioColors: Record<string, string> = {
    bh: "border-l-cyan-400",
    band: "border-l-purple-400",
    clube: "border-l-green-400",
    globo: "border-l-yellow-400",
  };

  const getStationColor = (key: string) => {
    return radioColors[key] || "border-l-primary";
  };

  // Converte dados do formulário para Station
  const formDataToStation = (data: StationFormData, existingStation?: Station): Station => {
    const now = new Date().toISOString();
    return {
      id: existingStation?.id || `station_${data.key}_${Date.now()}`,
      key: data.key,
      name: data.name,
      genre: data.genre,
      frequency: data.frequency,
      url: data.streamUrl || "",
      city: data.city,
      state: data.state.toUpperCase(),
      nowPlaying: existingStation?.nowPlaying || {
        title: "Aguardando...",
        artist: "Sem dados",
        timeAgo: "agora",
        dna: "",
      },
      recentTracks: existingStation?.recentTracks || [],
      historico: existingStation?.historico || [],
      lastUpdate: now,
    };
  };

  // Converte Station para dados do formulário
  const stationToFormData = (station: Station): Partial<StationFormData> => {
    return {
      name: station.name,
      key: station.key,
      frequency: station.frequency,
      genre: station.genre,
      city: station.city || "",
      state: station.state || "",
      streamUrl: station.url,
    };
  };

  // Adicionar nova emissora
  const handleAddStation = (data: StationFormData) => {
    // Verifica se a chave já existe
    if (stations.some((s) => s.key === data.key)) {
      toast({
        variant: "destructive",
        title: "Erro ao adicionar",
        description: `Já existe uma emissora com a chave "${data.key}"`,
      });
      return;
    }

    const newStation = formDataToStation(data);
    const updatedStations = [...stations, newStation];
    onStationsChange(updatedStations);

    toast({
      title: "Emissora adicionada",
      description: `${data.name} foi adicionada ao sistema.`,
    });
    setIsAddDialogOpen(false);
  };

  // Editar emissora existente
  const handleEditStation = (data: StationFormData) => {
    if (!selectedStation) return;

    const updatedStation = formDataToStation(data, selectedStation);
    const updatedStations = stations.map((s) =>
      s.id === selectedStation.id ? updatedStation : s
    );
    onStationsChange(updatedStations);

    toast({
      title: "Emissora atualizada",
      description: `${data.name} foi atualizada com sucesso.`,
    });
    setIsEditDialogOpen(false);
    setSelectedStation(null);
  };

  // Remover emissora
  const handleDeleteStation = () => {
    if (!selectedStation) return;

    const updatedStations = stations.filter((s) => s.id !== selectedStation.id);
    onStationsChange(updatedStations);

    toast({
      title: "Emissora removida",
      description: `${selectedStation.name} foi removida do sistema.`,
    });
    setIsDeleteDialogOpen(false);
    setSelectedStation(null);
  };

  const openEditDialog = (station: Station) => {
    setSelectedStation(station);
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (station: Station) => {
    setSelectedStation(station);
    setIsDeleteDialogOpen(true);
  };

  return (
    <div className="space-y-8">
      {/* Configuração de Pastas */}
      <Card className="bg-card/50 border-muted">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Folder className="w-5 h-5 text-primary" />
            Configurações do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FolderConfig />
        </CardContent>
      </Card>

      {/* Header Emissoras */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Settings2 className="w-6 h-6 text-primary" />
            Gerenciar Emissoras
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Adicione, edite ou remova emissoras do sistema de monitoramento
          </p>
        </div>
        <Button
          onClick={() => setIsAddDialogOpen(true)}
          className="bg-primary hover:bg-primary/90"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Emissora
        </Button>
      </div>

      {/* Lista de Emissoras */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {stations.map((station) => (
          <Card
            key={station.id}
            className={`border-l-4 ${getStationColor(station.key)} bg-card/50 hover:bg-card/80 transition-colors`}
          >
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Radio className="w-5 h-5 text-primary" />
                  <CardTitle className="text-lg">{station.name}</CardTitle>
                </div>
                <span className="text-xs font-mono px-2 py-1 rounded bg-muted/50 text-muted-foreground">
                  {station.key.toUpperCase()}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Frequência:</span>
                  <p className="font-mono text-accent">{station.frequency}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Gênero:</span>
                  <p className="text-foreground">{station.genre}</p>
                </div>
              </div>

              {(station.city || station.state) && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="w-3 h-3" />
                  {station.city && <span>{station.city}</span>}
                  {station.city && station.state && <span>-</span>}
                  {station.state && <span>{station.state}</span>}
                </div>
              )}

              <div className="flex items-center gap-2 pt-2 border-t border-muted/30">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEditDialog(station)}
                  className="flex-1"
                >
                  <Edit2 className="w-3 h-3 mr-1" />
                  Editar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openDeleteDialog(station)}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Card para adicionar nova emissora */}
        <Card
          className="border-dashed border-2 border-muted/50 bg-transparent hover:bg-muted/10 cursor-pointer transition-colors"
          onClick={() => setIsAddDialogOpen(true)}
        >
          <CardContent className="flex flex-col items-center justify-center h-full min-h-[180px] text-muted-foreground">
            <Plus className="w-10 h-10 mb-2" />
            <span className="font-medium">Adicionar Emissora</span>
          </CardContent>
        </Card>
      </div>

      {/* Dialog de Adicionar */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl bg-background border border-muted">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" />
              Nova Emissora
            </DialogTitle>
            <DialogDescription>
              Preencha os dados da nova emissora para adicionar ao sistema de monitoramento.
            </DialogDescription>
          </DialogHeader>
          <StationForm
            onSubmit={handleAddStation}
            onCancel={() => setIsAddDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog de Editar */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl bg-background border border-muted">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit2 className="w-5 h-5 text-accent" />
              Editar Emissora
            </DialogTitle>
            <DialogDescription>
              Atualize as informações da emissora {selectedStation?.name}.
            </DialogDescription>
          </DialogHeader>
          {selectedStation && (
            <StationForm
              defaultValues={stationToFormData(selectedStation)}
              onSubmit={handleEditStation}
              onCancel={() => {
                setIsEditDialogOpen(false);
                setSelectedStation(null);
              }}
              isEditing
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmar Exclusão */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md bg-background border border-muted">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="w-5 h-5" />
              Confirmar Exclusão
            </DialogTitle>
            <DialogDescription>
              Tem certeza que deseja remover a emissora{" "}
              <strong>{selectedStation?.name}</strong>? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setSelectedStation(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteStation}
            >
              Sim, Remover
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StationManager;
