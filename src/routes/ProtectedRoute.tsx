import { Navigate } from "react-router-dom";
import { ReactNode } from "react";
import { useAuth } from "../context/AuthContext";
import type { Rol } from "../types";

export function ProtectedRoute({
  children,
  onlyRole,
}: {
  children: ReactNode;
  onlyRole?: Rol;
}) {
  const { session, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-[color:var(--slate-500)]">
        Cargando…
      </div>
    );
  }

  if (!session) return <Navigate to="/login" replace />;

  // Esto es solo una comodidad de navegación: la seguridad real de los datos
  // vive en las políticas de Row Level Security de Supabase, no aquí.
  if (onlyRole && profile?.role !== onlyRole) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
