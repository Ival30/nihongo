// Sinkron progres (srs, progress, streak) ke Supabase, satu baris per user.
// Tabel: user_progress(user_id uuid pk, srs jsonb, progress jsonb, streak jsonb, updated_at timestamptz)
// Skema SQL: lihat supabase-schema.sql

const TABLE = 'user_progress'

const isEmptyObj = (o) => !o || (typeof o === 'object' && Object.keys(o).length === 0)

export async function loadCloud(supabase, userId) {
  const { data, error } = await supabase
    .from(TABLE)
    .select('srs, progress, streak, updated_at')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  return data || null
}

export async function saveCloud(supabase, userId, { srs, progress, streak }) {
  const { error } = await supabase.from(TABLE).upsert(
    { user_id: userId, srs: srs || {}, progress: progress || {}, streak: streak || null, updated_at: new Date().toISOString() },
    { onConflict: 'user_id' },
  )
  if (error) throw error
}

// Aturan gabung saat login: cloud non-kosong menang atas lokal yang kosong.
// Dua-dua isi → pakai cloud (sumber benar lintas device), lokal tetap jadi fallback.
// ponytail: merge per-kunci + resolusi konflik waktu nyata kalau multi-device aktif dipakai bareng.
export function shouldPullCloud(cloud, local) {
  if (!cloud) return false
  const cloudEmpty = isEmptyObj(cloud.srs) && isEmptyObj(cloud.progress)
  if (cloudEmpty) return false
  const localEmpty = isEmptyObj(local.srs) && isEmptyObj(local.progress)
  if (localEmpty) return true
  return true // cloud menang — konsisten lintas device
}
