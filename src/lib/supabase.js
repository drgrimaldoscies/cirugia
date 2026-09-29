import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const clave = import.meta.env.VITE_SUPABASE_ANON_KEY

// Creamos el cliente UNA SOLA VEZ
const global = globalThis
if (!global.__supabaseCliente) {
  global.__supabaseCliente = createClient(url, clave)
}

export const supabase = global.__supabaseCliente
