// lib/supabase.js — crea esto UNA SOLA VEZ
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

// Patron Singleton
const globalSupabase = globalThis
if (!globalSupabase.__supabase) {
  globalSupabase.__supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
}

export const supabase = globalSupabase.__supabase
