import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

/**
 * Segunda instancia del cliente de Supabase, usada EXCLUSIVAMENTE para
 * registrar usuarios nuevos desde el panel de administración (supabaseAdmin.auth.signUp).
 *
 * ¿Por qué una segunda instancia?
 * Cuando el administrador crea un usuario nuevo con signUp(), Supabase inicia
 * sesión automáticamente con ESE usuario nuevo en el cliente que hizo la llamada.
 * Si usáramos el cliente principal, el administrador perdería su propia sesión.
 * Esta segunda instancia tiene persistSession:false, así que su sesión temporal
 * nunca se guarda ni reemplaza la sesión real del administrador.
 *
 * No se usa la service_role key en ningún momento: solo la clave pública (anon key).
 */
export const supabaseAdmin = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});
