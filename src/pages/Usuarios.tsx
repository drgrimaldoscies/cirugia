import { useEffect, useState, FormEvent } from "react";
import { Plus, X } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { supabaseAdmin } from "../lib/supabaseAdminClient";
import { AppLayout } from "../components/AppLayout";
import type { Profile, Rol } from "../types";

export function Usuarios() {
  const [perfiles, setPerfiles] = useState<Profile[]>([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);

  async function cargar() {
    setCargando(true);
    const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    if (data) setPerfiles(data as Profile[]);
    setCargando(false);
  }

  useEffect(() => {
    cargar();
  }, []);

  async function cambiarRol(id: string, role: Rol) {
    await supabase.from("profiles").update({ role }).eq("id", id);
    cargar();
  }

  return (
    <AppLayout title="Usuarios" subtitle="Personas con acceso al sistema y su rol">
      <div className="flex flex-col gap-4">
        <div className="flex justify-end">
          <button
            onClick={() => setMostrarForm(true)}
            className="ef-btn-primary rounded-sm px-4 py-2 text-sm font-semibold flex items-center gap-2"
          >
            <Plus size={15} /> Crear usuario
          </button>
        </div>

        <div className="ef-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-[color:var(--slate-500)] border-b border-[color:var(--line)]">
                <th className="py-3 px-4 font-medium">Nombre</th>
                <th className="py-3 px-4 font-medium">Rol</th>
                <th className="py-3 px-4 font-medium">Creado</th>
              </tr>
            </thead>
            <tbody>
              {cargando && (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-sm text-[color:var(--slate-500)]">
                    Cargando…
                  </td>
                </tr>
              )}
              {!cargando &&
                perfiles.map((p) => (
                  <tr key={p.id} className="border-b border-[color:var(--line)] last:border-0">
                    <td className="py-3 px-4">{p.full_name || "(sin nombre)"}</td>
                    <td className="py-3 px-4">
                      <select
                        value={p.role}
                        onChange={(e) => cambiarRol(p.id, e.target.value as Rol)}
                        className="ef-input rounded-sm px-2 py-1 text-sm"
                      >
                        <option value="admin">Administrador</option>
                        <option value="staff">Staff comercial</option>
                      </select>
                    </td>
                    <td className="py-3 px-4 text-[color:var(--slate-500)]">
                      {new Date(p.created_at).toLocaleDateString("es-BO")}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {mostrarForm && <CrearUsuarioForm onClose={() => setMostrarForm(false)} onCreado={cargar} />}
    </AppLayout>
  );
}

function CrearUsuarioForm({ onClose, onCreado }: { onClose: () => void; onCreado: () => void }) {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState<Rol>("staff");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setGuardando(true);

    // Se usa el cliente "administrativo" (persistSession:false) para que
    // esta llamada NO reemplace la sesión de quien está creando el usuario.
    const { data, error } = await supabaseAdmin.auth.signUp({
      email,
      password,
      options: { data: { full_name: nombre } },
    });

    if (error || !data.user) {
      setError(error?.message || "No se pudo crear el usuario.");
      setGuardando(false);
      return;
    }

    // El trigger de la base de datos ya creó su fila en "profiles" con rol
    // por defecto ("staff"). Si se eligió "admin", lo actualizamos aquí.
    if (rol === "admin") {
      await supabase.from("profiles").update({ role: "admin", full_name: nombre }).eq("id", data.user.id);
    } else {
      await supabase.from("profiles").update({ full_name: nombre }).eq("id", data.user.id);
    }

    setGuardando(false);
    setExito(true);
    onCreado();
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 p-4">
      <div className="ef-card w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="ef-serif text-xl font-medium">Crear usuario</h2>
          <button onClick={onClose} className="ef-btn-ghost p-1.5 rounded-sm">
            <X size={18} />
          </button>
        </div>

        {exito ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm">
              El usuario fue creado. Según la configuración del proyecto, es posible que deba confirmar su correo
              antes de poder ingresar.
            </p>
            <button onClick={onClose} className="ef-btn-primary rounded-sm px-4 py-2 text-sm font-semibold">
              Cerrar
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Nombre completo"
              required
              className="ef-input rounded-sm px-3 py-2 text-sm"
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Correo electrónico"
              required
              className="ef-input rounded-sm px-3 py-2 text-sm"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contraseña temporal"
              required
              minLength={6}
              className="ef-input rounded-sm px-3 py-2 text-sm"
            />
            <select value={rol} onChange={(e) => setRol(e.target.value as Rol)} className="ef-input rounded-sm px-3 py-2 text-sm">
              <option value="staff">Staff comercial</option>
              <option value="admin">Administrador</option>
            </select>
            {error && <div className="text-xs text-[color:var(--brick)]">{error}</div>}
            <button type="submit" disabled={guardando} className="ef-btn-primary rounded-sm px-4 py-2 text-sm font-semibold mt-2">
              {guardando ? "Creando…" : "Crear usuario"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
