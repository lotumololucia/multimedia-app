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
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const areaIcons: Record<string, React.ReactNode> = {
  Luces: <Lightbulb className="w-3 h-3" />,
  Proyección: <Monitor className="w-3 h-3" />,
  Transmisión: <Radio className="w-3 h-3" />,
  Fotos: <Camera className="w-3 h-3" />,
  "Cámara fija": <Video className="w-3 h-3" />,
  "Cámara móvil": <VideoOff className="w-3 h-3" />,
};

interface MemberModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: Miembro | null;
  areas: Area[];
  habilidades: Habilidad[];
  asignaciones: Asignacion[];
  eventos: { id: number; fecha_texto: string; nombre: string }[];
  onMemberUpdated: () => void; // callback para refrescar Equipo
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
}: MemberModalProps) {
  const { toast } = useToast();

  // ── Estado del dialog de edición ───────────────────────────
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editNombre, setEditNombre] = useState("");
  // editAreaIds: áreas actualmente seleccionadas para el miembro.
  // Se inicializa con las habilidades existentes al abrir el dialog.
  const [editAreaIds, setEditAreaIds] = useState<number[]>([]);

  if (!member) return null;

  const memberSkills = habilidades
    .filter((h) => h.miembro_id === member.id)
    .map((h) => {
      const area = areas.find((a) => a.id === h.area_id);
      return area ? area.nombre : "";
    })
    .filter(Boolean);

  const memberAssignments = asignaciones.filter(
    (a) => a.miembro_id === member.id
  );

  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  const oneMonthAgoStr = oneMonthAgo.toISOString().split("T")[0];

  const recentServices = memberAssignments.filter((a) => {
    const evento = eventos.find((e) => e.id === a.evento_id);
    return evento && evento.fecha_texto >= oneMonthAgoStr;
  });

  const currentYear = new Date().getFullYear();
  const serviceDates = new Set<string>();
  memberAssignments.forEach((a) => {
    const evento = eventos.find((e) => e.id === a.evento_id);
    if (evento && evento.fecha_texto.startsWith(String(currentYear))) {
      serviceDates.add(evento.fecha_texto);
    }
  });

  const months = [
    "Ene", "Feb", "Mar", "Abr", "May", "Jun",
    "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
  ];

  function getDaysInMonth(month: number, year: number) {
    return new Date(year, month + 1, 0).getDate();
  }

  // ─────────────────────────────────────────────────────────────
  // openEditDialog: carga el estado de edición con los datos
  // actuales del miembro antes de abrir el dialog.
  // Las áreas actuales se obtienen filtrando habilidades por
  // miembro_id y extrayendo los area_id.
  // ─────────────────────────────────────────────────────────────
  function openEditDialog() {
    setEditNombre(member.nombre);
    const currentAreaIds = habilidades
      .filter((h) => h.miembro_id === member.id)
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

  // ─────────────────────────────────────────────────────────────
  // handleUpdateMember: actualización en dos pasos.
  //
  // Paso 1: actualizar el nombre en `miembros`.
  //
  // Paso 2: sincronizar habilidades.
  //   - Borramos TODAS las habilidades del miembro (delete where miembro_id)
  //   - Insertamos las nuevas según editAreaIds
  //   Este patrón "borrar todo y reinsertar" es el mismo que usamos
  //   para asignaciones en Planificador: simple y sin riesgo de
  //   duplicados o inconsistencias.
  // ─────────────────────────────────────────────────────────────
  async function handleUpdateMember() {
    if (!editNombre.trim()) {
      toast({ title: "Error", description: "El nombre es requerido", variant: "destructive" });
      return;
    }

    // Paso 1: actualizar nombre
    const { error: updateError } = await supabase
      .from("miembros")
      .update({ nombre: editNombre.trim() })
      .eq("id", member.id);

    if (updateError) {
      toast({ title: "Error", description: updateError.message, variant: "destructive" });
      return;
    }

    // Paso 2a: borrar habilidades existentes
    await supabase
      .from("habilidades")
      .delete()
      .eq("miembro_id", member.id);

    // Paso 2b: insertar las nuevas habilidades
    if (editAreaIds.length > 0) {
      const { error: habilidadesError } = await supabase
        .from("habilidades")
        .insert(
          editAreaIds.map((areaId) => ({
            miembro_id: member.id,
            area_id: areaId,
          }))
        );

      if (habilidadesError) {
        toast({ title: "Error al guardar áreas", description: habilidadesError.message, variant: "destructive" });
        return;
      }
    }

    toast({ title: "Miembro actualizado", description: editNombre.trim() });
    setShowEditDialog(false);
    onOpenChange(false); // cerramos el modal principal
    onMemberUpdated();   // le avisamos a Equipo que recargue datos
  }

  // ─────────────────────────────────────────────────────────────
  // handleDeleteMember: elimina el miembro y sus habilidades.
  // Las asignaciones quedan huérfanas en la BD (sin miembro_id
  // válido), pero no rompen nada funcionalmente porque el código
  // usa .find() que devuelve undefined en ese caso.
  // Si querés limpieza total, podés agregar un delete de
  // asignaciones where miembro_id antes de borrar el miembro.
  // ─────────────────────────────────────────────────────────────
  async function handleDeleteMember() {
    const confirmar = confirm(
      `¿Estás segura de eliminar a "${member.nombre}"? Esta acción no se puede deshacer.`
    );
    if (!confirmar) return;

    // Borrar habilidades primero (integridad referencial)
    await supabase.from("habilidades").delete().eq("miembro_id", member.id);
    // Borrar asignaciones del miembro
    await supabase.from("asignaciones").delete().eq("miembro_id", member.id);

    const { error } = await supabase
      .from("miembros")
      .delete()
      .eq("id", member.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Miembro eliminado", variant: "destructive" });
    setShowEditDialog(false);
    onOpenChange(false);
    onMemberUpdated();
  }

  return (
    <>
      {/* ── Modal principal: vista del miembro ───────────────── */}
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
                {/* Botón editar — mismo patrón que en Planificador */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={openEditDialog}
                  className="text-[#9eb7d4] hover:text-white hover:bg-[#9eb7d4]/10 h-8 px-2"
                >
                  <Edit3 className="w-4 h-4 mr-1" />
                  Editar
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
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

            <div className="glass-card rounded-xl p-4 border-[#9eb7d4]/10">
              <p className="text-sm text-[#9eb7d4]">Servicios (último mes)</p>
              <p className="text-3xl font-bold text-white mt-1">
                {recentServices.length}
              </p>
            </div>

            <div>
              <p className="text-sm text-[#9eb7d4] mb-3">
                Mapa de Actividad {currentYear}
              </p>
              <div className="space-y-2">
                {months.map((monthName, monthIndex) => {
                  const daysInMonth = getDaysInMonth(monthIndex, currentYear);
                  return (
                    <div key={monthName} className="flex items-center gap-2">
                      <span className="text-[10px] text-[#9eb7d4] w-8 text-right">
                        {monthName}
                      </span>
                      <div className="flex gap-[2px] flex-wrap">
                        {Array.from({ length: daysInMonth }, (_, dayIndex) => {
                          const day = dayIndex + 1;
                          const dateStr = `${currentYear}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                          const isActive = serviceDates.has(dateStr);
                          return (
                            <Tooltip key={dateStr}>
                              <TooltipTrigger asChild>
                                <div
                                  className={`w-[10px] h-[10px] rounded-sm ${
                                    isActive ? "bg-[#7a0000]" : "bg-[#9eb7d4]/10"
                                  }`}
                                />
                              </TooltipTrigger>
                              <TooltipContent className="bg-[#001233] border-[#9eb7d4]/30 text-white text-xs">
                                {dateStr}
                                {isActive ? " ✓ Sirvió" : ""}
                              </TooltipContent>
                            </Tooltip>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Dialog de edición ────────────────────────────────── */}
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