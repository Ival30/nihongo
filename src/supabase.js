import { createClient } from '@supabase/supabase-js'

// Kredensial via env Vite. Fallback ke nilai publik proyek agar build
// produksi tetap jalan walau env Vercel belum diisi. Anon key memang
// publik by design — data dilindungi RLS per-user di database.
const FALLBACK_URL = 'https://mhxzhmwkefmwokwemirp.supabase.co'
const FALLBACK_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1oeHpobXdrZWZtd29rd2VtaXJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1NjYxODAsImV4cCI6MjEwNTE0MjE4MH0.KMT3HMrTcPmbAfBdLvbvyLQHcWz2ZQCLdaZ2BcDlwA8'

const url = import.meta.env.VITE_SUPABASE_URL || FALLBACK_URL
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY || FALLBACK_ANON

export const isCloudEnabled = Boolean(url && anon)
export const supabase = isCloudEnabled ? createClient(url, anon) : null
