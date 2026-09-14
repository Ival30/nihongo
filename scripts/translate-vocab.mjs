// Pipeline terjemahan kosakata Inggris → Indonesia via Google Translate (publik, tanpa key).
// Cache inkremental per level, aman resume, tanpa mencemari cache saat gagal.
//
// Penggunaan:
//   node scripts/translate-vocab.mjs [level...]

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { translateEnId, sleep } from './translator.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const DATA_DIR = join(ROOT, 'src', 'data', 'vocab')
const CACHE_DIR = join(ROOT, '.cache-data', 'translation')
mkdirSync(CACHE_DIR, { recursive: true })

const LEVELS = ['n5', 'n4', 'n3', 'n2', 'n1']
const targets = process.argv.slice(2).filter((a) => LEVELS.includes(a))
const selected = targets.length ? targets : LEVELS

const DELAY_MS = 250
const MAX_RETRIES = 5

async function translateWithRetry(text) {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await translateEnId(text)
    } catch (e) {
      if (!e.retryable || attempt === MAX_RETRIES) throw e
      const wait = Math.min(500 * Math.pow(2, attempt), 20000)
      await sleep(wait)
    }
  }
}

async function main() {
  for (const lvl of selected) {
    const vocab = (await import(join(DATA_DIR, `${lvl}.js`))).default
    const cachePath = join(CACHE_DIR, `${lvl}.id.json`)
    const cache = existsSync(cachePath) ? JSON.parse(readFileSync(cachePath, 'utf8')) : {}

    console.log(`\n[${lvl}] ${vocab.length} kata (${Object.keys(cache).length} di cache)`)
    let done = 0, failed = 0

    for (let i = 0; i < vocab.length; i++) {
      const item = vocab[i]
      const key = item.jp
      if (cache[key] && cache[key] !== item.meaning) continue

      try {
        const result = await translateWithRetry(item.meaning)
        cache[key] = result && result !== item.meaning ? result : item.meaning
        if (result && result !== item.meaning) done++
      } catch (e) {
        console.error(`  ✗ "${key}" gagal: ${e.message}`)
        failed++
      }

      if ((done + failed) % 100 === 0) {
        writeFileSync(cachePath, JSON.stringify(cache))
        console.log(`  … +${done} diterjemahkan, ${failed} gagal`)
      }
      await sleep(DELAY_MS)
    }

    writeFileSync(cachePath, JSON.stringify(cache))
    // Emit modul JS hanya dengan terjemahan asli
    const clean = {}
    const meaningMap = new Map(vocab.map((it) => [it.jp, it.meaning]))
    for (const [jp, val] of Object.entries(cache)) {
      if (val !== meaningMap.get(jp)) clean[jp] = val
    }
    const outJs = join(DATA_DIR, `${lvl}.id.js`)
    writeFileSync(outJs, `// Arti Indonesia (otomatis via Google Translate).\nexport default ${JSON.stringify(clean)}\n`)
    console.log(`[${lvl}] selesai: +${done} baru, ${failed} gagal → ${outJs}`)
  }
  console.log('\nSelesai.')
}

main().catch((e) => {
  console.error('GAGAL:', e.message)
  process.exit(1)
})
