const ESTILO: Record<string, { bg: string; fg: string }> = {
  "Cirugía Cotizada": { bg: "var(--gray-soft)", fg: "var(--slate-700)" },
  "Cirugía Programada": { bg: "var(--teal-soft)", fg: "var(--teal)" },
  "Cotización con seguimiento": { bg: "#EAF0EC", fg: "var(--green-800)" },
  "Cirugía postergada": { bg: "var(--orange-soft)", fg: "var(--orange)" },
  "Cirugía realizada": { bg: "var(--teal)", fg: "#FFFFFF" },
  "Cirugía no convertida": { bg: "var(--brick-soft)", fg: "var(--brick)" },
};

export function Badge({ estado }: { estado: string }) {
  const s = ESTILO[estado] || ESTILO["Cirugía Cotizada"];
  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-sm text-xs font-semibold whitespace-nowrap"
      style={{ background: s.bg, color: s.fg }}
    >
      {estado}
    </span>
  );
}
