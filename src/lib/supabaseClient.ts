import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabaseConfigurado = Boolean(supabaseUrl && supabaseAnonKey);

if (!supabaseConfigurado) {
  // eslint-disable-next-line no-console
  console.error(
    "Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY. Revisa tu archivo .env (local) o las variables de entorno en Netlify y vuelve a desplegar."
  );
}

// Cliente principal: mantiene la sesión de la persona que usa la aplicación.
// Si faltan las variables se usan valores de relleno para que la página cargue
// y pueda mostrar un aviso claro en lugar de quedar en blanco.
export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-key"
);
