// Mesin SRS (Spaced Repetition System) berbasis algoritma SM-2 sederhana.
// Setiap kartu menyimpan: interval (hari), ease factor, next review date, repetitions.

const STORAGE_KEY = 'nihongo_srs_v1'
const PROGRESS_KEY = 'nihongo_progress_v1'

export function loadSRS() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}
  } catch {
    return {}
  }
}

export function saveSRS(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

// Buat ID unik untuk kartu berdasarkan tipe + konten
function cardId(type, content) {
  return `${type}:${content}`
}

// Nilai default kartu baru
function newCard() {
  return { interval: 0, ease: 2.5, reps: 0, due: Date.now() }
}

// Jadwal interval SM-2
function sm2(card, quality) {
  // quality: 0-5 (0 salah, 3 sulit, 4 bagus, 5 mudah)
  const next = { ...card }
  if (quality < 3) {
    // gagal — ulangi dari awal
    next.reps = 0
    next.interval = 0
    next.due = Date.now() + 10 * 60 * 1000 // 10 menit lagi
  } else {
    next.reps = card.reps + 1
    if (next.reps === 1) next.interval = 1
    else if (next.reps === 2) next.interval = 6
    else next.interval = Math.round(card.interval * card.ease)

    // update ease factor
    next.ease = Math.max(
      1.3,
      card.ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)),
    )
    next.due = Date.now() + next.interval * 24 * 60 * 60 * 1000
  }
  return next
}

// Dapatkan kartu yang harus direview (due <= sekarang), diurutkan paling lama
export function getDueCards(data, limit = 20) {
  const now = Date.now()
  return Object.entries(data)
    .filter(([, c]) => c.due <= now)
    .sort((a, b) => a[1].due - b[1].due)
    .slice(0, limit)
    .map(([id, c]) => ({ id, ...c }))
}

// Statistik SRS
export function getSRSStats(data) {
  const now = Date.now()
  const all = Object.values(data)
  const due = all.filter((c) => c.due <= now).length
  const learning = all.filter((c) => c.reps < 3).length
  const mature = all.filter((c) => c.reps >= 3).length
  return { total: all.length, due, learning, mature }
}

// Terapkan hasil review pada satu kartu
export function reviewCard(data, id, quality) {
  const current = data[id] || newCard()
  const updated = sm2(current, quality)
  return { ...data, [id]: updated }
}

// Tambah kartu baru ke antrian (belum pernah dipelajari)
// meta opsional menyimpan data tampilan (reading, meaning, contoh, dll.)
export function addCard(data, type, content, meta = {}) {
  const id = cardId(type, content)
  if (data[id]) {
    // update meta jika ada info baru
    return { ...data, [id]: { ...data[id], meta: { ...data[id].meta, ...meta } } }
  }
  return { ...data, [id]: { ...newCard(), meta } }
}

export function addCards(data, type, items, metaFn) {
  let next = data
  for (const it of items) {
    const content = metaFn ? metaFn(it).content : it
    const meta = metaFn ? metaFn(it).meta : {}
    next = addCard(next, type, content, meta)
  }
  return next
}

// ---------- Progress tracking ----------

export function loadProgress() {
  try {
    return JSON.parse(localStorage.getItem(PROGRESS_KEY)) || {}
  } catch {
    return {}
  }
}

export function saveProgress(data) {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(data))
}

// Struktur progress:
// {
//   items: { vocab: { 'わたし': { seen, correct, wrong } }, grammar: {...}, kanji: {...} },
//   summary: { n5: { vocab: { seen, mastered }, grammar: {...}, kanji: {...} }, ... },
//   quiz: { n5: { best, last, attempts, total } }
// }

export function recordItemProgress(data, type, key, levelId, isCorrect) {
  const next = JSON.parse(JSON.stringify(data))
  if (!next.items) next.items = {}
  if (!next.items[type]) next.items[type] = {}
  if (!next.summary) next.summary = {}
  if (!next.summary[levelId]) next.summary[levelId] = {}
  if (!next.summary[levelId][type]) next.summary[levelId][type] = { seen: 0, mastered: 0 }

  const cur = next.items[type][key] || { seen: false, correct: 0, wrong: 0, learned: false }
  const wasLearned = !!cur.learned
  const prevCorrect = cur.correct
  cur.seen = true
  // "Tahu" → dipelajari; "Belum" → belum dipelajari
  cur.learned = isCorrect
  if (isCorrect) cur.correct += 1
  else cur.wrong += 1
  next.items[type][key] = cur

  const sum = next.summary[levelId][type]
  // seen = jumlah materi yang sedang "dipelajari" (learned)
  if (isCorrect && !wasLearned) sum.seen += 1
  if (!isCorrect && wasLearned) sum.seen = Math.max(0, sum.seen - 1)
  // mastered = baru mencapai benar >= 2
  if (isCorrect && prevCorrect < 2 && cur.correct >= 2) sum.mastered += 1

  return next
}

export function recordQuizProgress(data, levelId, score, total) {
  const next = JSON.parse(JSON.stringify(data))
  if (!next.quiz) next.quiz = {}
  const cur = next.quiz[levelId] || { best: 0, attempts: 0, last: 0, total }
  cur.attempts += 1
  cur.last = score
  cur.total = total
  cur.best = Math.max(cur.best, score)
  next.quiz[levelId] = cur
  return next
}

// Ambil ringkasan progres per level (tanpa perlu memuat data item).
export function getSummary(progress) {
  return progress.summary || {}
}
