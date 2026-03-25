import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Evento, Miembro, Area, Habilidad, Asignacion } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  CalendarDays,
  Clock,
  Plus,
  Edit3,
  Sparkles,
  Save,
  Lightbulb,
  Monitor,
  Radio,
  Camera,
  Video,
  VideoOff,
  ChevronRight,
} from "lucide-react";

const areaIcons: Record<string, React.ReactNode> = {
  Luces: <Lightbulb className="w-4 h-4" />,
  Proyección: <Monitor className="w-4 h-4" />,
  Transmisión: <Radio className="w-4 h-4" />,
  Fotos: <Camera className="w-4 h-4" />,
  "Cámara fija": <Video className="w-4 h-4" />,
  "Cámara móvil": <VideoOff className="w-4 h-4" />,
};

export default function Planificador() {
  const { toast } = useToast();
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [miembros, setMiembros] = useState<Miembro[]>([]);
  const [habilidades, setHabilidades] = useState<Habilidad[]>([]);
  const [asignaciones, setAsignaciones] = useState<Asignacion[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedEvento, setSelectedEvento] = useState<Evento | null>(null);

  // Form states
  const [newNombre, setNewNombre] = useState("");
  const [newFecha, setNewFecha] = useState("");
  const [newHora, setNewHora] = useState("");
  const [newTipo, setNewTipo] = useState("Reunión General");

  // Assignment state: area_id -> miembro_id
  const [eventAssignments, setEventAssignments] = useState<
    Record<number, number | null>
  >({});

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [eventosRes, areasRes, miembrosRes, habilidadesRes, asignacionesRes] =
        await Promise.all([
          supabase.from("eventos").select("*").order("fecha_texto", { ascending: true }),
          supabase.from("areas").select("*").order("id"),
          supabase.from("miembros").select("*").order("nombre"),
          supabase.from("habilidades").select("*"),
          supabase.from("asignaciones").select("*"),
        ]);

      setEventos(eventosRes.data || []);
      setAreas(areasRes.data || []);
      setMiembros(miembrosRes.data || []);
      setHabilidades(habilidadesRes.data || []);
      setAsignaciones(asignacionesRes.data || []);
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  }

  function getMembersForArea(areaId: number): Miembro[] {
    const skillMemberIds = habilidades
      .filter((h) => h.area_id === areaId)
      .map((h) => h.miembro_id);
    return miembros.filter((m) => skillMemberIds.includes(m.id));
  }

  function openEditDialog(evento: Evento) {
    setSelectedEvento(evento);
    // Load existing assignments for this event
    const existing: Record<number, number | null> = {};
    areas.forEach((area) => {
      const asign = asignaciones.find(
        (a) => a.evento_id === evento.id && a.area_id === area.id
      );
      existing[area.id] = asign ? asign.miembro_id : null;
    });
    setEventAssignments(existing);
    setShowEditDialog(true);
  }

  async function handleCreateEvent() {
    if (!newNombre || !newFecha) {
      toast({ title: "Error", description: "Nombre y fecha son requeridos", variant: "destructive" });
      return;
    }

    const { error } = await supabase.from("eventos").insert({
      nombre: newNombre,
      fecha_texto: newFecha,
      hora: newHora || "00:00",
      tipo: newTipo,
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "¡Evento creado!", description: newNombre });
    setShowCreateDialog(false);
    setNewNombre("");
    setNewFecha("");
    setNewHora("");
    setNewTipo("Reunión General");
    fetchData();
  }

  async function handleSaveAssignments() {
    if (!selectedEvento) return;

    // Delete existing assignments for this event
    await supabase
      .from("asignaciones")
      .delete()
      .eq("evento_id", selectedEvento.id);

    // Insert new assignments
    const newAssignments = Object.entries(eventAssignments)
      .filter(([, memberId]) => memberId !== null)
      .map(([areaId, memberId]) => ({
        evento_id: selectedEvento.id,
        miembro_id: memberId!,
        area_id: Number(areaId),
      }));

    if (newAssignments.length > 0) {
      const { error } = await supabase
        .from("asignaciones")
        .insert(newAssignments);
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
        return;
      }
    }

    toast({ title: "¡Asignaciones guardadas!", description: selectedEvento.nombre });
    setShowEditDialog(false);
    fetchData();
  }

  const today = new Date().toISOString().split("T")[0];
  const futureEventos = eventos.filter((e) => e.fecha_texto >= today);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <Sparkles className="w-8 h-8 text-[#9eb7d4] animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pt-4">
        <h1 className="text-xl font-bold text-white">Planificador</h1>
        <Button
          onClick={() => setShowCreateDialog(true)}
          className="bg-[#7a0000] hover:bg-[#9a1a1a] text-white rounded-xl h-10 px-4 text-sm"
        >
          <Plus className="w-4 h-4 mr-1" />
          Nuevo Evento
        </Button>
      </div>

      {/* Events List */}
      {futureEventos.length === 0 ? (
        <Card className="glass-card rounded-2xl p-6 border-[#9eb7d4]/20 text-center">
          <p className="text-[#9eb7d4]">No hay eventos futuros programados</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {futureEventos.map((evento) => (
            <Card
              key={evento.id}
              className="glass-card rounded-2xl p-4 border-[#9eb7d4]/10 hover:border-[#9eb7d4]/30 transition-all cursor-pointer"
              onClick={() => openEditDialog(evento)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-white">
                      {evento.nombre}
                    </h3>
                    <span className="text-[10px] bg-[#7a0000]/40 text-[#fcd5ce] px-2 py-0.5 rounded-full">
                      {evento.tipo}
                    </span>
                  </div>
                  <div className="flex gap-3 mt-1 text-xs text-[#9eb7d4]">
                    <span className="flex items-center gap-1">
                      <CalendarDays className="w-3 h-3" />
                      {evento.fecha_texto}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {evento.hora}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-[#9eb7d4]" />
                  <ChevronRight className="w-4 h-4 text-[#9eb7d4]" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Event Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="bg-[#001233] border-[#9eb7d4]/20 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Nuevo Evento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-[#9eb7d4] text-sm">Nombre</Label>
              <Input
                value={newNombre}
                onChange={(e) => setNewNombre(e.target.value)}
                placeholder="Nombre del evento"
                className="bg-[#001233]/80 border-[#9eb7d4]/30 text-white mt-1"
              />
            </div>
            <div>
              <Label className="text-[#9eb7d4] text-sm">Fecha</Label>
              <Input
                type="date"
                value={newFecha}
                onChange={(e) => setNewFecha(e.target.value)}
                className="bg-[#001233]/80 border-[#9eb7d4]/30 text-white mt-1"
              />
            </div>
            <div>
              <Label className="text-[#9eb7d4] text-sm">Hora</Label>
              <Input
                type="time"
                value={newHora}
                onChange={(e) => setNewHora(e.target.value)}
                className="bg-[#001233]/80 border-[#9eb7d4]/30 text-white mt-1"
              />
            </div>
            <div>
              <Label className="text-[#9eb7d4] text-sm">Tipo</Label>
              <Select value={newTipo} onValueChange={setNewTipo}>
                <SelectTrigger className="bg-[#001233]/80 border-[#9eb7d4]/30 text-white mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#001233] border-[#9eb7d4]/30">
                  <SelectItem value="Reunión General" className="text-white hover:bg-[#9eb7d4]/10">
                    Reunión General
                  </SelectItem>
                  <SelectItem value="Extra" className="text-white hover:bg-[#9eb7d4]/10">
                    Extra
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleCreateEvent}
              className="w-full bg-[#7a0000] hover:bg-[#9a1a1a] text-white rounded-xl"
            >
              Crear Evento
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit/Assign Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="bg-[#001233] border-[#9eb7d4]/20 text-white max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">
              {selectedEvento?.nombre}
            </DialogTitle>
          </DialogHeader>
          {selectedEvento && (
            <div className="space-y-4">
              <div className="flex gap-3 text-xs text-[#9eb7d4]">
                <span className="flex items-center gap-1">
                  <CalendarDays className="w-3 h-3" />
                  {selectedEvento.fecha_texto}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {selectedEvento.hora}
                </span>
              </div>

              <p className="text-sm text-[#9eb7d4]">
                Asignar miembros por área:
              </p>

              {areas.map((area) => {
                const eligible = getMembersForArea(area.id);
                return (
                  <div key={area.id}>
                    <Label className="text-[#fcd5ce] text-sm flex items-center gap-2">
                      {areaIcons[area.nombre]}
                      {area.nombre}
                    </Label>
                    <Select
                      value={
                        eventAssignments[area.id]
                          ? String(eventAssignments[area.id])
                          : "none"
                      }
                      onValueChange={(val) =>
                        setEventAssignments((prev) => ({
                          ...prev,
                          [area.id]: val === "none" ? null : Number(val),
                        }))
                      }
                    >
                      <SelectTrigger className="bg-[#001233]/80 border-[#9eb7d4]/30 text-white mt-1">
                        <SelectValue placeholder="Sin asignar" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#001233] border-[#9eb7d4]/30">
                        <SelectItem value="none" className="text-[#9eb7d4] hover:bg-[#9eb7d4]/10">
                          Sin asignar
                        </SelectItem>
                        {eligible.map((m) => (
                          <SelectItem
                            key={m.id}
                            value={String(m.id)}
                            className="text-white hover:bg-[#9eb7d4]/10"
                          >
                            {m.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                );
              })}

              <Button
                onClick={handleSaveAssignments}
                className="w-full bg-[#7a0000] hover:bg-[#9a1a1a] text-white rounded-xl"
              >
                <Save className="w-4 h-4 mr-2" />
                Guardar Asignaciones
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}