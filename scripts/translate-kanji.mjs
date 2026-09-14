// Terjemahkan arti kanji (EN → ID) via Google Translate publik.
// Cache inkremental per level, aman resume.
//
// Penggunaan: node scripts/translate-kanji.mjs [level...]
import { writeFileSync, existsSync, readFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { translateEnId, sleep } from './translator.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const DATA = join(ROOT, 'src/data/kanji')
const CACHE = join(ROOT, '.cache-data/kanji-translation')
mkdirSync(CACHE, { recursive: true })

const LEVELS = ['n5', 'n4', 'n3', 'n2', 'n1']
const selected = process.argv.slice(2).filter((a) => LEVELS.includes(a))
const levels = selected.length ? selected : LEVELS

for (const lvl of levels) {
  const kanji = (await import(join(DATA, `${lvl}.js`))).default
  const cachePath = join(CACHE, `${lvl}.json`)
  const cache = existsSync(cachePath) ? JSON.parse(readFileSync(cachePath, 'utf8')) : {}
  let baru = 0, cached = 0, gagal = 0

  console.log(`\n[${lvl}] ${kanji.length} kanji (${Object.keys(cache).length} di cache)`)
  for (const k of kanji) {
    if (cache[k.char] !== undefined) { cached++; continue }
    try {
      cache[k.char] = await translateEnId(k.meaning)
      baru++
      if (baru % 100 === 0) {
        writeFileSync(cachePath, JSON.stringify(cache))
        console.log(`  … +${baru} diterjemahkan, ${gagal} gagal`)
      }
    } catch (e) {
      gagal++
      if (gagal <= 3) console.log(`  ✗ "${k.char}" gagal: ${e.message}`)
      await sleep(1200)
    }
    await sleep(160)
  }

  writeFileSync(cachePath, JSON.stringify(cache))
  console.log(`[${lvl}] selesai: ${baru} baru, ${cached} dari cache, ${gagal} gagal`)

  const out = join(DATA, `${lvl}.id.js`)
  writeFileSync(out, `// Arti kanji bahasa Indonesia (otomatis via Google Translate).\nexport default ${JSON.stringify(cache)}\n`)
  console.log(`  → ${out}`)
}
console.log('\nSelesai.')
