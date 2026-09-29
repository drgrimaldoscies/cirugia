import { useEffect, useState } from "react";
import { AlertTriangle, ListChecks, ShieldCheck, TrendingDown, Wallet, CalendarRange } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { AppLayout } from "../components/AppLayout";
import { KpiCard } from "../components/KpiCard";
import { Funnel } from "../components/Funnel";
import { LogoWatermark } from "../components/Logo";
import { ESPECIALIDADES, ESTADOS_TERMINALES } from "../types";
import type { Oportunidad } from "../types";
import { useAuth } from "../context/AuthContext";

function fmtBs(n: number) {
  return "Bs " + n.toLocaleString("es-BO");
}

export function Dashboard() {
  const { profile } = useAuth();
  const isAdmin = profile?.role === "admin";
  const [oportunidades, setOportunidades] = useState<Oportunidad[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    supabase
      .from("oportunidades")
      .select("*")
      .then(({ data, error }) => {
        if (!error && data) setOportunidades(data as Oportunidad[]);
        setCargando(false);
      });
  }, []);

  if (cargando) {
    return (
      <AppLayout title="Dashboard ejecutivo">
        <div className="text-sm text-[color:var(--slate-500)]">Cargando datos…</div>
      </AppLayout>
    );
  }

  const activas = oportunidades.filter((o) => !ESTADOS_TERMINALES.includes(o.estado));
  const valorEmbudo = activas.reduce((s, o) => s + Number(o.monto || 0), 0);
  const valorPerdido = oportunidades
    .filter((o) => o.estado === "Cirugía no convertida")
    .reduce((s, o) => s + Number(o.monto || 0), 0);
  const realizadas = oportunidades.filter((o) => o.estado === "Cirugía realizada").length;
  const tasaConversion = oportunidades.length ? Math.round((realizadas / oportunidades.length) * 100) : 0;

  const ahora = new Date();
  const delMes = oportunidades.filter((o) => {
    const d = new Date(o.created_at);
    return d.getFullYear() === ahora.getFullYear() && d.getMonth() === ahora.getMonth();
  });
  const realizadasMes = delMes.filter((o) => o.estado === "Cirugía realizada").length;
  const tasaConversionMes = delMes.length ? Math.round((realizadasMes / delMes.length) * 100) : 0;

  const porEspecialidad = ESPECIALIDADES.map((esp) => {
    const total = oportunidades.filter((o) => o.especialidad === esp).length;
    const real = oportunidades.filter((o) => o.especialidad === esp && o.estado === "Cirugía realizada").length;
    return { esp, total, pct: total ? Math.round((real / total) * 100) : 0 };
  }).filter((row) => row.total > 0);

  const alertas = activas.filter((o) => o.estado === "Cirugía Cotizada");

  return (
    <AppLayout title="Dashboard ejecutivo" subtitle="Estado actual del embudo de conversión quirúrgica">
      <div className="relative">
        <div
          className="hidden lg:block absolute pointer-events-none select-none"
          style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)", opacity: 0.05, zIndex: 0 }}
        >
          <LogoWatermark size={480} />
        </div>

        <div className="relative flex flex-col gap-6" style={{ zIndex: 1 }}>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard label="Oportunidades activas" value={activas.length} icon={ListChecks} />
            <KpiCard
              label="Conversión general"
              value={tasaConversion + "%"}
              sub="Cirugía cotizada → realizada"
              icon={ShieldCheck}
              accent="var(--teal)"
            />
            <KpiCard
              label="Conversión este mes"
              value={tasaConversionMes + "%"}
              sub={delMes.length + " casos registrados este mes"}
              icon={CalendarRange}
              accent="var(--teal)"
            />
            {isAdmin && <KpiCard label="Valor en el embudo" value={fmtBs(valorEmbudo)} icon={Wallet} />}
          </div>

          {isAdmin && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <KpiCard label="Valor perdido" value={fmtBs(valorPerdido)} icon={TrendingDown} accent="var(--brick)" />
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <Funnel oportunidades={oportunidades} />
            </div>
            <div className="ef-card p-5 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h3 className="ef-serif text-lg font-medium">Requieren atención</h3>
                <AlertTriangle size={16} color="var(--orange)" />
              </div>
              <div className="flex flex-col gap-3 overflow-y-auto ef-scrollbar" style={{ maxHeight: 280 }}>
                {alertas.map((o) => (
                  <div key={o.id} className="flex flex-col gap-1 pb-3 border-b border-[color:var(--line)] last:border-0">
                    <span className="text-sm font-semibold">{o.paciente_nombre}</span>
                    <span className="text-xs text-[color:var(--orange)]">Cotización sin avanzar de estado</span>
                  </div>
                ))}
                {alertas.length === 0 && (
                  <span className="text-sm text-[color:var(--slate-500)]">Sin alertas activas.</span>
                )}
              </div>
            </div>
          </div>

          <div className="ef-card p-5">
            <h3 className="ef-serif text-lg font-medium mb-4">Conversión por especialidad</h3>
            <div className="flex flex-col gap-3">
              {porEspecialidad.map((row) => (
                <div key={row.esp} className="flex items-center gap-3">
                  <div className="w-56 text-xs text-[color:var(--slate-700)] shrink-0">{row.esp}</div>
                  <div className="flex-1 h-2.5 bg-[color:var(--gray-soft)] rounded-sm overflow-hidden">
                    <div className="h-full rounded-sm" style={{ width: row.pct + "%", background: "var(--green-700)" }} />
                  </div>
                  <div className="w-10 text-xs ef-tabular text-right text-[color:var(--slate-700)]">{row.pct}%</div>
                </div>
              ))}
              {porEspecialidad.length === 0 && (
                <span className="text-sm text-[color:var(--slate-500)]">Todavía no hay oportunidades registradas.</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
