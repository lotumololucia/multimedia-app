import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Miembro, Area, Habilidad, Asignacion, Evento } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
} from "lucide-react";

const areaIconsMap: Record<string, React.ReactNode> = {
  Luces: <Lightbulb className="w-4 h-4" />,
  Proyección: <Monitor className="w-4 h-4" />,
  Transmisión: <Radio className="w-4 h-4" />,
  Fotos: <Camera className="w-4 h-4" />,
  "Cámara fija": <Video className="w-4 h-4" />,
  "Cámara móvil": <VideoOff className="w-4 h-4" />,
};

export default function Equipo() {
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

  // Filter members
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
      {/* Header */}
      <div className="pt-4">
        <h1 className="text-xl font-bold text-white">Equipo</h1>
        <p className="text-sm text-[#9eb7d4] mt-1">
          {miembros.length} miembros
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9eb7d4]" />
        <Input
          placeholder="Buscar por nombre..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-[#001233]/80 border-[#9eb7d4]/30 text-white placeholder:text-[#9eb7d4]/50 rounded-xl"
        />
      </div>

      {/* Area Filter Icons */}
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

      {/* Members List */}
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

      {/* Member Modal */}
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