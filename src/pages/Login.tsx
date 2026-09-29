import { useState, FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";
import { LogoFull } from "../components/Logo";

export function Login() {
  const { session } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  if (session) return <Navigate to="/dashboard" replace />;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setCargando(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError("Correo o contraseña incorrectos.");
    setCargando(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--green-950)" }}>
      <div className="ef-card w-full max-w-sm p-8">
        <LogoFull height={44} />
        <h1 className="ef-serif text-2xl font-medium mb-1 mt-4">Embudo Quirúrgico</h1>
        <p className="text-sm text-[color:var(--slate-500)] mb-6">Ingresa con tu cuenta de la clínica.</p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Correo electrónico"
            className="ef-input rounded-sm px-3 py-2 text-sm"
          />
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Contraseña"
            className="ef-input rounded-sm px-3 py-2 text-sm"
          />
          {error && <div className="text-xs text-[color:var(--brick)]">{error}</div>}
          <button type="submit" disabled={cargando} className="ef-btn-primary rounded-sm px-4 py-2 text-sm font-semibold mt-2">
            {cargando ? "Ingresando…" : "Ingresar"}
          </button>
        </form>
      </div>
    </div>
  );
}
