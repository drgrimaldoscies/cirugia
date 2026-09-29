import { useEffect, useState } from "react";
import { X, MessageCircle, Phone, Mail, User as UserIcon } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";
import { Badge } from "./Badge";
import { CANALES, CLASIFICACIONES_SEGUIMIENTO } from "../types";
import type { Oportunidad, Seguimiento } from "../types";

function fmtBs(n: number) {
  return "Bs " + n.toLocaleString("es-BO");
}
function fmtFecha(iso: string) {
  return new Date(iso.slice(0, 10) + "T00:00:00").toLocaleDateString("es-BO", { day: "2-digit", month: "short" });
}
function CanalIcon({ canal }: { canal: string | null }) {
  if (canal === "WhatsApp") return <MessageCircle size={14} />;
  if (canal === "Llamada Telefónica") return <Phone size={14} />;
  if (canal === "Correo electrónico") return <Mail size={14} />;
  return <UserIcon size={14} />;
}

export function OportunidadDrawer({
  oportunidad,
  onClose,
  onChanged,
}: {
  oportunidad: Oportunidad | null;
  onClose: () => void;
  onChanged: () => void;
}) {
  const { profile } = useAuth();
  const isAdmin = profile?.role === "admin";
  const [seguimientos, setSeguimientos] = useState<Seguimiento[]>([]);
  const [cargando, setCargando] = useState(false);

  const [fechaProbable, setFechaProbable] = useState("");
  const [clasificacion, setClasificacion] = useState<string>("Con seguimiento");
  const [canal, setCanal] = useState<string>(CANALES[0]);
  const [resultado, setResultado] = useState("");
  const [proximaAccion, setProximaAccion] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!oportunidad) return;
    setFechaProbable(oportunidad.fecha_probable_cirugia || "");
    setClasificacion("Con seguimiento");
    setResultado("");
    setProximaAccion("");
    setCargando(true);
    supabase
      .from("seguimientos")
      .select("*")
      .eq("oportunidad_id", oportunidad.id)
      .order("fecha", { ascending: false })
      .then(({ data, error }) => {
        if (!error && data) setSeguimientos(data as Seguimiento[]);
        setCargando(false);
      });
  }, [oportunidad?.id]);

  if (!oportunidad) return null;

  async function guardarGestion() {
    if (!profile) return;
    setGuardando(true);

    // 1. Actualiza la fecha probable de cirugía en la oportunidad, si se indicó.
    await supabase
      .from("oportunidades")
      .update({ fecha_probable_cirugia: fechaProbable || null })
      .eq("id", oportunidad!.id);

    // 2. Registra el nuevo seguimiento (clasificación + contacto, si aplica).
    await supabase.from("seguimientos").insert({
      oportunidad_id: oportunidad!.id,
      clasificacion,
      canal: clasificacion === "Con seguimiento" ? canal : null,
      responsable_id: profile.id,
      resultado: resultado || null,
      proxima_accion: proximaAccion || null,
    });

    const { data } = await supabase
      .from("seguimientos")
      .select("*")
      .eq("oportunidad_id", oportunidad!.id)
      .order("fecha", { ascending: false });
    if (data) setSeguimientos(data as Seguimiento[]);

    setResultado("");
    setProximaAccion("");
    setGuardando(false);
    onChanged();
  }

  return (
    <div className="fixed inset-0 z-30 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="ef-drawer relative w-full max-w-md bg-[color:var(--paper)] h-full overflow-y-auto ef-scrollbar shadow-2xl">
        <div className="border-b border-[color:var(--line)] p-5 sticky top-0 bg-white z-10 flex items-start justify-between">
          <div>
            <span className="text-xs text-[color:var(--slate-500)]">{oportunidad.numero_cotizacion}</span>
            <h2 className="ef-serif text-xl font-medium">{oportunidad.paciente_nombre}</h2>
            <div className="mt-2">
              <Badge estado={oportunidad.estado} />
            </div>
          </div>
          <button onClick={onClose} className="ef-btn-ghost p-1.5 rounded-sm">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-5">
          <div className="ef-card p-4 grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-xs text-[color:var(--slate-500)]">Diagnóstico / procedimiento</div>
              <div>{oportunidad.diagnostico_procedimiento}</div>
            </div>
            <div>
              <div className="text-xs text-[color:var(--slate-500)]">Especialidad</div>
              <div>{oportunidad.especialidad}</div>
            </div>
            <div>
              <div className="text-xs text-[color:var(--slate-500)]">Código de cliente</div>
              <div>{oportunidad.codigo_cliente || "—"}</div>
            </div>
            <div>
              <div className="text-xs text-[color:var(--slate-500)]">Tipo de paciente</div>
              <div>{oportunidad.tipo_paciente}</div>
            </div>
            <div>
              <div className="text-xs text-[color:var(--slate-500)]">Médico solicitante</div>
              <div>{oportunidad.medico_nombre || "Sin asignar"}</div>
            </div>
            {isAdmin && (
              <div>
                <div className="text-xs text-[color:var(--slate-500)]">Monto presupuestado</div>
                <div className="ef-tabular font-semibold">{fmtBs(oportunidad.monto)}</div>
              </div>
            )}
            <div>
              <div className="text-xs text-[color:var(--slate-500)]">Fecha de indicación</div>
              <div>{fmtFecha(oportunidad.created_at)}</div>
            </div>
          </div>

          {oportunidad.motivo_perdida && (
            <div className="ef-card p-4" style={{ borderColor: "var(--brick)" }}>
              <div className="text-xs text-[color:var(--brick)] font-semibold mb-1">Motivo de no conversión</div>
              <div className="text-sm">{oportunidad.motivo_perdida}</div>
            </div>
          )}

          <div>
            <h3 className="text-sm font-semibold mb-3">Historial de seguimiento</h3>
            {cargando && <span className="text-sm text-[color:var(--slate-500)]">Cargando…</span>}
            <div className="flex flex-col gap-3">
              {!cargando && seguimientos.length === 0 && (
                <span className="text-sm text-[color:var(--slate-500)]">Todavía no hay seguimientos registrados.</span>
              )}
              {seguimientos.map((s) => (
                <div key={s.id} className="ef-card p-3 flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-xs font-semibold text-[color:var(--green-800)]">
                      <CanalIcon canal={s.canal} /> {s.clasificacion || "Sin seguimiento"}
                      {s.canal ? " · " + s.canal : ""}
                    </span>
                    <span className="text-xs text-[color:var(--slate-500)]">{fmtFecha(s.fecha)}</span>
                  </div>
                  {s.resultado && <div className="text-sm font-medium">{s.resultado}</div>}
                  {s.proxima_accion && (
                    <div className="text-xs text-[color:var(--green-700)] mt-1">
                      Próxima acción: {s.proxima_accion}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="ef-card p-4">
            <h3 className="text-sm font-semibold mb-3">Gestionar caso</h3>
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-xs text-[color:var(--slate-500)] block mb-1">Fecha probable de cirugía</label>
                <input
                  type="date"
                  value={fechaProbable}
                  onChange={(e) => setFechaProbable(e.target.value)}
                  className="ef-input rounded-sm px-3 py-2 text-sm w-full"
                />
              </div>

              <div>
                <label className="text-xs text-[color:var(--slate-500)] block mb-1">Clasificación de seguimiento</label>
                <select
                  value={clasificacion}
                  onChange={(e) => setClasificacion(e.target.value)}
                  className="ef-input rounded-sm px-3 py-2 text-sm w-full"
                >
                  {CLASIFICACIONES_SEGUIMIENTO.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>

              {clasificacion === "Con seguimiento" && (
                <div>
                  <label className="text-xs text-[color:var(--slate-500)] block mb-1">Medio de contacto</label>
                  <select
                    value={canal}
                    onChange={(e) => setCanal(e.target.value)}
                    className="ef-input rounded-sm px-3 py-2 text-sm w-full"
                  >
                    {CANALES.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="text-xs text-[color:var(--slate-500)] block mb-1">Resultado del contacto</label>
                <textarea
                  value={resultado}
                  onChange={(e) => setResultado(e.target.value)}
                  rows={2}
                  className="ef-input rounded-sm px-3 py-2 text-sm w-full resize-none"
                />
              </div>

              <div>
                <label className="text-xs text-[color:var(--slate-500)] block mb-1">Próxima acción (opcional)</label>
                <textarea
                  value={proximaAccion}
                  onChange={(e) => setProximaAccion(e.target.value)}
                  rows={2}
                  className="ef-input rounded-sm px-3 py-2 text-sm w-full resize-none"
                />
              </div>

              <button
                onClick={guardarGestion}
                disabled={guardando}
                className="ef-btn-primary rounded-sm px-4 py-2 text-sm font-semibold"
              >
                {guardando ? "Guardando…" : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
