import { ESTADOS } from "../types";
import type { Oportunidad } from "../types";

/**
 * Muestra el volumen actual de oportunidades en cada uno de los 6
 * estados oficiales. A diferencia de un embudo clásico, estos estados
 * no son estrictamente secuenciales (una cirugía puede posponerse o
 * no convertirse desde cualquier punto), así que se grafica el conteo
 * de cada estado tal cual está hoy, en vez de un cálculo acumulado.
 */
export function Funnel({ oportunidades }: { oportunidades: Oportunidad[] }) {
  const data = ESTADOS.map((estado) => ({
    estado,
    valor: oportunidades.filter((o) => o.estado === estado).length,
  }));
  const max = Math.max(1, ...data.map((d) => d.valor));

  return (
    <div className="ef-card p-5">
      <div className="flex items-baseline justify-between mb-4">
        <h3 className="ef-serif text-lg font-medium">Volumen por estado</h3>
        <span className="text-xs text-[color:var(--slate-500)]">Todas las oportunidades</span>
      </div>
      <div className="flex flex-col gap-2">
        {data.map((step, i) => {
          const pct = Math.round((step.valor / max) * 100);
          const esExito = step.estado === "Cirugía realizada";
          return (
            <div key={step.estado} className="flex items-center gap-3">
              <div className="w-44 text-xs text-[color:var(--slate-700)] text-right shrink-0">
                {step.estado}
              </div>
              <div className="flex-1 h-7 bg-[color:var(--gray-soft)] rounded-sm relative overflow-hidden">
                <div
                  className="h-full rounded-sm flex items-center justify-end pr-2"
                  style={{
                    width: Math.max(pct, step.valor ? 6 : 0) + "%",
                    background: esExito ? "var(--teal)" : "var(--green-700)",
                  }}
                >
                  {step.valor > 0 && (
                    <span className="ef-tabular text-xs font-semibold text-white">{step.valor}</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
