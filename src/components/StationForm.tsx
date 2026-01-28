import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Radio, Globe, MapPin, Music } from "lucide-react";

// Schema de validação para emissoras
const stationFormSchema = z.object({
  name: z
    .string()
    .min(2, "Nome deve ter pelo menos 2 caracteres")
    .max(100, "Nome deve ter no máximo 100 caracteres")
    .regex(/^[a-zA-ZÀ-ÿ0-9\s.-]+$/, "Nome contém caracteres inválidos"),
  frequency: z
    .string()
    .regex(
      /^\d{2,3}[.,]\d{1,2}\s?(FM|AM|MHz)?$/i,
      "Frequência inválida (ex: 102.5 FM, 98.3)"
    ),
  genre: z
    .string()
    .min(1, "Selecione um gênero musical"),
  city: z
    .string()
    .min(2, "Cidade deve ter pelo menos 2 caracteres")
    .max(50, "Cidade deve ter no máximo 50 caracteres"),
  state: z
    .string()
    .length(2, "Estado deve ter 2 caracteres (UF)")
    .regex(/^[A-Z]{2}$/i, "Use a sigla do estado (ex: SP, RJ, MG)"),
  streamUrl: z
    .string()
    .url("URL de streaming inválida")
    .optional()
    .or(z.literal("")),
  key: z
    .string()
    .min(2, "Chave deve ter pelo menos 2 caracteres")
    .max(20, "Chave deve ter no máximo 20 caracteres")
    .regex(/^[a-z0-9_]+$/, "Use apenas letras minúsculas, números e _"),
});

export type StationFormData = z.infer<typeof stationFormSchema>;

const GENRES = [
  "Pop/Hits",
  "Rock",
  "Sertanejo",
  "Pagode/Samba",
  "MPB",
  "Gospel",
  "Eletrônica",
  "Hip-Hop/Rap",
  "Clássica",
  "Jazz",
  "Country",
  "Forró",
  "Funk",
  "Notícias/Talk",
  "Esportes",
  "Eclética",
];

const ESTADOS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO",
];

interface StationFormProps {
  defaultValues?: Partial<StationFormData>;
  onSubmit: (data: StationFormData) => void;
  onCancel: () => void;
  isEditing?: boolean;
}

const StationForm = ({
  defaultValues,
  onSubmit,
  onCancel,
  isEditing = false,
}: StationFormProps) => {
  const form = useForm<StationFormData>({
    resolver: zodResolver(stationFormSchema),
    defaultValues: {
      name: "",
      frequency: "",
      genre: "",
      city: "",
      state: "",
      streamUrl: "",
      key: "",
      ...defaultValues,
    },
  });

  const handleSubmit = (data: StationFormData) => {
    // Normaliza a frequência
    const normalizedData = {
      ...data,
      frequency: data.frequency.toUpperCase().includes("FM") || data.frequency.toUpperCase().includes("AM")
        ? data.frequency
        : `${data.frequency} FM`,
      state: data.state.toUpperCase(),
      key: data.key.toLowerCase(),
    };
    onSubmit(normalizedData);
  };

  // Gera sugestão de chave baseada no nome
  const generateKey = (name: string) => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "_")
      .replace(/_+/g, "_")
      .slice(0, 15);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Nome da Emissora */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-primary" />
                  Nome da Emissora
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ex: Rádio Cidade FM"
                    {...field}
                    onChange={(e) => {
                      field.onChange(e);
                      if (!isEditing && !form.getValues("key")) {
                        form.setValue("key", generateKey(e.target.value));
                      }
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Chave do Sistema */}
          <FormField
            control={form.control}
            name="key"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Chave do Sistema</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ex: cidade_fm"
                    {...field}
                    disabled={isEditing}
                    className={isEditing ? "opacity-50" : ""}
                  />
                </FormControl>
                <FormDescription className="text-xs">
                  Identificador único (sem acentos, minúsculas)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Frequência */}
          <FormField
            control={form.control}
            name="frequency"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <Music className="w-4 h-4 text-accent" />
                  Frequência
                </FormLabel>
                <FormControl>
                  <Input placeholder="Ex: 102.5 FM" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Gênero Musical */}
          <FormField
            control={form.control}
            name="genre"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Gênero Musical</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Selecione o gênero" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-background border border-muted z-50">
                    {GENRES.map((genre) => (
                      <SelectItem key={genre} value={genre}>
                        {genre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Cidade */}
          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-secondary" />
                  Cidade
                </FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Belo Horizonte" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Estado */}
          <FormField
            control={form.control}
            name="state"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estado (UF)</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value?.toUpperCase()}
                >
                  <FormControl>
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="UF" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-background border border-muted z-50 max-h-48">
                    {ESTADOS.map((uf) => (
                      <SelectItem key={uf} value={uf}>
                        {uf}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* URL de Streaming */}
        <FormField
          control={form.control}
          name="streamUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-cyan-400" />
                URL de Streaming (opcional)
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="https://stream.radio.com/live.mp3"
                  {...field}
                />
              </FormControl>
              <FormDescription className="text-xs">
                Link direto para o stream de áudio
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Botões */}
        <div className="flex justify-end gap-3 pt-4 border-t border-muted/30">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" className="bg-primary hover:bg-primary/90">
            {isEditing ? "Salvar Alterações" : "Adicionar Emissora"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default StationForm;
