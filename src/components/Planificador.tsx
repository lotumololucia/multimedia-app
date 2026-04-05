import CalendarioTab from "@/components/CalendarioTab";
import { Calendar } from "lucide-react";
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
import { toast as sonnerToast } from "sonner";
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
  ArrowUp,
  ArrowDown,
  History,
  CalendarClock,
  Check,
  Copy,
  Volume2,
} from "lucide-react";

type SubTab = "proximos" | "pasados" | "calendario";
type SortOrder = "asc" | "desc";

function formatearFecha(fechaISO: string): string {
  if (!fechaISO) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(fechaISO)) {
    const fecha = new Date(fechaISO + "T00:00:00");
    const dia = fecha.toLocaleDateString("es-AR", { weekday: "long" });
    const diaCapital = dia.charAt(0).toUpperCase() + dia.slice(1);
    const dd = String(fecha.getDate()).padStart(2, "0");
    const mm = String(fecha.getMonth() + 1).padStart(2, "0");
    return `${diaCapital} ${dd}/${mm}`;
  }
  return fechaISO.charAt(0).toUpperCase() + fechaISO.slice(1);
}

function formatearFechaInput(fechaISO: string): string {
  if (!fechaISO) return "";
  const [yyyy, mm, dd] = fechaISO.split("-");
  return `${dd}/${mm}/${yyyy}`;
}

const areaIcons: Record<string, React.ReactNode> = {
  Luces: <Lightbulb className="w-4 h-4" />,
  Proyección: <Monitor className="w-4 h-4" />,
  Transmisión: <Radio className="w-4 h-4" />,
  Fotos: <Camera className="w-4 h-4" />,
  "Cámara fija": <Video className="w-4 h-4" />,
  "Cámara móvil": <VideoOff className="w-4 h-4" />,
  Sonido: <Volume2 className="w-4 h-4" />,
};

const areaOrder = [
  "Luces",
  "Proyección",
  "Transmisión",
  "Fotos",
  "Cámara fija",
  "Cámara móvil",
  "Sonido",
];

export default function Planificador({ isAdmin = false }: { isAdmin?: boolean }) {
  const { toast } = useToast();
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [miembros, setMiembros] = useState<Miembro[]>([]);
  const [habilidades, setHabilidades] = useState<Habilidad[]>([]);
  const [asignaciones, setAsignaciones] = useState<Asignacion[]>([]);
  const [loading, setLoading] = useState(true);

  const [subTab, setSubTab] = useState<SubTab>("calendario");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedEvento, setSelectedEvento] = useState<Evento | null>(null);

  const [newNombre, setNewNombre] = useState("");
  const [newFecha, setNewFecha] = useState("");
  const [newHora, setNewHora] = useState("");
  const [newTipo, setNewTipo] = useState("Reunión General");

  const [showEditEventDetails, setShowEditEventDetails] = useState(false);
  const [editNombre, setEditNombre] = useState("");
  const [editFecha, setEditFecha] = useState("");
  const [editHora, setEditHora] = useState("");
  const [editTipo, setEditTipo] = useState("");

  const [eventAssignments, setEventAssignments] = useState<Record<number, number[]>>({});

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [eventosRes, areasRes, miembrosRes, habilidadesRes, asignacionesRes] =
        await Promise.all([
          supabase.from("eventos").select("*"),
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
    const existing: Record<number, number[]> = {};
    areas.forEach((area) => {
      const asignsDelArea = asignaciones.filter(
        (a) => a.evento_id === evento.id && a.area_id === area.id
      );
      existing[area.id] = asignsDelArea.map((a) => a.miembro_id);
    });
    setEventAssignments(existing);
    setShowEditDialog(true);
  }

  function openEditDetails(evento: Evento) {
    setSelectedEvento(evento);
    setEditNombre(evento.nombre);
    setEditFecha(evento.fecha_texto);
    setEditHora(evento.hora);
    setEditTipo(evento.tipo);
    setShowEditDialog(false);
    setShowEditEventDetails(true);
  }

  async function handleUpdateEvent() {
    if (!selectedEvento) return;
    const { error } = await supabase
      .from("eventos")
      .update({
        nombre: editNombre,
        fecha_texto: editFecha,
        hora: editHora,
        tipo: editTipo,
      })
      .eq("id", selectedEvento.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Evento actualizado" });
    setShowEditEventDetails(false);
    fetchData();
  }

  async function handleDeleteEvent() {
    if (!selectedEvento) return;
    const confirmar = confirm(
      `¿Estás segura de eliminar "${selectedEvento.nombre}"? Esto borrará también todas sus asignaciones.`
    );
    if (confirmar) {
      const { error } = await supabase
        .from("eventos")
        .delete()
        .eq("id", selectedEvento.id);
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
        return;
      }
      toast({ title: "Evento eliminado", variant: "destructive" });
      setShowEditEventDetails(false);
      fetchData();
    }
  }

  function toggleMember(areaId: number, miembroId: number) {
    setEventAssignments((prev) => {
      const current = prev[areaId] ?? [];
      const yaEsta = current.includes(miembroId);
      return {
        ...prev,
        [areaId]: yaEsta
          ? current.filter((id) => id !== miembroId)
          : [...current, miembroId],
      };
    });
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

    await supabase
      .from("asignaciones")
      .delete()
      .eq("evento_id", selectedEvento.id);

    const newAssignments = Object.entries(eventAssignments).flatMap(
      ([areaId, memberIds]) =>
        memberIds.map((miembroId) => ({
          evento_id: selectedEvento.id,
          miembro_id: miembroId,
          area_id: Number(areaId),
        }))
    );

    if (newAssignments.length > 0) {
      const { error } = await supabase.from("asignaciones").insert(newAssignments);
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
        return;
      }
    }

    toast({ title: "¡Asignaciones guardadas!", description: selectedEvento.nombre });
    setShowEditDialog(false);
    fetchData();
  }

  function copyEventoToClipboard(evento: Evento, e: React.MouseEvent) {
    e.stopPropagation();

    const date = new Date(evento.fecha_texto + "T00:00:00");
    const formattedDate = new Intl.DateTimeFormat("es-AR", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
    }).format(date);
    const capitalizedDate =
      formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

    let text = `${capitalizedDate}\n`;

    areaOrder.forEach((areaName) => {
      const area = areas.find((a) => a.nombre === areaName);
      if (!area) return;
      const asignacionesDelArea = asignaciones.filter(
        (a) => a.evento_id === evento.id && a.area_id === area.id
      );
      const nombres = asignacionesDelArea
        .map((a) => {
          const miembro = miembros.find((m) => m.id === a.miembro_id);
          return miembro ? miembro.nombre : null;
        })
        .filter(Boolean) as string[];

      const name = nombres.length > 0 ? nombres.join(", ") : "Sin asignar";
      text += `- ${areaName}: ${name}\n`;
    });

    navigator.clipboard.writeText(text).then(() => {
      sonnerToast.success("¡Copiado!", { position: "bottom-center" });
    });
  }

  const now = new Date();
  const boundaryTime = new Date(now.getTime() - 60 * 60 * 1000);
  const offset = boundaryTime.getTimezoneOffset();
  const localBoundary = new Date(boundaryTime.getTime() - offset * 60 * 1000);
  const boundaryStr = localBoundary.toISOString().slice(0, 16);

// ─────────────────────────────────────────────────────────────
// sortKey: combina fecha + hora en un string comparable.
// Normalizamos hora quitando " hs" si existe, para que tanto
// "11:00 hs" como "11:00" produzcan el mismo resultado.
// El formato final "YYYY-MM-DDTHH:MM" es comparable
// lexicográficamente igual que cronológicamente.
// ─────────────────────────────────────────────────────────────
function sortKey(e: Evento): string {
  const horaNorm = (e.hora ?? "00:00").replace(" hs", "").trim();
  const parts = horaNorm.split(":");
  const hh = parts[0]?.padStart(2, "0") || "00";
  const mm = parts[1]?.padStart(2, "0") || "00";
  return `${e.fecha_texto}T${hh}:${mm}`;
}

const proximos = eventos
  .filter((e) => sortKey(e) >= boundaryStr)
  .sort((a, b) =>
    sortOrder === "asc"
      ? sortKey(a).localeCompare(sortKey(b))
      : sortKey(b).localeCompare(sortKey(a))
  );

const pasados = eventos
  .filter((e) => sortKey(e) < boundaryStr)
  .sort((a, b) =>
    sortOrder === "asc"
      ? sortKey(a).localeCompare(sortKey(b))
      : sortKey(b).localeCompare(sortKey(a))
  );

  const eventosVisibles = subTab === "proximos" ? proximos : pasados;

  function handleSubTabChange(tab: SubTab) {
    setSubTab(tab);
    setSortOrder("asc");
  }

  const sortLabels = {
    proximos: { asc: "Más próximo primero", desc: "Más lejano primero" },
    pasados: { asc: "Más antiguo primero", desc: "Más reciente primero" },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <Sparkles className="w-8 h-8 text-[#9eb7d4] animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between pt-4">
        <h1 className="text-xl font-bold text-white">Planificador</h1>
        {isAdmin && (
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="bg-[#7a0000] hover:bg-[#9a1a1a] text-white rounded-xl h-10 px-4 text-sm"
          >
            <Plus className="w-4 h-4 mr-1" />
            Nuevo Evento
          </Button>
        )}
      </div>

<div className="flex gap-2">
  <div className="bg-[#001233]/60 p-1 rounded-xl border border-[#9eb7d4]/15">
    <button
      onClick={() => handleSubTabChange("calendario")}
      className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium transition-all duration-200 h-full ${
        subTab === "calendario"
          ? "bg-[#7a0000]/80 text-white shadow"
          : "text-[#9eb7d4] hover:text-white"
      }`}
    >
      <Calendar className="w-3.5 h-3.5" />
      Calendario
    </button>
  </div>
  <div className="flex flex-1 bg-[#001233]/60 p-1 rounded-xl border border-[#9eb7d4]/15">
    <button
      onClick={() => handleSubTabChange("proximos")}
      className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-medium transition-all duration-200 ${
        subTab === "proximos"
          ? "bg-[#7a0000]/80 text-white shadow"
          : "text-[#9eb7d4] hover:text-white"
      }`}
    >
      <CalendarClock className="w-3.5 h-3.5" />
      Eventos próximos
      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${subTab === "proximos" ? "bg-white/20" : "bg-[#9eb7d4]/20"}`}>
        {proximos.length}
      </span>
    </button>
    <button
      onClick={() => handleSubTabChange("pasados")}
      className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-medium transition-all duration-200 ${
        subTab === "pasados"
          ? "bg-[#7a0000]/80 text-white shadow"
          : "text-[#9eb7d4] hover:text-white"
      }`}
    >
      <History className="w-3.5 h-3.5" />
      Eventos pasados
      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${subTab === "pasados" ? "bg-white/20" : "bg-[#9eb7d4]/20"}`}>
        {pasados.length}
      </span>
    </button>
  </div>
  </div>

      {subTab !== "calendario" && eventosVisibles.length > 1 && (
        <div className="flex gap-2">
          <button
            onClick={() => setSortOrder("asc")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs transition-all duration-200 border ${
              sortOrder === "asc"
                ? "bg-[#9eb7d4]/15 border-[#9eb7d4]/50 text-white"
                : "border-[#9eb7d4]/15 text-[#9eb7d4] hover:text-white hover:border-[#9eb7d4]/30"
            }`}
          >
            <ArrowUp className="w-3 h-3" />
            {sortLabels[subTab].asc}
          </button>
          <button
            onClick={() => setSortOrder("desc")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs transition-all duration-200 border ${
              sortOrder === "desc"
                ? "bg-[#9eb7d4]/15 border-[#9eb7d4]/50 text-white"
                : "border-[#9eb7d4]/15 text-[#9eb7d4] hover:text-white hover:border-[#9eb7d4]/30"
            }`}
          >
            <ArrowDown className="w-3 h-3" />
            {sortLabels[subTab].desc}
          </button>
        </div>
      )}

{subTab !== "calendario" && (
        eventosVisibles.length === 0 ? (
          <Card className="glass-card rounded-2xl p-6 border-[#9eb7d4]/20 text-center">
            <p className="text-[#9eb7d4]">
              {subTab === "proximos"
                ? "No hay eventos futuros programados"
                : "No hay eventos pasados registrados"}
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {eventosVisibles.map((evento) => (
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
                        {formatearFecha(evento.fecha_texto)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {evento.hora}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {isAdmin && <Edit3 className="w-4 h-4 text-[#9eb7d4]" />}
                    <ChevronRight className="w-4 h-4 text-[#9eb7d4]" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )
      )}

      {subTab === "calendario" && (
        <CalendarioTab
          eventos={eventos}
          asignaciones={asignaciones}
          miembros={miembros}
          areas={areas}
        />
      )}

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
              {newFecha && (
                <p className="text-xs text-[#9eb7d4]/70 mt-1 flex items-center gap-1">
                  <CalendarDays className="w-3 h-3" />
                  Se mostrará como:{" "}
                  <span className="text-[#9eb7d4]">{formatearFecha(newFecha)}</span>
                </p>
              )}
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

      {/* Dialog de asignaciones — el botón Copiar vive aquí adentro */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="bg-[#001233] border-[#9eb7d4]/20 text-white max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader className="flex flex-row items-center justify-between border-b border-[#9eb7d4]/10 pb-4 mb-4">
            <div className="flex flex-col">
              <DialogTitle className="text-white text-left">
                {selectedEvento?.nombre}
              </DialogTitle>
              <p className="text-[10px] text-[#9eb7d4] text-left uppercase tracking-wider">
                Asignaciones
              </p>
            </div>
            {isAdmin && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  selectedEvento && openEditDetails(selectedEvento);
                }}
                className="text-[#9eb7d4] hover:text-white hover:bg-[#9eb7d4]/10 h-8 px-2"
              >
                <Edit3 className="w-4 h-4 mr-2" />
                Editar Datos
              </Button>
            )}
          </DialogHeader>
          {selectedEvento && (
            <div className="space-y-4">
              {/* Fecha/hora + botón copiar en la misma fila */}
              <div className="flex items-center justify-between">
                <div className="flex gap-3 text-xs text-[#9eb7d4]">
                  <span className="flex items-center gap-1">
                    <CalendarDays className="w-3 h-3" />
                    {formatearFecha(selectedEvento.fecha_texto)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {selectedEvento.hora}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={(e) => copyEventoToClipboard(selectedEvento, e)}
                  className="flex items-center gap-1.5 text-xs text-[#9eb7d4] hover:text-white transition-colors px-2 py-1 rounded-lg border border-[#9eb7d4]/20 hover:border-[#9eb7d4]/50"
                >
                  <Copy className="w-3 h-3" />
                  Copiar lista
                </button>
              </div>

              <p className="text-sm text-[#9eb7d4]">Asignar miembros por área:</p>

              {areas.map((area) => {
                const eligible = getMembersForArea(area.id);
                const selected = eventAssignments[area.id] ?? [];
                return (
                  <div key={area.id} className="space-y-2">
                    <Label className="text-[#fcd5ce] text-sm flex items-center gap-2">
                      {areaIcons[area.nombre]}
                      {area.nombre}
                      {selected.length > 0 && (
                        <span className="text-[10px] bg-[#7a0000]/50 text-[#fcd5ce] px-1.5 py-0.5 rounded-full">
                          {selected.length}
                        </span>
                      )}
                    </Label>
                    {eligible.length === 0 ? (
                      <p className="text-xs text-[#9eb7d4]/50 pl-1">
                        Sin miembros habilitados
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {eligible.map((m) => {
                          const isSelected = selected.includes(m.id);
                          return (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => isAdmin && toggleMember(area.id, m.id)}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                                isSelected
                                  ? "bg-[#7a0000]/70 border-[#7a0000] text-white"
                                  : "bg-[#9eb7d4]/5 border-[#9eb7d4]/20 text-[#9eb7d4] hover:border-[#9eb7d4]/50 hover:text-white"
                              } ${!isAdmin && "opacity-80 pointer-events-none"}`}
                            >
                              {isSelected && <Check className="w-3 h-3" />}
                              {m.nombre}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}

              {isAdmin && (
                <Button
                  onClick={handleSaveAssignments}
                  className="w-full bg-[#7a0000] hover:bg-[#9a1a1a] text-white rounded-xl"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Guardar Asignaciones
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showEditEventDetails} onOpenChange={setShowEditEventDetails}>
        <DialogContent className="bg-[#001233] border-[#9eb7d4]/20 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Editar Detalles del Evento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label className="text-[#9eb7d4] text-sm">Nombre</Label>
              <Input
                value={editNombre}
                onChange={(e) => setEditNombre(e.target.value)}
                className="bg-[#001233]/80 border-[#9eb7d4]/30 text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-[#9eb7d4] text-sm">Fecha</Label>
                <Input
                  type="date"
                  value={editFecha}
                  onChange={(e) => setEditFecha(e.target.value)}
                  className="bg-[#001233]/80 border-[#9eb7d4]/30 text-white"
                />
              </div>
              <div>
                <Label className="text-[#9eb7d4] text-sm">Hora</Label>
                <Input
                  type="time"
                  value={editHora}
                  onChange={(e) => setEditHora(e.target.value)}
                  className="bg-[#001233]/80 border-[#9eb7d4]/30 text-white"
                />
              </div>
            </div>
            <div>
              <Label className="text-[#9eb7d4] text-sm">Tipo</Label>
              <Select value={editTipo} onValueChange={setEditTipo}>
                <SelectTrigger className="bg-[#001233]/80 border-[#9eb7d4]/30 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#001233] border-[#9eb7d4]/30">
                  <SelectItem value="Reunión General">Reunión General</SelectItem>
                  <SelectItem value="Extra">Extra</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-3 pt-4">
              <Button
                variant="destructive"
                onClick={handleDeleteEvent}
                className="flex-1 bg-red-900/40 hover:bg-red-900 text-white border border-red-500/50"
              >
                Eliminar
              </Button>
              <Button
                onClick={handleUpdateEvent}
                className="flex-[2] bg-[#7a0000] hover:bg-[#9a1a1a] text-white"
              >
                Guardar Cambios
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}