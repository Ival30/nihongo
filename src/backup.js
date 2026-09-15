// Cadangan progres: ekspor/impor JSON agar data selamat dari hapus cache.
// localStorage ikut terhapus saat "clear site data" — berkas cadangan tidak.

const BACKUP_VERSION = 1
const META_KEY = 'nihongo_backup_meta_v1'

export function collectBackup(srs, progress, streak) {
  return {
    app: 'nihongo',
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    data: { srs: srs || {}, progress: progress || {}, streak: streak || null },
  }
}

export function validateBackup(obj) {
  if (!obj || typeof obj !== 'object') return 'Berkas bukan cadangan valid.'
  if (obj.app !== 'nihongo') return 'Berkas ini bukan cadangan Nihongo.'
  if (!obj.data || typeof obj.data !== 'object') return 'Isi cadangan rusak.'
  return null
}

export function downloadBackup(srs, progress, streak) {
  const blob = new Blob([JSON.stringify(collectBackup(srs, progress, streak))], {
    type: 'application/json',
  })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `nihongo-backup-${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(a.href), 5000)
  try {
    localStorage.setItem(META_KEY, JSON.stringify({ at: Date.now() }))
  } catch {
    // kuota penuh — unduhan tetap jalan, penanda waktu saja yang gagal
  }
}

export function readBackupFile(file) {
  return file.text().then((t) => {
    let obj
    try {
      obj = JSON.parse(t)
    } catch {
      throw new Error('Berkas bukan JSON valid.')
    }
    const err = validateBackup(obj)
    if (err) throw new Error(err)
    return obj.data
  })
}

export function getLastBackupAt() {
  try {
    return JSON.parse(localStorage.getItem(META_KEY))?.at || null
  } catch {
    return null
  }
}

// Minta browser tidak menggusur data saat butuh ruang (Chrome/Edge/Firefox).
// Mengembalikan true jika dikabulkan. Bukan jaminan mutlak — cadangan berkas tetap utama.
export function ensurePersistentStorage() {
  try {
    if (navigator.storage && navigator.storage.persist) {
      return navigator.storage.persist().then((ok) => !!ok).catch(() => false)
    }
  } catch {
    // abaikan
  }
  return Promise.resolve(false)
}
