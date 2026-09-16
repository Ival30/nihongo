import { createClient } from '@supabase/supabase-js'

// Kredensial via env Vite. Kosong → mode lokal (localStorage saja).
const url = import.meta.env.VITE_SUPABASE_URL
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isCloudEnabled = Boolean(url && anon)
export const supabase = isCloudEnabled ? createClient(url, anon) : null
