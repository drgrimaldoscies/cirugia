import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { AppLayout } from "../components/AppLayout";
import { OportunidadDrawer } from "../components/OportunidadDrawer";
import { useAuth } from "../context/AuthContext";
import { ESTADOS_TERMINALES } from "../types";
import type { Oportunidad } from "../types";

function fmtFecha(iso: string) {
  return new Date(iso).toLocaleDateString("es-BO", { day: "2-digit", month: "short", year: "numeric" });
}
function fmtFechaCorta(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("es-BO", { day: "2-digit", month: "short" });
}

export function Seguimientos() {
  const { profile } = useAuth();
  const isAdmin = profile?.role === "admin";
  const [oportunidades, setOportunidades] = useState<Oportunidad[]>([]);
  const [cargando, setCargando] = useState(true);
  const [seleccion, setSeleccion] = useState<Oportunidad | null>(null);

  async function cargar() {
    setCargando(true);
    const { data } = await supabase
      .from("oportunidades")
      .select("*, medicos(nombre)")
      .order("created_at", { ascending: false });
    if (data) {
      const activas = (data as any[])
        .map((o) => ({ ...o, medico_nombre: o.medicos?.nombre || null }))
        .filter((o) => !ESTADOS_TERMINALES.includes(o.estado)) as Oportunidad[];
      setOportunidades(activas);
    }
    setCargando(false);
  }

  useEffect(() => {
    cargar();
  }, []);

  async function eliminar(id: string) {
    if (!window.confirm("¿Eliminar este registro? Esta acción no se puede deshacer.")) return;
    await supabase.from("oportunidades").delete().eq("id", id);
    cargar();
  }

  return (
    <AppLayout title="Seguimientos" subtitle="Casos activos: registra el contacto, su resultado y la próxima acción">
      <div className="ef-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-[color:var(--slate-500)] border-b border-[color:var(--line)]">
                <th className="py-3 px-4 font-medium">N° Cotización</th>
                <th className="py-3 px-4 font-medium">Código cliente</th>
                <th className="py-3 px-4 font-medium">Diagnóstico / procedimiento</th>
                <th className="py-3 px-4 font-medium">Médico</th>
                <th className="py-3 px-4 font-medium">Fecha de indicación</th>
                <th className="py-3 px-4 font-medium">Fecha probable de cirugía</th>
                <th className="py-3 px-4 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {cargando && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-sm text-[color:var(--slate-500)]">
                    Cargando…
                  </td>
                </tr>
              )}
              {!cargando &&
                oportunidades.map((o) => (
                  <tr key={o.id} className="border-b border-[color:var(--line)] last:border-0">
                    <td className="py-3 px-4 ef-tabular font-semibold">{o.numero_cotizacion}</td>
                    <td className="py-3 px-4 text-[color:var(--slate-700)]">{o.codigo_cliente || "—"}</td>
                    <td className="py-3 px-4">
                      <div className="font-semibold">{o.paciente_nombre}</div>
                      <div className="text-xs text-[color:var(--slate-500)]">{o.diagnostico_procedimiento}</div>
                    </td>
                    <td className="py-3 px-4 text-[color:var(--slate-700)]">{o.medico_nombre || "—"}</td>
                    <td className="py-3 px-4 ef-tabular text-[color:var(--slate-700)]">{fmtFecha(o.created_at)}</td>
                    <td className="py-3 px-4 ef-tabular text-[color:var(--slate-700)]">
                      {o.fecha_probable_cirugia ? fmtFechaCorta(o.fecha_probable_cirugia) : "—"}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSeleccion(o)}
                          className="ef-btn-ghost text-xs font-semibold px-3 py-1.5 rounded-sm border border-[color:var(--line)]"
                        >
                          Gestionar
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => eliminar(o.id)}
                            className="ef-btn-ghost p-1.5 rounded-sm"
                            title="Eliminar registro"
                          >
                            <Trash2 size={15} color="var(--brick)" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              {!cargando && oportunidades.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-sm text-[color:var(--slate-500)]">
                    No hay casos activos por el momento.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <OportunidadDrawer oportunidad={seleccion} onClose={() => setSeleccion(null)} onChanged={cargar} />
    </AppLayout>
  );
}
