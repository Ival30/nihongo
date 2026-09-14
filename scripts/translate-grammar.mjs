// Pipeline terjemahan tata bahasa Inggris → Indonesia via Google Translate (publik, tanpa key).
// Menerjemahkan: meaning, formation, dan tiap contoh .en.
// Cache inkremental per level, aman resume, tanpa mencemari cache saat gagal.
//
// Penggunaan:
//   node scripts/translate-grammar.mjs [level...]

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { translateEnId, sleep } from './translator.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const DATA_DIR = join(ROOT, 'src', 'data', 'grammar')
const CACHE_DIR = join(ROOT, '.cache-data', 'grammar-translation')
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
    const grammar = (await import(join(DATA_DIR, `${lvl}.js`))).default
    const cachePath = join(CACHE_DIR, `${lvl}.id.json`)
    const cache = existsSync(cachePath) ? JSON.parse(readFileSync(cachePath, 'utf8')) : {}

    // Bangun unit teks yang perlu diterjemahkan
    const units = []
    grammar.forEach((g, gi) => {
      if (g.meaning && !cache[`m${gi}`]) units.push({ key: `m${gi}`, text: g.meaning })
      if (g.formation && !cache[`f${gi}`]) units.push({ key: `f${gi}`, text: g.formation })
      ;(g.examples || []).forEach((ex, ei) => {
        if (ex.en && !cache[`e${gi}_${ei}`]) units.push({ key: `e${gi}_${ei}`, text: ex.en })
      })
    })

    console.log(`\n[${lvl}] ${grammar.length} pola, ${units.length} unit teks`)
    let done = 0, failed = 0

    for (let i = 0; i < units.length; i++) {
      const { key, text } = units[i]
      try {
        const result = await translateWithRetry(text)
        if (result && result !== text) { cache[key] = result; done++ }
        else cache[key] = text
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
    console.log(`[${lvl}] selesai: +${done} baru, ${failed} gagal`)
    emitGrammar(lvl, grammar, cache)
  }
  console.log('\nSelesai.')
}

function emitGrammar(lvl, grammar, cache) {
  const result = grammar.map((g, gi) => {
    const examples = (g.examples || []).map((ex, ei) => ({
      jp: ex.jp,
      romaji: ex.romaji,
      en: ex.en,
      id: cache[`e${gi}_${ei}`] || null,
    }))
    return {
      pattern: g.pattern,
      meaning: g.meaning,
      meaningId: cache[`m${gi}`] || null,
      formation: g.formation,
      formationId: cache[`f${gi}`] || null,
      examples,
    }
  })
  const outPath = join(DATA_DIR, `${lvl}.id.js`)
  writeFileSync(outPath, `// Tata bahasa + terjemahan Indonesia (otomatis via Google Translate).\nexport default ${JSON.stringify(result)}\n`)
  console.log(`  → ${outPath}`)
}

main().catch((e) => {
  console.error('GAGAL:', e.message)
  process.exit(1)
})
