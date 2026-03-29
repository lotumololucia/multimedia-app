import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Miembro, Area, Habilidad, Asignacion, Evento } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import MemberModal from "@/components/MemberModal";
import {
  Search,
  User,
  Sparkles,
  Lightbulb,
  Monitor,
  Radio,
  Camera,
  Video,
  VideoOff,
  CalendarDays,
  Plus,
  Check,
} from "lucide-react";

const areaIconsMap: Record<string, React.ReactNode> = {
  Luces: <Lightbulb className="w-4 h-4" />,
  Proyección: <Monitor className="w-4 h-4" />,
  Transmisión: <Radio className="w-4 h-4" />,
  Fotos: <Camera className="w-4 h-4" />,
  "Cámara fija": <Video className="w-4 h-4" />,
  "Cámara móvil": <VideoOff className="w-4 h-4" />,
};

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

export default function Equipo() {
  const { toast } = useToast();
  const [miembros, setMiembros] = useState<Miembro[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [habilidades, setHabilidades] = useState<Habilidad[]>([]);
  const [asignaciones, setAsignaciones] = useState<Asignacion[]>([]);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterAreaId, setFilterAreaId] = useState<number | null>(null);
  const [selectedMember, setSelectedMember] = useState<Miembro | null>(null);
  const [showModal, setShowModal] = useState(false);

  // ── Estado del dialog de nuevo miembro ─────────────────────
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newNombre, setNewNombre] = useState("");
  // newAreaIds: array de area_id seleccionados para el nuevo miembro.
  // Mismo patrón que eventAssignments en Planificador: toggleArea
  // agrega o quita un id del array.
  const [newAreaIds, setNewAreaIds] = useState<number[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [miembrosRes, areasRes, habilidadesRes, asignacionesRes, eventosRes] =
        await Promise.all([
          supabase.from("miembros").select("*").order("nombre"),
          supabase.from("areas").select("*").order("id"),
          supabase.from("habilidades").select("*"),
          supabase.from("asignaciones").select("*"),
          supabase.from("eventos").select("*"),
        ]);

      setMiembros(miembrosRes.data || []);
      setAreas(areasRes.data || []);
      setHabilidades(habilidadesRes.data || []);
      setAsignaciones(asignacionesRes.data || []);
      setEventos(eventosRes.data || []);
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  }

  function getMemberSkillAreas(memberId: number): string[] {
    return habilidades
      .filter((h) => h.miembro_id === memberId)
      .map((h) => {
        const area = areas.find((a) => a.id === h.area_id);
        return area ? area.nombre : "";
      })
      .filter(Boolean);
  }

  const filteredMembers = miembros.filter((m) => {
    const matchesSearch = m.nombre
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesArea = filterAreaId
      ? habilidades.some(
          (h) => h.miembro_id === m.id && h.area_id === filterAreaId
        )
      : true;
    return matchesSearch && matchesArea;
  });

  const eventosDelArea: { evento: Evento; miembros: Miembro[] }[] =
    filterAreaId
      ? (() => {
          const map = new Map<number, Miembro[]>();
          asignaciones
            .filter((a) => a.area_id === filterAreaId)
            .forEach((a) => {
              const miembro = miembros.find((m) => m.id === a.miembro_id);
              if (!miembro) return;
              const existing = map.get(a.evento_id) ?? [];
              map.set(a.evento_id, [...existing, miembro]);
            });

          return Array.from(map.entries())
            .map(([eventoId, miembrosDelEvento]) => {
              const evento = eventos.find((e) => e.id === eventoId);
              return evento ? { evento, miembros: miembrosDelEvento } : null;
            })
            .filter((x): x is { evento: Evento; miembros: Miembro[] } => x !== null)
            .sort((a, b) =>
              b.evento.fecha_texto.localeCompare(a.evento.fecha_texto)
            );
        })()
      : [];

  function toggleArea(areaId: number) {
    setNewAreaIds((prev) =>
      prev.includes(areaId)
        ? prev.filter((id) => id !== areaId)
        : [...prev, areaId]
    );
  }

  // ─────────────────────────────────────────────────────────────
  // handleCreateMember: inserción en dos pasos.
  //
  // Paso 1: insertar en `miembros` con select("id") para obtener
  //   el id autogenerado por Supabase. Sin este id no podemos
  //   crear las filas de habilidades.
  //
  // Paso 2: insertar una fila en `habilidades` por cada área
  //   seleccionada, usando el id recién obtenido.
  //
  // Si no se seleccionó ningún área, igual se crea el miembro
  // (puede tener habilidades vacías por ahora).
  // ─────────────────────────────────────────────────────────────
  async function handleCreateMember() {
    if (!newNombre.trim()) {
      toast({
        title: "Error",
        description: "El nombre es requerido",
        variant: "destructive",
      });
      return;
    }

    // Paso 1: crear el miembro y obtener su id
    const { data: miembroData, error: miembroError } = await supabase
      .from("miembros")
      .insert({ nombre: newNombre.trim() })
      .select("id")
      .single();

    if (miembroError || !miembroData) {
      toast({
        title: "Error",
        description: miembroError?.message ?? "No se pudo crear el miembro",
        variant: "destructive",
      });
      return;
    }

    // Paso 2: crear las habilidades si hay áreas seleccionadas
    if (newAreaIds.length > 0) {
      const habilidadesNuevas = newAreaIds.map((areaId) => ({
        miembro_id: miembroData.id,
        area_id: areaId,
      }));

      const { error: habilidadesError } = await supabase
        .from("habilidades")
        .insert(habilidadesNuevas);

      if (habilidadesError) {
        toast({
          title: "Error al guardar áreas",
          description: habilidadesError.message,
          variant: "destructive",
        });
        return;
      }
    }

    toast({ title: "¡Miembro agregado!", description: newNombre.trim() });
    setShowCreateDialog(false);
    setNewNombre("");
    setNewAreaIds([]);
    fetchData();
  }

  function openMemberModal(member: Miembro) {
    setSelectedMember(member);
    setShowModal(true);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <Sparkles className="w-8 h-8 text-[#9eb7d4] animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-5">
      {/* Header con botón Nuevo Miembro */}
      <div className="flex items-center justify-between pt-4">
        <div>
          <h1 className="text-xl font-bold text-white">Equipo</h1>
          <p className="text-sm text-[#9eb7d4] mt-0.5">{miembros.length} miembros</p>
        </div>
        <Button
          onClick={() => setShowCreateDialog(true)}
          className="bg-[#7a0000] hover:bg-[#9a1a1a] text-white rounded-xl h-10 px-4 text-sm"
        >
          <Plus className="w-4 h-4 mr-1" />
          Nuevo Miembro
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9eb7d4]" />
        <Input
          placeholder="Buscar por nombre..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-[#001233]/80 border-[#9eb7d4]/30 text-white placeholder:text-[#9eb7d4]/50 rounded-xl"
        />
      </div>

      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilterAreaId(null)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
            filterAreaId === null
              ? "bg-[#7a0000] text-white"
              : "bg-[#9eb7d4]/10 text-[#9eb7d4] hover:bg-[#9eb7d4]/20"
          }`}
        >
          Todos
        </button>
        {areas.map((area) => (
          <button
            key={area.id}
            onClick={() =>
              setFilterAreaId(filterAreaId === area.id ? null : area.id)
            }
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              filterAreaId === area.id
                ? "bg-[#7a0000] text-white"
                : "bg-[#9eb7d4]/10 text-[#9eb7d4] hover:bg-[#9eb7d4]/20"
            }`}
          >
            {areaIconsMap[area.nombre]}
            {area.nombre}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filteredMembers.length === 0 ? (
          <Card className="glass-card rounded-2xl p-6 border-[#9eb7d4]/20 text-center">
            <p className="text-[#9eb7d4]">No se encontraron miembros</p>
          </Card>
        ) : (
          filteredMembers.map((member) => {
            const skills = getMemberSkillAreas(member.id);
            return (
              <Card
                key={member.id}
                className="glass-card rounded-xl p-3 border-[#9eb7d4]/10 hover:border-[#9eb7d4]/30 transition-all cursor-pointer"
                onClick={() => openMemberModal(member)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#7a0000]/60 flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-[#fcd5ce]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">
                      {member.nombre}
                    </p>
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {skills.map((skill) => (
                        <span
                          key={skill}
                          className="text-[10px] bg-[#9eb7d4]/10 text-[#9eb7d4] px-1.5 py-0.5 rounded-md flex items-center gap-0.5"
                        >
                          {areaIconsMap[skill]}
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {filterAreaId !== null && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-[#9eb7d4]" />
            <h2 className="text-sm font-semibold text-[#9eb7d4] uppercase tracking-wider">
              Eventos en esta área
            </h2>
            <span className="text-xs bg-[#9eb7d4]/10 text-[#9eb7d4] px-2 py-0.5 rounded-full">
              {eventosDelArea.length}
            </span>
          </div>

          {eventosDelArea.length === 0 ? (
            <Card className="glass-card rounded-2xl p-5 border-[#9eb7d4]/20 text-center">
              <p className="text-[#9eb7d4] text-sm">
                No hay eventos con asignaciones para esta área
              </p>
            </Card>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-[#9eb7d4]/15">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#9eb7d4]/8 border-b border-[#9eb7d4]/15">
                    <th className="text-left text-xs font-semibold text-[#9eb7d4] uppercase tracking-wider px-4 py-3">
                      Evento
                    </th>
                    <th className="text-left text-xs font-semibold text-[#9eb7d4] uppercase tracking-wider px-4 py-3">
                      Fecha
                    </th>
                    <th className="text-left text-xs font-semibold text-[#9eb7d4] uppercase tracking-wider px-4 py-3">
                      Servidor
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {eventosDelArea.map(({ evento, miembros: miembrosDelEvento }, index) => (
                    <tr
                      key={evento.id}
                      className={`border-b border-[#9eb7d4]/10 transition-colors hover:bg-[#9eb7d4]/5 ${
                        index % 2 === 0 ? "bg-transparent" : "bg-[#9eb7d4]/3"
                      } ${index === eventosDelArea.length - 1 ? "border-b-0" : ""}`}
                    >
                      <td className="px-4 py-3 text-white font-medium">
                        {evento.nombre}
                      </td>
                      <td className="px-4 py-3 text-[#9eb7d4] whitespace-nowrap">
                        {formatearFecha(evento.fecha_texto)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1.5 text-[#fcd5ce]">
                          <User className="w-3 h-3 shrink-0" />
                          {miembrosDelEvento.map((m) => m.nombre).join(", ")}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Dialog: Nuevo Miembro ────────────────────────────────
          Paso 1: nombre (Input de texto simple)
          Paso 2: áreas (checkboxes custom, mismo patrón que
          los botones de miembros en Planificador)

          Al confirmar se llama handleCreateMember() que:
          1. Inserta en `miembros` y obtiene el id generado
          2. Inserta una fila en `habilidades` por cada área
      ──────────────────────────────────────────────────────────── */}
      <Dialog open={showCreateDialog} onOpenChange={(open) => {
        setShowCreateDialog(open);
        if (!open) {
          setNewNombre("");
          setNewAreaIds([]);
        }
      }}>
        <DialogContent className="bg-[#001233] border-[#9eb7d4]/20 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Nuevo Miembro</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 pt-1">
            <div>
              <Label className="text-[#9eb7d4] text-sm">Nombre</Label>
              <Input
                value={newNombre}
                onChange={(e) => setNewNombre(e.target.value)}
                placeholder="Nombre completo"
                className="bg-[#001233]/80 border-[#9eb7d4]/30 text-white mt-1"
              />
            </div>

            <div>
              <Label className="text-[#9eb7d4] text-sm mb-2 block">
                Áreas en las que puede servir
              </Label>
              <div className="flex flex-wrap gap-2">
                {areas.map((area) => {
                  const isSelected = newAreaIds.includes(area.id);
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
                      {areaIconsMap[area.nombre]}
                      {area.nombre}
                    </button>
                  );
                })}
              </div>
              {newAreaIds.length === 0 && (
                <p className="text-xs text-[#9eb7d4]/50 mt-2">
                  Podés agregar áreas más tarde
                </p>
              )}
            </div>

            <Button
              onClick={handleCreateMember}
              className="w-full bg-[#7a0000] hover:bg-[#9a1a1a] text-white rounded-xl"
            >
              Agregar Miembro
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <MemberModal
        open={showModal}
        onOpenChange={setShowModal}
        member={selectedMember}
        areas={areas}
        habilidades={habilidades}
        asignaciones={asignaciones}
        eventos={eventos}
      />
    </div>
  );
}