import { NavLink } from "react-router-dom";
import { LayoutDashboard, ListChecks, CalendarCheck2, CalendarClock, Users, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Logo } from "./Logo";

export function Sidebar() {
  const { profile, signOut } = useAuth();
  const isAdmin = profile?.role === "admin";

  const items = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/oportunidades", label: "Oportunidades", icon: ListChecks },
    { to: "/cirugias-efectivas", label: "Cirugías efectivas", icon: CalendarCheck2 },
    { to: "/seguimientos", label: "Seguimientos", icon: CalendarClock },
  ];
  if (isAdmin) items.push({ to: "/usuarios", label: "Usuarios", icon: Users });

  return (
    <div
      className="hidden md:flex flex-col w-60 shrink-0 h-screen sticky top-0 text-white"
      style={{ background: "var(--green-950)" }}
    >
      <div className="p-5 border-b border-white/10 flex items-center gap-3">
        <Logo size={34} />
        <div>
          <div className="ef-serif text-lg font-medium leading-tight">Embudo Quirúrgico</div>
          <div className="text-xs text-[color:var(--green-300)] mt-1">CIES · Santa Cruz de la Sierra</div>
        </div>
      </div>
      <nav className="flex flex-col gap-1 p-3">
        {items.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            className={({ isActive }) =>
              "ef-nav-item flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm " +
              (isActive ? "ef-nav-active font-semibold text-white" : "text-[color:var(--green-300)]")
            }
          >
            <it.icon size={16} />
            {it.label}
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto p-4 border-t border-white/10">
        <div className="text-xs text-[color:var(--green-300)] mb-2">
          {profile?.full_name || "Sesión activa"}
          <div className="opacity-70">{isAdmin ? "Administrador" : "Staff comercial"}</div>
        </div>
        <button
          onClick={signOut}
          className="w-full flex items-center gap-2 text-sm rounded-sm px-2 py-1.5 bg-[color:var(--green-800)] hover:bg-[color:var(--green-700)] text-white"
        >
          <LogOut size={14} /> Cerrar sesión
        </button>
      </div>
    </div>
  );
}
