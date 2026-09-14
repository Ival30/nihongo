// Unduh data urutan goresan (stroke order) dari KanjiVG untuk kanji N5 & N4.
// KanjiVG: SVG berlisensi CC BY-SA 3.0. Tiap stroke punya <path> berurut.
//
// Hasil: src/data/strokes.js → { '一': ['M...', 'M...'], ... }
//
// Penggunaan: node scripts/fetch-strokes.mjs [level...]
import { writeFileSync, existsSync, readFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const BASE = 'https://raw.githubusercontent.com/KanjiVG/kanjivg/master/kanji'
const CACHE = join(ROOT, '.cache-data/strokes')
mkdirSync(CACHE, { recursive: true })

const LEVELS = ['n5', 'n4', 'n3', 'n2', 'n1']
const selected = process.argv.slice(2).filter((a) => LEVELS.includes(a))
const levels = selected.length ? selected : ['n5', 'n4']

const STROKE_RE = /<path[^>]*\sd="([^"]+)"/g

async function fetchStrokes(ch) {
  const code = ch.codePointAt(0).toString(16).padStart(5, '0')
  const res = await fetch(`${BASE}/${code}.svg`)
  if (!res.ok) return null
  const svg = await res.text()
  const paths = []
  let m
  STROKE_RE.lastIndex = 0
  while ((m = STROKE_RE.exec(svg)) !== null) {
    // hanya path goresan (abaikan path nomor urut yang punya id "kvg:StrokeNumbers")
    if (!m[0].includes('StrokeNumbers')) paths.push(m[1])
  }
  return paths.length ? paths : null
}

const out = {}
let ok = 0, miss = 0

for (const lvl of levels) {
  const kanji = (await import(join(ROOT, `src/data/kanji/${lvl}.js`))).default
  console.log(`\n[${lvl}] ${kanji.length} kanji`)
  for (const k of kanji) {
    if (out[k.char]) { ok++; continue }
    const cached = join(CACHE, `${k.char.codePointAt(0).toString(16)}.json`)
    let paths = null
    if (existsSync(cached)) {
      paths = JSON.parse(readFileSync(cached, 'utf8'))
    } else {
      try {
        paths = await fetchStrokes(k.char)
        writeFileSync(cached, JSON.stringify(paths))
      } catch { paths = null }
    }
    if (paths) { out[k.char] = paths; ok++ } else { miss++ }
    await new Promise((r) => setTimeout(r, 60))
  }
  console.log(`  ok: ${ok}, tidak ada: ${miss}`)
}

const outPath = join(ROOT, 'src/data/strokes.js')
const header = '// Urutan goresan kanji dari KanjiVG (kanjivg.tagaini.net, CC BY-SA 3.0).\n'
writeFileSync(outPath, `${header}export const strokes = ${JSON.stringify(out)}\n`)
console.log(`\ntotal ${ok} kanji berdata, ${miss} tanpa data\n→ ${outPath}`)
