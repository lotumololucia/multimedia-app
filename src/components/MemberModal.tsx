import type { Miembro, Area, Asignacion } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Lightbulb,
  Monitor,
  Radio,
  Camera,
  Video,
  VideoOff,
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
  habilidades: { miembro_id: number; area_id: number }[];
  asignaciones: Asignacion[];
  eventos: { id: number; fecha_texto: string; nombre: string }[];
}

export default function MemberModal({
  open,
  onOpenChange,
  member,
  areas,
  habilidades,
  asignaciones,
  eventos,
}: MemberModalProps) {
  if (!member) return null;

  // Get member's skills
  const memberSkills = habilidades
    .filter((h) => h.miembro_id === member.id)
    .map((h) => {
      const area = areas.find((a) => a.id === h.area_id);
      return area ? area.nombre : "";
    })
    .filter(Boolean);

  // Get member's assignments
  const memberAssignments = asignaciones.filter(
    (a) => a.miembro_id === member.id
  );

  // Services in the last month
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  const oneMonthAgoStr = oneMonthAgo.toISOString().split("T")[0];

  const recentServices = memberAssignments.filter((a) => {
    const evento = eventos.find((e) => e.id === a.evento_id);
    return evento && evento.fecha_texto >= oneMonthAgoStr;
  });

  // Activity map: get all dates this member served in the current year
  const currentYear = new Date().getFullYear();
  const serviceDates = new Set<string>();
  memberAssignments.forEach((a) => {
    const evento = eventos.find((e) => e.id === a.evento_id);
    if (evento && evento.fecha_texto.startsWith(String(currentYear))) {
      serviceDates.add(evento.fecha_texto);
    }
  });

  // Generate calendar grid for the year (simplified: 12 months x ~31 days)
  const months = [
    "Ene", "Feb", "Mar", "Abr", "May", "Jun",
    "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
  ];

  function getDaysInMonth(month: number, year: number) {
    return new Date(year, month + 1, 0).getDate();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#001233] border-[#9eb7d4]/20 text-white max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#7a0000] flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-lg">{member.nombre}</p>
              <p className="text-xs text-[#9eb7d4] font-normal">
                ID: {member.id}
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Skills */}
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

          {/* Services Count */}
          <div className="glass-card rounded-xl p-4 border-[#9eb7d4]/10">
            <p className="text-sm text-[#9eb7d4]">Servicios (último mes)</p>
            <p className="text-3xl font-bold text-white mt-1">
              {recentServices.length}
            </p>
          </div>

          {/* Activity Map */}
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
                                  isActive
                                    ? "bg-[#7a0000]"
                                    : "bg-[#9eb7d4]/10"
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
  );
}