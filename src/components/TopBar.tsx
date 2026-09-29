import { Clock } from "lucide-react";

export function TopBar({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="border-b border-[color:var(--line)] bg-white px-5 md:px-8 py-4 flex items-center justify-between">
      <div>
        <h1 className="ef-serif text-2xl font-medium">{title}</h1>
        {subtitle && <p className="text-xs text-[color:var(--slate-500)] mt-0.5">{subtitle}</p>}
      </div>
      <div className="hidden sm:flex items-center gap-2 text-xs text-[color:var(--slate-500)]">
        <Clock size={14} /> {new Date().toLocaleDateString("es-BO", { day: "2-digit", month: "long", year: "numeric" })}
      </div>
    </div>
  );
}
