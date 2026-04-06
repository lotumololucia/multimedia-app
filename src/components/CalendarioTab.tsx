import { useState } from "react";
import type { Evento, Miembro, Area, Asignacion } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Clock, User, X, Edit3 } from "lucide-react";

const areaOrder = [
  "Luces",
  "Proyección",
  "Transmisión",
  "Fotos",
  "Cámara fija",
  "Cámara móvil",
  "Sonido",
];

const DIAS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

// ─────────────────────────────────────────────────────────────
// normalizarHora: quita el sufijo " hs" si existe.
// Necesario porque algunos registros dicen "11:00 hs" y otros
// solo "11:00". Lo normalizamos para mostrar consistente.
// ─────────────────────────────────────────────────────────────
function normalizarHora(hora: string): string {
  return (hora ?? "").replace(" hs", "").trim();
}

interface Props {
  eventos: Evento[];
  asignaciones: Asignacion[];
  miembros: Miembro[];
  areas: Area[];
  isAdmin?: boolean;
  onEdit?: (evento: Evento) => void;
}

export default function CalendarioTab({ eventos, asignaciones, miembros, areas, isAdmin, onEdit }: Props) {
  const hoy = new Date();

  // ── Estado: mes y año visible en el calendario ──────────────
  const [mes, setMes] = useState(hoy.getMonth());
  const [anio, setAnio] = useState(hoy.getFullYear());

  // ── Estado: día seleccionado para mostrar el popover ────────
  const [diaSeleccionado, setDiaSeleccionado] = useState<string | null>(null);

  // ─────────────────────────────────────────────────────────────
  // Navegación entre meses.
  // Al pasar de diciembre a enero incrementamos el año,
  // y al ir de enero a diciembre lo decrementamos.
  // ─────────────────────────────────────────────────────────────
  function irMesAnterior() {
    if (mes === 0) { setMes(11); setAnio(a => a - 1); }
    else setMes(m => m - 1);
  }

  function irMesSiguiente() {
    if (mes === 11) { setMes(0); setAnio(a => a + 1); }
    else setMes(m => m + 1);
  }

  // ─────────────────────────────────────────────────────────────
  // Construcción de la grilla del calendario.
  //
  // Necesitamos saber en qué día de la semana cae el día 1
  // del mes para insertar celdas vacías al inicio.
  // Luego generamos un array de strings "YYYY-MM-DD" para
  // cada día del mes, precedido de nulls para alinear.
  // ─────────────────────────────────────────────────────────────
  const primerDia = new Date(anio, mes, 1).getDay(); // 0=Dom, 6=Sáb
  const diasEnMes = new Date(anio, mes + 1, 0).getDate();

  const celdas: (string | null)[] = [
    ...Array(primerDia).fill(null),
    ...Array.from({ length: diasEnMes }, (_, i) => {
      const d = i + 1;
      return `${anio}-${String(mes + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    }),
  ];

  // ─────────────────────────────────────────────────────────────
  // eventosPorFecha: un Map<fecha_ISO, Evento[]> para lookup O(1).
  // Solo incluimos eventos del mes visible para no iterar todo.
  // ─────────────────────────────────────────────────────────────
  const prefijeMes = `${anio}-${String(mes + 1).padStart(2, "0")}`;
  const eventosDelMes = eventos.filter(e => e.fecha_texto.startsWith(prefijeMes));

  const eventоsPorFecha = new Map<string, Evento[]>();
  eventosDelMes.forEach(e => {
    const existing = eventоsPorFecha.get(e.fecha_texto) ?? [];
    eventоsPorFecha.set(e.fecha_texto, [...existing, e]);
  });

  // Ordenar eventos de cada día por hora
  eventоsPorFecha.forEach((evs, fecha) => {
    eventоsPorFecha.set(fecha, evs.sort((a, b) =>
      normalizarHora(a.hora).localeCompare(normalizarHora(b.hora))
    ));
  });

  // ─────────────────────────────────────────────────────────────
  // getAsignacionesEvento: para un evento dado, devuelve la lista
  // de "Área: Miembro(s)" para mostrar en el popover.
  // Filtra en memoria sin fetch extra.
  // ─────────────────────────────────────────────────────────────
  function getAsignacionesEvento(evento: Evento): { areaNombre: string; nombres: string[] }[] {
    return areaOrder.map(areaNombre => {
      const area = areas.find(a => a.nombre === areaNombre);
      if (!area) return { areaNombre, nombres: [] };
      const nombres = asignaciones
        .filter(a => a.evento_id === evento.id && a.area_id === area.id)
        .map(a => miembros.find(m => m.id === a.miembro_id)?.nombre)
        .filter(Boolean) as string[];
      return { areaNombre, nombres };
    }).filter(x => x.nombres.length > 0); // solo áreas con alguien asignado
  }

  const eventosDelDiaSeleccionado = diaSeleccionado
    ? (eventоsPorFecha.get(diaSeleccionado) ?? [])
    : [];

  const todayISO = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-${String(hoy.getDate()).padStart(2, "0")}`;

  return (
    <div className="space-y-4">
      {/* ── Header del calendario: mes/año + flechas ─────────── */}
      <div className="flex items-center justify-between px-1">
        <button
          onClick={irMesAnterior}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-[#9eb7d4] hover:text-white hover:bg-[#9eb7d4]/10 transition-all"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h2 className="text-base font-semibold text-white">
          {MESES[mes]} {anio}
        </h2>
        <button
          onClick={irMesSiguiente}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-[#9eb7d4] hover:text-white hover:bg-[#9eb7d4]/10 transition-all"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* ── Grilla del calendario ────────────────────────────── */}
      <Card className="glass-card rounded-2xl p-3 border-[#9eb7d4]/20">
        {/* Cabecera días de la semana */}
        <div className="grid grid-cols-7 mb-2">
          {DIAS.map(d => (
            <div key={d} className="text-center text-[10px] font-semibold text-[#9eb7d4] py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Celdas */}
        <div className="grid grid-cols-7 gap-[3px]">
          {celdas.map((fecha, i) => {
            if (!fecha) {
              return <div key={`empty-${i}`} />;
            }

            const eventosHoy = eventоsPorFecha.get(fecha) ?? [];
            const tieneEventos = eventosHoy.length > 0;
            const esHoy = fecha === todayISO;
            const estaSeleccionado = fecha === diaSeleccionado;
            const dia = parseInt(fecha.split("-")[2]);

            return (
              <button
                key={fecha}
                onClick={() => setDiaSeleccionado(estaSeleccionado ? null : fecha)}
                className={`
                  relative flex flex-col items-center rounded-lg py-1 px-0.5 min-h-[44px] transition-all
                  ${estaSeleccionado ? "bg-[#7a0000]/60 border border-[#7a0000]" : "hover:bg-[#9eb7d4]/10"}
                  ${esHoy && !estaSeleccionado ? "border border-[#9eb7d4]/50" : ""}
                `}
              >
                {/* Número del día */}
                <span className={`text-xs font-medium ${esHoy ? "text-white" : "text-[#9eb7d4]"}`}>
                  {dia}
                </span>

                {/* Puntos rojos por cada evento del día */}
                {tieneEventos && (
                  <div className="flex gap-[3px] mt-0.5 flex-wrap justify-center">
                    {eventosHoy.map(ev => (
                      <div
                        key={ev.id}
                        className="w-[6px] h-[6px] rounded-full bg-[#7a0000]"
                      />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </Card>

      {/* ── Popover: detalle del día seleccionado ────────────────
          Se muestra debajo del calendario cuando hay un día
          seleccionado con eventos. Si el día no tiene eventos,
          mostramos un mensaje vacío.
          No usamos un Dialog porque queremos que el usuario
          pueda ver el calendario y el detalle al mismo tiempo.
      ──────────────────────────────────────────────────────────── */}
      {diaSeleccionado && (
        <div className="space-y-3">
          {/* Header del popover */}
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-semibold text-white">
              {(() => {
                const fecha = new Date(diaSeleccionado + "T00:00:00");
                const dia = fecha.toLocaleDateString("es-AR", { weekday: "long" });
                const diaCapital = dia.charAt(0).toUpperCase() + dia.slice(1);
                const dd = String(fecha.getDate()).padStart(2, "0");
                const mm = String(fecha.getMonth() + 1).padStart(2, "0");
                return `${diaCapital} ${dd}/${mm}`;
              })()}
            </h3>
            <button
              onClick={() => setDiaSeleccionado(null)}
              className="text-[#9eb7d4] hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {eventosDelDiaSeleccionado.length === 0 ? (
            <Card className="glass-card rounded-2xl p-4 border-[#9eb7d4]/20 text-center">
              <p className="text-[#9eb7d4] text-sm">Sin eventos este día</p>
            </Card>
          ) : (
            eventosDelDiaSeleccionado.map(evento => {
              const asigs = getAsignacionesEvento(evento);
              return (
                <Card
                  key={evento.id}
                  className="glass-card rounded-2xl p-4 border-[#9eb7d4]/15"
                >
{/* Nombre, hora y tipo en una sola fila */}
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="text-sm font-semibold text-white flex-1">
                      {evento.nombre}
                    </h4>
                    <span className="flex items-center gap-1 text-xs text-[#9eb7d4] shrink-0">
                      <Clock className="w-3 h-3" />
                      {normalizarHora(evento.hora)}
                    </span>
                    <span className="text-[10px] bg-[#7a0000]/40 text-[#fcd5ce] px-2 py-0.5 rounded-full shrink-0">
                      {evento.tipo}
                    </span>
                    {isAdmin && onEdit && (
                      <button
                        onClick={() => onEdit(evento)}
                        className="p-1 text-[#9eb7d4] hover:text-white transition-colors rounded-md hover:bg-[#9eb7d4]/10 shrink-0"
                        title="Editar evento"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Equipo asignado */}
                  {asigs.length === 0 ? (
                    <p className="text-xs text-[#9eb7d4]/50 italic">Sin asignaciones</p>
                  ) : (
                    <div className="space-y-1">
                      {asigs.map(({ areaNombre, nombres }) => (
                        <div key={areaNombre} className="flex items-start gap-2 text-xs">
                          <span className="text-[#9eb7d4] w-24 shrink-0">{areaNombre}:</span>
                          <span className="text-white font-medium flex items-center gap-1">
                            <User className="w-3 h-3 text-[#fcd5ce] shrink-0" />
                            {nombres.join(", ")}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}