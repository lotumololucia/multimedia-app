import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Evento, Miembro, Area, Asignacion } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Lightbulb,
  Monitor,
  Radio,
  Camera,
  Video,
  VideoOff,
  CalendarDays,
  Clock,
  Copy,
  Sparkles,
} from "lucide-react";

const areaIcons: Record<string, React.ReactNode> = {
  Luces: <Lightbulb className="w-6 h-6" />,
  Proyección: <Monitor className="w-6 h-6" />,
  Transmisión: <Radio className="w-6 h-6" />,
  Fotos: <Camera className="w-6 h-6" />,
  "Cámara fija": <Video className="w-6 h-6" />,
  "Cámara móvil": <VideoOff className="w-6 h-6" />,
};

export default function Dashboard() {
  const { toast } = useToast();
  const [nextEvent, setNextEvent] = useState<Evento | null>(null);
  const [areas, setAreas] = useState<Area[]>([]);
  const [assignments, setAssignments] = useState<
    (Asignacion & { miembro_nombre?: string; area_nombre?: string })[]
  >([]);
  const [members, setMembers] = useState<Miembro[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      // Fetch all areas
      const { data: areasData } = await supabase
        .from("areas")
        .select("*")
        .order("id");

      // Fetch all events ordered by date
      const { data: eventosData } = await supabase
        .from("eventos")
        .select("*")
        .order("fecha_texto", { ascending: true });

      // Fetch all members
      const { data: miembrosData } = await supabase
        .from("miembros")
        .select("*");

      // Find the next upcoming event (fecha_texto >= today or just the first one)
      const today = new Date().toISOString().split("T")[0];
      const futureEvents = (eventosData || []).filter(
        (e) => e.fecha_texto >= today
      );
      const upcoming = futureEvents.length > 0 ? futureEvents[0] : (eventosData || [])[0] || null;

      setNextEvent(upcoming);
      setAreas(areasData || []);
      setMembers(miembrosData || []);

      // Fetch assignments for the next event
      if (upcoming) {
        const { data: asignData } = await supabase
          .from("asignaciones")
          .select("*")
          .eq("evento_id", upcoming.id);
        setAssignments(asignData || []);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  }

  function getMemberName(memberId: number): string {
    const m = members.find((mem) => mem.id === memberId);
    return m ? m.nombre : "Sin asignar";
  }

  function getAreaName(areaId: number): string {
    const a = areas.find((ar) => ar.id === areaId);
    return a ? a.nombre : "Área";
  }

  function getAssignedMembers(areaName: string): string[] {
    const area = areas.find((a) => a.nombre === areaName);
    if (!area) return [];
    return assignments
      .filter((a) => a.area_id === area.id)
      .map((a) => getMemberName(a.miembro_id));
  }

  function copyToWhatsApp() {
    if (!nextEvent) return;

    const areaOrder = [
      "Luces",
      "Proyección",
      "Transmisión",
      "Fotos",
      "Cámara fija",
      "Cámara móvil",
    ];

    let text = `🎬 *Equipo ${nextEvent.nombre}* - ${nextEvent.fecha_texto}\n⏰ ${nextEvent.hora}\n\n`;

    areaOrder.forEach((areaName) => {
      const assigned = getAssignedMembers(areaName);
      const icon =
        areaName === "Luces"
          ? "💡"
          : areaName === "Proyección"
            ? "🖥️"
            : areaName === "Transmisión"
              ? "📡"
              : areaName === "Fotos"
                ? "📸"
                : areaName === "Cámara fija"
                  ? "🎥"
                  : "📹";
      text += `${icon} *${areaName}:* ${assigned.length > 0 ? assigned.join(", ") : "Sin asignar"}\n`;
    });

    text += `\n🙏 ¡Dios les bendiga! - Multimedia Somos Familia`;

    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "¡Copiado!",
        description: "Lista copiada al portapapeles para WhatsApp",
      });
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <Sparkles className="w-8 h-8 text-[#9eb7d4] animate-spin" />
      </div>
    );
  }

  const areaOrder = [
    "Luces",
    "Proyección",
    "Transmisión",
    "Fotos",
    "Cámara fija",
    "Cámara móvil",
  ];

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-6">
      {/* Title */}
      <div className="text-center pt-4">
        <h1 className="text-xl font-bold text-white leading-tight">
          Multimedia - Somos Familia
        </h1>
        <p className="text-[#9eb7d4] text-sm mt-1">
          La Gracia de Cristo by: Lu
        </p>
      </div>

      {/* Next Event Card */}
      {nextEvent ? (
        <Card className="glass-card rounded-2xl p-5 border-[#9eb7d4]/20">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-xl bg-[#7a0000] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-[#9eb7d4] uppercase tracking-wider font-medium">
                Próximo Evento
              </p>
              <h2 className="text-lg font-bold text-white">
                {nextEvent.nombre}
              </h2>
            </div>
          </div>
          <div className="flex gap-4 text-sm text-[#9eb7d4]">
            <span className="flex items-center gap-1.5">
              <CalendarDays className="w-4 h-4" />
              {nextEvent.fecha_texto}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              {nextEvent.hora}
            </span>
          </div>
        </Card>
      ) : (
        <Card className="glass-card rounded-2xl p-5 border-[#9eb7d4]/20 text-center">
          <p className="text-[#9eb7d4]">No hay eventos programados</p>
        </Card>
      )}

      {/* Area Grid */}
      <div className="grid grid-cols-2 gap-3">
        {areaOrder.map((areaName) => {
          const assigned = getAssignedMembers(areaName);
          return (
            <Card
              key={areaName}
              className="glass-card rounded-2xl p-4 border-[#9eb7d4]/10 hover:border-[#9eb7d4]/30 transition-all"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-[#7a0000]/60 flex items-center justify-center text-[#fcd5ce]">
                  {areaIcons[areaName]}
                </div>
                <h3 className="text-sm font-semibold text-white">{areaName}</h3>
              </div>
              <div className="space-y-1">
                {assigned.length > 0 ? (
                  assigned.map((name, i) => (
                    <p key={i} className="text-xs text-[#9eb7d4]">
                      {name}
                    </p>
                  ))
                ) : (
                  <p className="text-xs text-[#9eb7d4]/50 italic">
                    Sin asignar
                  </p>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* WhatsApp Copy Button */}
      <Button
        onClick={copyToWhatsApp}
        className="w-full bg-[#7a0000] hover:bg-[#9a1a1a] text-white rounded-xl h-12 text-sm font-semibold flex items-center justify-center gap-2"
        disabled={!nextEvent}
      >
        <Copy className="w-4 h-4" />
        Copiar Lista para WhatsApp
      </Button>
    </div>
  );
}