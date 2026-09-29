import { LucideIcon } from "lucide-react";

export function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: LucideIcon;
  accent?: string;
}) {
  return (
    <div className="ef-card p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-[color:var(--slate-500)]">{label}</span>
        <Icon size={16} color={accent || "var(--green-500)"} />
      </div>
      <div className="ef-serif ef-tabular text-2xl font-medium" style={{ color: "var(--green-950)" }}>
        {value}
      </div>
      {sub && <span className="text-xs text-[color:var(--slate-500)]">{sub}</span>}
    </div>
  );
}
