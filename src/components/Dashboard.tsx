import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Evento, Miembro, Area, Asignacion } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
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
  CalendarClock,
  BarChart3,
  Check,
  Volume2,
} from "lucide-react";

type SubTab = "proximo" | "comparar";

const areaIcons: Record<string, React.ReactNode> = {
  Luces: <Lightbulb className="w-5 h-5" />,
  Proyección: <Monitor className="w-5 h-5" />,
  Transmisión: <Radio className="w-5 h-5" />,
  Fotos: <Camera className="w-5 h-5" />,
  "Cámara fija": <Video className="w-5 h-5" />,
  "Cámara móvil": <VideoOff className="w-5 h-5" />,
  Sonido: <Volume2 className="w-5 h-5" />,
};

const areaIconsLg: Record<string, React.ReactNode> = {
  Luces: <Lightbulb className="w-6 h-6" />,
  Proyección: <Monitor className="w-6 h-6" />,
  Transmisión: <Radio className="w-6 h-6" />,
  Fotos: <Camera className="w-6 h-6" />,
  "Cámara fija": <Video className="w-6 h-6" />,
  "Cámara móvil": <VideoOff className="w-6 h-6" />,
  Sonido: <Volume2 className="w-6 h-6" />,
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

function formatearFechaCorta(fechaISO: string): string {
  if (!fechaISO) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(fechaISO)) {
    const fecha = new Date(fechaISO + "T00:00:00");
    const dia = fecha.toLocaleDateString("es-AR", { weekday: "short" });
    const diaCapital = dia.charAt(0).toUpperCase() + dia.slice(1).replace(".", "");
    const dd = String(fecha.getDate()).padStart(2, "0");
    const mm = String(fecha.getMonth() + 1).padStart(2, "0");
    return `${diaCapital} ${dd}/${mm}`;
  }
  return fechaISO.charAt(0).toUpperCase() + fechaISO.slice(1);
}

export default function Dashboard() {
  const [nextEvent, setNextEvent] = useState<Evento | null>(null);
  const [areas, setAreas] = useState<Area[]>([]);
  const [assignments, setAssignments] = useState<Asignacion[]>([]);
  const [members, setMembers] = useState<Miembro[]>([]);
  const [allEventos, setAllEventos] = useState<Evento[]>([]);
  const [allAsignaciones, setAllAsignaciones] = useState<Asignacion[]>([]);
  const [loading, setLoading] = useState(true);

  const [subTab, setSubTab] = useState<SubTab>("proximo");
  const [selectedEventIds, setSelectedEventIds] = useState<number[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [areasRes, eventosRes, miembrosRes, asignacionesRes] =
        await Promise.all([
          supabase.from("areas").select("*").order("id"),
          // Traemos todos ordenados por fecha desc (más nuevo primero)
          supabase.from("eventos").select("*").order("fecha_texto", { ascending: false }),
          supabase.from("miembros").select("*"),
          supabase.from("asignaciones").select("*"),
        ]);

      const areasData = areasRes.data || [];
      const eventosData = eventosRes.data || [];
      const miembrosData = miembrosRes.data || [];
      const asignacionesData = asignacionesRes.data || [];

      // Próximo evento: el más cercano futuro (o el primero si no hay futuros)
      const now = new Date();
      const boundaryTime = new Date(now.getTime() - 60 * 60 * 1000); // 1 hora atrás
      const offset = boundaryTime.getTimezoneOffset();
      const localBoundary = new Date(boundaryTime.getTime() - offset * 60 * 1000);
      const boundaryStr = localBoundary.toISOString().slice(0, 16); // "YYYY-MM-DDTHH:mm"

      const getSortKey = (e: Evento) => {
        const horaNorm = (e.hora ?? "00:00").replace(" hs", "").trim();
        const parts = horaNorm.split(":");
        const hh = parts[0]?.padStart(2, "0") || "00";
        const mm = parts[1]?.padStart(2, "0") || "00";
        return `${e.fecha_texto}T${hh}:${mm}`;
      };

      const futureEvents = [...eventosData]
        .filter((e) => getSortKey(e) >= boundaryStr)
        .sort((a, b) => getSortKey(a).localeCompare(getSortKey(b)));
      const upcoming =
        futureEvents.length > 0
          ? futureEvents[0]
          : eventosData.length > 0
          ? eventosData[0]
          : null;

      setNextEvent(upcoming);
      setAreas(areasData);
      setMembers(miembrosData);
      setAllEventos(eventosData); // ya ordenados desc (más nuevo primero)
      setAllAsignaciones(asignacionesData);

      // Asignaciones sólo del próximo evento (para la sub-tab Próximo)
      if (upcoming) {
        setAssignments(
          asignacionesData.filter((a) => a.evento_id === upcoming.id)
        );
      }
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  }

  // ── Helpers sub-tab Próximo ─────────────────────────────────

  function getMemberName(memberId: number): string {
    const m = members.find((mem) => mem.id === memberId);
    return m ? m.nombre : "Sin asignar";
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

    const date = new Date(nextEvent.fecha_texto + "T00:00:00");
    const formattedDate = new Intl.DateTimeFormat("es-AR", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
    }).format(date);
    const capitalizedDate =
      formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

    let text = `${capitalizedDate}\n`;
    areaOrder.forEach((areaName) => {
      const assigned = getAssignedMembers(areaName);
      const name = assigned.length > 0 ? assigned.join(", ") : "Sin asignar";
      text += `- ${areaName}: ${name}\n`;
    });

    navigator.clipboard.writeText(text).then(() => {
      toast.success("¡Copiado!", { position: "bottom-center" });
    });
  }

  // ── Helpers sub-tab Comparar ────────────────────────────────

  // Los últimos 5 eventos (más nuevo primero, ya viene así de Supabase)
  const last5Events = allEventos.slice(0, 5);

  function toggleEventSelection(eventoId: number) {
    setSelectedEventIds((prev) => {
      if (prev.includes(eventoId)) {
        return prev.filter((id) => id !== eventoId);
      }
      if (prev.length >= 4) return prev; // máximo 4
      return [...prev, eventoId];
    });
  }

  // Eventos seleccionados ordenados por fecha+hora ascendente (para columnas)
  const selectedEventos = allEventos
    .filter((e) => selectedEventIds.includes(e.id))
    .sort((a, b) => {
      const da = a.fecha_texto + "T" + (a.hora || "00:00");
      const db = b.fecha_texto + "T" + (b.hora || "00:00");
      return da.localeCompare(db);
    });

  function getCellContent(areaName: string, eventoId: number): string {
    const area = areas.find((a) => a.nombre === areaName);
    if (!area) return "–";
    const asigns = allAsignaciones.filter(
      (a) => a.evento_id === eventoId && a.area_id === area.id
    );
    if (asigns.length === 0) return "–";
    return asigns
      .map((a) => getMemberName(a.miembro_id))
      .join(", ");
  }

  // ── Render ──────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <Sparkles className="w-8 h-8 text-[#9eb7d4] animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-6">
      {/* Título */}
<div className="flex items-center justify-center gap-4 pt-4">
  <div className="text-center">
    <h1 className="text-xl font-bold text-white tracking-widest">
      MULTIMEDIA
    </h1>
  </div>
  <img
    src="/MULTIMEDIA.png"
    alt="Logo Somos Familia"
    className="w-24 h-24 object-contain"
  />
</div>

      {/* Sub-tabs */}
      <div className="flex gap-2 bg-[#001233]/60 p-1 rounded-xl border border-[#9eb7d4]/15">
        <button
          onClick={() => setSubTab("proximo")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200 ${
            subTab === "proximo"
              ? "bg-[#7a0000]/80 text-white shadow"
              : "text-[#9eb7d4] hover:text-white"
          }`}
        >
          <CalendarClock className="w-4 h-4" />
          Próximo Evento
        </button>
        <button
          onClick={() => setSubTab("comparar")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200 ${
            subTab === "comparar"
              ? "bg-[#7a0000]/80 text-white shadow"
              : "text-[#9eb7d4] hover:text-white"
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Comparar Eventos
        </button>
      </div>

      {/* ── Sub-tab: Próximo Evento ── */}
      {subTab === "proximo" && (
        <>
          {/* Tarjeta próximo evento */}
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
                  {formatearFecha(nextEvent.fecha_texto)}
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

          {/* Grilla de áreas */}
          <div className="grid grid-cols-2 gap-3">
            {areaOrder.map((areaName) => {
              const assigned = getAssignedMembers(areaName);
              return (
<Card
  key={areaName}
  className={`rounded-2xl p-4 border border-[#9eb7d4]/25 hover:border-[#9eb7d4]/50 transition-all ${
    areaName === "Sonido" ? "col-span-2" : ""
  }`}
  style={{ backgroundColor: "rgba(0, 28, 71, 0.85)" }}
>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-[#7a0000]/60 flex items-center justify-center text-[#fcd5ce]">
                      {areaIconsLg[areaName]}
                    </div>
                    <h3 className="text-sm font-semibold text-white">
                      {areaName}
                    </h3>
                  </div>
                  <div className="space-y-1">
                    {assigned.length > 0 ? (
                      areaName === "Sonido" ? (
                        <p className="text-sm text-[#9eb7d4] font-medium">
                          {assigned.join(" - ")}
                        </p>
                      ) : (
                        assigned.map((name, i) => (
                        <p key={i} className="text-sm text-[#9eb7d4] font-medium">
                          {name}
                        </p>  
                        ))
                      )
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

          {/* Botón copiar WhatsApp */}
          <Button
            onClick={copyToWhatsApp}
            className="w-full bg-[#7a0000] hover:bg-[#9a1a1a] text-white rounded-xl h-12 text-sm font-semibold flex items-center justify-center gap-2"
            disabled={!nextEvent}
          >
            <Copy className="w-4 h-4" />
            Copiar Lista para WhatsApp
          </Button>
        </>
      )}

      {/* ── Sub-tab: Comparar Eventos ── */}
      {subTab === "comparar" && (
        <div className="space-y-5">
          {/* Selector: últimos 5 eventos */}
          <div>
            <p className="text-xs text-[#9eb7d4] uppercase tracking-wider font-medium mb-3">
              Seleccioná entre 2 y 4 eventos
            </p>
            <div className="space-y-2">
              {last5Events.length === 0 ? (
                <Card className="glass-card rounded-2xl p-5 border-[#9eb7d4]/20 text-center">
                  <p className="text-[#9eb7d4] text-sm">
                    No hay eventos disponibles
                  </p>
                </Card>
              ) : (
                last5Events.map((evento) => {
                  const isSelected = selectedEventIds.includes(evento.id);
                  const isDisabled =
                    !isSelected && selectedEventIds.length >= 4;
                  return (
                    <button
                      key={evento.id}
                      onClick={() => toggleEventSelection(evento.id)}
                      disabled={isDisabled}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all border ${
                        isSelected
                          ? "bg-[#7a0000]/70 border-[#7a0000] text-white"
                          : isDisabled
                          ? "bg-[#9eb7d4]/5 border-[#9eb7d4]/10 text-[#9eb7d4]/30 cursor-not-allowed"
                          : "bg-[#9eb7d4]/5 border-[#9eb7d4]/20 text-[#9eb7d4] hover:border-[#9eb7d4]/50 hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 text-left">
                        {isSelected ? (
                          <Check className="w-4 h-4 flex-shrink-0" />
                        ) : (
                          <div className="w-4 h-4 rounded border border-current opacity-40 flex-shrink-0" />
                        )}
                        <span>{formatearFecha(evento.fecha_texto)}</span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full ${
                            isSelected
                              ? "bg-white/20 text-white"
                              : "bg-[#7a0000]/40 text-[#fcd5ce]"
                          }`}
                        >
                          {evento.tipo}
                        </span>
                      </div>
                      <span className="text-xs opacity-60 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {evento.hora}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Mensaje si hay 0 o 1 seleccionados */}
          {selectedEventos.length < 2 && (
            <Card className="glass-card rounded-2xl p-5 border-[#9eb7d4]/20 text-center">
              <p className="text-[#9eb7d4] text-sm">
                {selectedEventos.length === 0
                  ? "Seleccioná 2, 3 o 4 eventos para ver la comparación"
                  : "Seleccioná al menos 1 evento más para comparar"}
              </p>
            </Card>
          )}

          {/* Tabla comparativa */}
          {selectedEventos.length >= 2 && (
            <div className="overflow-x-auto rounded-2xl border border-[#9eb7d4]/15">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#9eb7d4]/15 bg-[#9eb7d4]/5">
                    {/* Columna de áreas */}
                    <th className="text-left text-xs font-semibold text-[#9eb7d4] uppercase tracking-wider px-4 py-3 min-w-[110px]">
                      Área
                    </th>
                    {/* Columnas de eventos seleccionados */}
                    {selectedEventos.map((evento) => (
                      <th
                        key={evento.id}
                        className="text-left px-4 py-3 min-w-[120px]"
                      >
                        <div className="flex flex-col gap-0.5">
                          <span className="text-white text-xs font-semibold">
                            {formatearFechaCorta(evento.fecha_texto)}
                          </span>
                          <span className="text-[#fcd5ce] text-[9px] font-normal normal-case tracking-normal">
                            {evento.tipo}
                          </span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {areaOrder.map((areaName, index) => (
                    <tr
                      key={areaName}
                      className={`border-b border-[#9eb7d4]/10 transition-colors hover:bg-[#9eb7d4]/5 ${
                        index % 2 === 0 ? "bg-transparent" : "bg-[#9eb7d4]/[0.03]"
                      } ${index === areaOrder.length - 1 ? "border-b-0" : ""}`}
                    >
                      {/* Celda de área */}
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-2 text-white font-medium text-xs">
                          <span className="text-[#fcd5ce]">
                            {areaIcons[areaName]}
                          </span>
                          {areaName}
                        </span>
                      </td>
                      {/* Celdas de personas */}
                      {selectedEventos.map((evento) => {
                        const cell = getCellContent(areaName, evento.id);
                        return (
                          <td
                            key={evento.id}
                            className={`px-4 py-3 text-xs ${
                              cell === "–"
                                ? "text-[#9eb7d4]/25"
                                : "text-[#9eb7d4]"
                            }`}
                          >
                            {cell}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}