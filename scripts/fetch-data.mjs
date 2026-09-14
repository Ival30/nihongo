// Pipeline impor data JLPT nyata — menghasilkan file per-level untuk code-splitting.
// Sumber:
//  - Kosakata: elzup/jlpt-word-list (JMDict) — expression,reading,meaning,tags (CSV)
//  - Kanji: Renairisu/jlpt_kanji_json_msgpack (kanjiapi.dev) — meanings, on/kun, stroke_count
//  - Tata bahasa: tristcoil/hanabira.org — title, short_explanation, formation, examples
//
// Output:
//  - src/data/vocab/<level>.js, src/data/grammar/<level>.js, src/data/kanji/<level>.js
//  - src/data/counts.js  (jumlah item per level, ringan)

import { writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const DATA_DIR = join(ROOT, 'src', 'data')
const LEVELS = ['n5', 'n4', 'n3', 'n2', 'n1']

const VOCAB_BASE = 'https://raw.githubusercontent.com/elzup/jlpt-word-list/master/src'
const GRAMMAR_BASE = 'https://raw.githubusercontent.com/tristcoil/hanabira.org/main/backend/express/json_data'
const KANJI_URL = 'https://raw.githubusercontent.com/Renairisu/jlpt_kanji_json_msgpack/main/kanji_jlpt_only.json'

async function fetchText(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
  return res.text()
}

function parseCSVLine(line) {
  const out = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++ }
        else inQuotes = false
      } else cur += ch
    } else {
      if (ch === '"') inQuotes = true
      else if (ch === ',') { out.push(cur); cur = '' }
      else cur += ch
    }
  }
  out.push(cur)
  return out
}

function parseCSV(text) {
  const lines = text.split(/\r?\n/)
  const header = parseCSVLine(lines[0]).map((h) => h.trim())
  const rows = []
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    if (!line.trim()) continue
    const cols = parseCSVLine(line)
    if (cols.length < header.length) continue
    const row = {}
    header.forEach((h, j) => { row[h] = (cols[j] || '').trim() })
    rows.push(row)
  }
  return rows
}

function emitFile(path, exportName, data) {
  const body = JSON.stringify(data)
  const content = `// Data ${exportName} — dihasilkan otomatis (lihat scripts/fetch-data.mjs).\nexport default ${body}\n`
  writeFileSync(path, content)
}

function stripRomaji(title) {
  return title.replace(/\s*\([A-Za-z0-9 ～~/ぁ-ん]*\)\s*$/, '').trim()
}

async function main() {
  console.log('Mengunduh data…')
  const counts = { vocab: {}, grammar: {}, kanji: {} }

  // --- Kosakata ---
  console.log('[1/3] Kosakata (JMDict)')
  mkdirSync(join(DATA_DIR, 'vocab'), { recursive: true })
  for (const lvl of LEVELS) {
    const rows = parseCSV(await fetchText(`${VOCAB_BASE}/${lvl}.csv`))
    const items = []
    const seen = new Set()
    for (const r of rows) {
      const jp = (r.expression || '').trim()
      const meaning = (r.meaning || '').trim()
      if (!jp || !meaning) continue
      // Lewati duplikat (jp sama) — progres & urutan memakai jp sebagai kunci
      if (seen.has(jp)) continue
      seen.add(jp)
      items.push({ jp, reading: (r.reading || jp).trim(), meaning })
    }
    emitFile(join(DATA_DIR, 'vocab', `${lvl}.js`), `vocab-${lvl}`, items)
    counts.vocab[lvl] = items.length
    console.log(`  vocab ${lvl}: ${items.length}`)
  }

  // --- Kanji ---
  console.log('[2/3] Kanji (kanjiapi)')
  mkdirSync(join(DATA_DIR, 'kanji'), { recursive: true })
  const rawKanji = JSON.parse(await fetchText(KANJI_URL))
  const levelKey = { 5: 'n5', 4: 'n4', 3: 'n3', 2: 'n2', 1: 'n1' }
  const kanjiByLevel = { n5: [], n4: [], n3: [], n2: [], n1: [] }
  for (const [char, d] of Object.entries(rawKanji)) {
    const lvl = levelKey[d.jlpt]
    if (!lvl) continue
    kanjiByLevel[lvl].push({
      char,
      on: (d.on_readings || []).join('、') || '—',
      kun: (d.kun_readings || []).join('、') || '—',
      meaning: (d.meanings || []).join(', '),
      strokes: d.stroke_count || 0,
    })
  }
  for (const lvl of LEVELS) {
    kanjiByLevel[lvl].sort((a, b) => (a.strokes || 0) - (b.strokes || 0))
    emitFile(join(DATA_DIR, 'kanji', `${lvl}.js`), `kanji-${lvl}`, kanjiByLevel[lvl])
    counts.kanji[lvl] = kanjiByLevel[lvl].length
    console.log(`  kanji ${lvl}: ${kanjiByLevel[lvl].length}`)
  }

  // --- Tata bahasa ---
  console.log('[3/3] Tata bahasa (hanabira)')
  mkdirSync(join(DATA_DIR, 'grammar'), { recursive: true })
  for (const lvl of LEVELS) {
    const L = lvl.toUpperCase()
    const raw = JSON.parse(await fetchText(`${GRAMMAR_BASE}/grammar_ja_JLPT_${L}_0001.json`))
    const items = (Array.isArray(raw) ? raw : []).map((g) => {
      const examples = (g.examples || []).map((e) => ({
        jp: (e.jp || '').trim(),
        en: (e.en || '').trim(),
        romaji: (e.romaji || '').trim(),
      })).filter((e) => e.jp)
      const first = examples[0] || { jp: '', en: '' }
      return {
        pattern: stripRomaji(g.title || ''),
        meaning: (g.short_explanation || '').trim(),
        formation: (g.formation || '').trim(),
        examples,
        // kompatibilitas mundur (kuis/kartu pakai contoh pertama)
        example: first.jp,
        exampleMeaning: first.en,
      }
    }).filter((g) => g.pattern && g.meaning)
    emitFile(join(DATA_DIR, 'grammar', `${lvl}.js`), `grammar-${lvl}`, items)
    counts.grammar[lvl] = items.length
    console.log(`  grammar ${lvl}: ${items.length} pola`)
  }

  // --- counts ---
  writeFileSync(
    join(DATA_DIR, 'counts.js'),
    `// Jumlah item per level — dihasilkan otomatis.\nexport const counts = ${JSON.stringify(counts, null, 2)}\n`,
  )
  console.log('  → wrote src/data/counts.js')
  console.log('Selesai.')
}

main().catch((e) => {
  console.error('GAGAL:', e.message)
  process.exit(1)
})
