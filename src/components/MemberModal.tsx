import { useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Miembro, Area, Asignacion, Habilidad } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  User,
  Lightbulb,
  Monitor,
  Radio,
  Camera,
  Video,
  VideoOff,
  Edit3,
  Check,
  Volume2,
} from "lucide-react";

const areaIcons: Record<string, React.ReactNode> = {
  Luces: <Lightbulb className="w-3 h-3" />,
  Proyección: <Monitor className="w-3 h-3" />,
  Transmisión: <Radio className="w-3 h-3" />,
  Fotos: <Camera className="w-3 h-3" />,
  "Cámara fija": <Video className="w-3 h-3" />,
  "Cámara móvil": <VideoOff className="w-3 h-3" />,
  Sonido: <Volume2 className="w-3 h-3" />,
};

const monthNames: Record<string, string> = {
  "01": "Enero",
  "02": "Febrero",
  "03": "Marzo",
  "04": "Abril",
  "05": "Mayo",
  "06": "Junio",
  "07": "Julio",
  "08": "Agosto",
  "09": "Septiembre",
  "10": "Octubre",
  "11": "Noviembre",
  "12": "Diciembre",
};

function formatDateShort(fechaISO: string): string {
  if (!fechaISO) return "";
  const fecha = new Date(fechaISO + "T00:00:00");
  const dia = fecha.toLocaleDateString("es-AR", { weekday: "short" });
  // Capitalizar y quitar punto si viene (ej: "sáb." → "Sáb")
  const diaCapital =
    dia.charAt(0).toUpperCase() + dia.slice(1).replace(".", "");
  const dd = String(fecha.getDate()).padStart(2, "0");
  return `${diaCapital} ${dd}`;
}

interface MemberModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: Miembro | null;
  areas: Area[];
  habilidades: Habilidad[];
  asignaciones: Asignacion[];
  eventos: { id: number; fecha_texto: string; nombre: string }[];
  onMemberUpdated: () => void;
  isAdmin?: boolean;
}

export default function MemberModal({
  open,
  onOpenChange,
  member,
  areas,
  habilidades,
  asignaciones,
  eventos,
  onMemberUpdated,
  isAdmin = false,
}: MemberModalProps) {
  const { toast } = useToast();

  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editNombre, setEditNombre] = useState("");
  const [editAreaIds, setEditAreaIds] = useState<number[]>([]);

  if (!member) return null;

  // ── Habilidades ────────────────────────────────────────────
  const memberSkills = habilidades
    .filter((h) => h.miembro_id === member.id)
    .map((h) => {
      const area = areas.find((a) => a.id === h.area_id);
      return area ? area.nombre : "";
    })
    .filter(Boolean);

  // ── Eventos en los que el miembro fue asignado ─────────────
  const memberAssignments = asignaciones.filter(
    (a) => a.miembro_id === member.id
  );
  const servedEventIds = new Set<number>(
    memberAssignments.map((a) => a.evento_id)
  );

  // ── Servicios en 2026 (eventos únicos) ────────────────────
  const currentYear = new Date().getFullYear();
  const servicesThisYear = new Set<number>();
  memberAssignments.forEach((a) => {
    const evento = eventos.find((e) => e.id === a.evento_id);
    if (evento && evento.fecha_texto.startsWith(String(currentYear))) {
      servicesThisYear.add(a.evento_id);
    }
  });

  // ── Agrupar todos los eventos por mes ─────────────────────
  // Ordenamos eventos por fecha ascendente
  const sortedEventos = [...eventos].sort((a, b) =>
    a.fecha_texto.localeCompare(b.fecha_texto)
  );

  // Map: "YYYY-MM" → eventos[]
  const eventosByMonth = sortedEventos.reduce(
    (acc, evento) => {
      const [year, month] = evento.fecha_texto.split("-");
      const key = `${year}-${month}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(evento);
      return acc;
    },
    {} as Record<string, typeof eventos>
  );

  // Meses ordenados (solo los que tienen eventos)
  const sortedMonthKeys = Object.keys(eventosByMonth).sort();

  // ── Handlers de edición ───────────────────────────────────
  function openEditDialog() {
    setEditNombre(member!.nombre);
    const currentAreaIds = habilidades
      .filter((h) => h.miembro_id === member!.id)
      .map((h) => h.area_id);
    setEditAreaIds(currentAreaIds);
    setShowEditDialog(true);
  }

  function toggleArea(areaId: number) {
    setEditAreaIds((prev) =>
      prev.includes(areaId)
        ? prev.filter((id) => id !== areaId)
        : [...prev, areaId]
    );
  }

  async function handleUpdateMember() {
    if (!editNombre.trim()) {
      toast({
        title: "Error",
        description: "El nombre es requerido",
        variant: "destructive",
      });
      return;
    }

    const { error: updateError } = await supabase
      .from("miembros")
      .update({ nombre: editNombre.trim() })
      .eq("id", member!.id);

    if (updateError) {
      toast({
        title: "Error",
        description: updateError.message,
        variant: "destructive",
      });
      return;
    }

    // Borrar y reinsertar habilidades
    await supabase
      .from("habilidades")
      .delete()
      .eq("miembro_id", member!.id);

    if (editAreaIds.length > 0) {
      const { error: habilidadesError } = await supabase
        .from("habilidades")
        .insert(
          editAreaIds.map((areaId) => ({
            miembro_id: member!.id,
            area_id: areaId,
          }))
        );

      if (habilidadesError) {
        toast({
          title: "Error al guardar áreas",
          description: habilidadesError.message,
          variant: "destructive",
        });
        return;
      }
    }

    toast({ title: "Miembro actualizado", description: editNombre.trim() });
    setShowEditDialog(false);
    onOpenChange(false);
    onMemberUpdated();
  }

  async function handleDeleteMember() {
    const confirmar = confirm(
      `¿Estás segura de eliminar a "${member!.nombre}"? Esta acción no se puede deshacer.`
    );
    if (!confirmar) return;

    await supabase
      .from("habilidades")
      .delete()
      .eq("miembro_id", member!.id);
    await supabase
      .from("asignaciones")
      .delete()
      .eq("miembro_id", member!.id);

    const { error } = await supabase
      .from("miembros")
      .delete()
      .eq("id", member!.id);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({ title: "Miembro eliminado", variant: "destructive" });
    setShowEditDialog(false);
    onOpenChange(false);
    onMemberUpdated();
  }

  return (
    <>
      {/* ── Modal principal ───────────────────────────────── */}
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="bg-[#001233] border-[#9eb7d4]/20 text-white max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#7a0000] flex items-center justify-center">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-lg">{member.nombre}</p>
                    <p className="text-xs text-[#9eb7d4] font-normal">
                      ID: {member.id}
                    </p>
                  </div>
                </div>
                {isAdmin && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={openEditDialog}
                    className="text-[#9eb7d4] hover:text-white hover:bg-[#9eb7d4]/10 h-8 px-2"
                  >
                    <Edit3 className="w-4 h-4 mr-1" />
                    Editar
                  </Button>
                )}
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            {/* Habilidades */}
            <div>
              <p className="text-sm text-[#9eb7d4] mb-2">Habilidades</p>
              <div className="flex flex-wrap gap-2">
                {memberSkills.length > 0 ? (
                  memberSkills.map((skill) => (
                    <Badge
                      key={skill}
                      className="bg-[#7a0000]/40 text-[#fcd5ce] border-[#7a0000]/60 flex items-center gap-1"
                    >
                      {areaIcons[skill]}
                      {skill}
                    </Badge>
                  ))
                ) : (
                  <p className="text-xs text-[#9eb7d4]/50 italic">
                    Sin habilidades registradas
                  </p>
                )}
              </div>
            </div>

            {/* Servicios en el año actual */}
            <div className="glass-card rounded-xl p-4 border-[#9eb7d4]/10">
              <p className="text-sm text-[#9eb7d4]">
                Servicios en {currentYear}
              </p>
              <p className="text-3xl font-bold text-white mt-1">
                {servicesThisYear.size}
              </p>
            </div>

            {/* Lista de actividad por mes */}
            <div>
              <p className="text-sm text-[#9eb7d4] mb-3">
                Actividad {currentYear}
              </p>

              {sortedMonthKeys.length === 0 ? (
                <p className="text-xs text-[#9eb7d4]/50 italic">
                  No hay eventos registrados
                </p>
              ) : (
                <div className="space-y-4">
                  {sortedMonthKeys.map((monthKey) => {
                    const [, month] = monthKey.split("-");
                    const monthLabel = monthNames[month] ?? monthKey;
                    const monthEventos = eventosByMonth[monthKey];

                    return (
                      <div key={monthKey}>
                        {/* Encabezado de mes */}
                        <p className="text-xs font-semibold text-[#9eb7d4] uppercase tracking-wider mb-2">
                          {monthLabel}
                        </p>

                        {/* Lista de eventos del mes */}
                        <div className="space-y-1 pl-1">
                          {monthEventos.map((evento) => {
                            const served = servedEventIds.has(evento.id);
                            return (
                              <div
                                key={evento.id}
                                className="flex items-center gap-2"
                              >
                                {served ? (
                                  /* Check rojo si sirvió */
                                  <div className="w-4 h-4 rounded-full bg-[#7a0000] flex items-center justify-center flex-shrink-0">
                                    <Check className="w-2.5 h-2.5 text-white" />
                                  </div>
                                ) : (
                                  /* Círculo vacío si no sirvió */
                                  <div className="w-4 h-4 rounded-full border border-[#9eb7d4]/25 flex-shrink-0" />
                                )}
                                <span
                                  className={`text-xs ${
                                    served
                                      ? "text-white font-medium"
                                      : "text-[#9eb7d4]/50"
                                  }`}
                                >
                                  {formatDateShort(evento.fecha_texto)}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Dialog de edición ─────────────────────────────── */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="bg-[#001233] border-[#9eb7d4]/20 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Editar Miembro</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 pt-1">
            <div>
              <Label className="text-[#9eb7d4] text-sm">Nombre</Label>
              <Input
                value={editNombre}
                onChange={(e) => setEditNombre(e.target.value)}
                className="bg-[#001233]/80 border-[#9eb7d4]/30 text-white mt-1"
              />
            </div>

            <div>
              <Label className="text-[#9eb7d4] text-sm mb-2 block">
                Áreas en las que puede servir
              </Label>
              <div className="flex flex-wrap gap-2">
                {areas.map((area) => {
                  const isSelected = editAreaIds.includes(area.id);
                  return (
                    <button
                      key={area.id}
                      type="button"
                      onClick={() => toggleArea(area.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                        isSelected
                          ? "bg-[#7a0000]/70 border-[#7a0000] text-white"
                          : "bg-[#9eb7d4]/5 border-[#9eb7d4]/20 text-[#9eb7d4] hover:border-[#9eb7d4]/50 hover:text-white"
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3" />}
                      {areaIcons[area.nombre]}
                      {area.nombre}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="destructive"
                onClick={handleDeleteMember}
                className="flex-1 bg-red-900/40 hover:bg-red-900 text-white border border-red-500/50"
              >
                Eliminar
              </Button>
              <Button
                onClick={handleUpdateMember}
                className="flex-[2] bg-[#7a0000] hover:bg-[#9a1a1a] text-white rounded-xl"
              >
                Guardar Cambios
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}