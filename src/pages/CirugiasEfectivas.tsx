import { useEffect, useState } from "react";
import { Search, Trash2 } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { AppLayout } from "../components/AppLayout";
import { Badge } from "../components/Badge";
import { ESPECIALIDADES, ESTADOS } from "../types";
import type { Oportunidad } from "../types";
import { useAuth } from "../context/AuthContext";

function fmtBs(n: number) {
  return "Bs " + n.toLocaleString("es-BO");
}
function fmtFecha(iso: string) {
  return new Date(iso).toLocaleDateString("es-BO", { day: "2-digit", month: "short", year: "numeric" });
}

const ESTADO_COLOR: Record<string, { bg: string; fg: string }> = {
  "Cirugía Cotizada": { bg: "var(--gray-soft)", fg: "var(--slate-700)" },
  "Cirugía Programada": { bg: "var(--teal-soft)", fg: "var(--teal)" },
  "Cotización con seguimiento": { bg: "#EAF0EC", fg: "var(--green-800)" },
  "Cirugía postergada": { bg: "var(--orange-soft)", fg: "var(--orange)" },
  "Cirugía realizada": { bg: "var(--teal-soft)", fg: "var(--teal)" },
  "Cirugía no convertida": { bg: "var(--brick-soft)", fg: "var(--brick)" },
};

export function CirugiasEfectivas() {
  const { profile } = useAuth();
  const isAdmin = profile?.role === "admin";
  const [oportunidades, setOportunidades] = useState<Oportunidad[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardandoId, setGuardandoId] = useState<string | null>(null);

  const [busqueda, setBusqueda] = useState("");
  const [fEstado, setFEstado] = useState("Todos");
  const [fEspecialidad, setFEspecialidad] = useState("Todas");

  async function cargar() {
    setCargando(true);
    const { data } = await supabase
      .from("oportunidades")
      .select("*, medicos(nombre)")
      .order("created_at", { ascending: false });
    if (data) {
      setOportunidades(
        (data as any[]).map((o) => ({ ...o, medico_nombre: o.medicos?.nombre || null })) as Oportunidad[]
      );
    }
    setCargando(false);
  }

  useEffect(() => {
    cargar();
  }, []);

  async function actualizarEstado(id: string, estado: string) {
    setGuardandoId(id);
    setOportunidades((prev) => prev.map((o) => (o.id === id ? { ...o, estado } : o)));
    await supabase.from("oportunidades").update({ estado }).eq("id", id);
    setGuardandoId(null);
  }

  async function eliminar(id: string) {
    if (!window.confirm("¿Eliminar este registro? Esta acción no se puede deshacer.")) return;
    await supabase.from("oportunidades").delete().eq("id", id);
    cargar();
  }

  const filtradas = oportunidades.filter((o) => {
    if (fEstado !== "Todos" && o.estado !== fEstado) return false;
    if (fEspecialidad !== "Todas" && o.especialidad !== fEspecialidad) return false;
    if (busqueda && !o.paciente_nombre.toLowerCase().includes(busqueda.toLowerCase())) return false;
    return true;
  });

  return (
    <AppLayout title="Cirugías efectivas" subtitle="Tabla dinámica de todas las oportunidades, con su estado actual">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 ef-input rounded-sm px-3 py-2 flex-1 min-w-[200px]">
            <Search size={15} color="var(--slate-500)" />
            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar paciente"
              className="outline-none text-sm w-full bg-transparent"
            />
          </div>
          <select value={fEspecialidad} onChange={(e) => setFEspecialidad(e.target.value)} className="ef-input rounded-sm px-3 py-2 text-sm">
            <option>Todas</option>
            {ESPECIALIDADES.map((e) => (
              <option key={e}>{e}</option>
            ))}
          </select>
          <select value={fEstado} onChange={(e) => setFEstado(e.target.value)} className="ef-input rounded-sm px-3 py-2 text-sm">
            <option>Todos</option>
            {ESTADOS.map((e) => (
              <option key={e}>{e}</option>
            ))}
          </select>
        </div>

        <div className="ef-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-[color:var(--slate-500)] border-b border-[color:var(--line)]">
                  <th className="py-3 px-4 font-medium">N° Cotización</th>
                  <th className="py-3 px-4 font-medium">Fecha</th>
                  <th className="py-3 px-4 font-medium">Paciente</th>
                  <th className="py-3 px-4 font-medium">Código cliente</th>
                  <th className="py-3 px-4 font-medium">Diagnóstico / procedimiento</th>
                  <th className="py-3 px-4 font-medium">Especialidad</th>
                  <th className="py-3 px-4 font-medium">Médico solicitante</th>
                  {isAdmin && <th className="py-3 px-4 font-medium">Monto</th>}
                  <th className="py-3 px-4 font-medium">Estado</th>
                  {isAdmin && <th className="py-3 px-4 font-medium"></th>}
                </tr>
              </thead>
              <tbody>
                {cargando && (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-sm text-[color:var(--slate-500)]">
                      Cargando…
                    </td>
                  </tr>
                )}
                {!cargando &&
                  filtradas.map((o) => {
                    const estilo = ESTADO_COLOR[o.estado];
                    return (
                      <tr key={o.id} className="border-b border-[color:var(--line)] last:border-0">
                        <td className="py-3 px-4 ef-tabular font-semibold">{o.numero_cotizacion}</td>
                        <td className="py-3 px-4 ef-tabular text-[color:var(--slate-700)]">{fmtFecha(o.created_at)}</td>
                        <td className="py-3 px-4">{o.paciente_nombre}</td>
                        <td className="py-3 px-4 text-[color:var(--slate-700)]">{o.codigo_cliente || "—"}</td>
                        <td className="py-3 px-4">{o.diagnostico_procedimiento}</td>
                        <td className="py-3 px-4 text-[color:var(--slate-700)]">{o.especialidad}</td>
                        <td className="py-3 px-4 text-[color:var(--slate-700)]">{o.medico_nombre || "—"}</td>
                        {isAdmin && <td className="py-3 px-4 ef-tabular">{fmtBs(Number(o.monto))}</td>}
                        <td className="py-3 px-4">
                          <select
                            value={o.estado}
                            onChange={(e) => actualizarEstado(o.id, e.target.value)}
                            disabled={guardandoId === o.id}
                            className="rounded-sm px-2 py-1.5 text-xs font-semibold border-0"
                            style={{ background: estilo?.bg || "var(--gray-soft)", color: estilo?.fg || "var(--slate-700)" }}
                          >
                            {ESTADOS.map((e) => (
                              <option key={e} value={e}>
                                {e}
                              </option>
                            ))}
                          </select>
                        </td>
                        {isAdmin && (
                          <td className="py-3 px-4">
                            <button
                              onClick={() => eliminar(o.id)}
                              className="ef-btn-ghost p-1.5 rounded-sm"
                              title="Eliminar registro"
                            >
                              <Trash2 size={15} color="var(--brick)" />
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                {!cargando && filtradas.length === 0 && (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-sm text-[color:var(--slate-500)]">
                      Ninguna oportunidad coincide con los filtros aplicados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
