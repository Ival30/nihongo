// Bangun contoh kalimat + terjemahan Indonesia untuk kosakata JLPT.
// Dua sumber berlapis:
//   1. hanabira.org — kalimat bersih ber-romaji+audio, ter-key per kata (kata kerja/sifat).
//   2. Tatoeba jpn_indices.csv — fallback untuk kata lain (dengan filter ketat).
// Terjemahan contoh: Google Translate ja→id (endpoint publik).
//
// Output: src/data/vocab/<level>.examples.js  (map jp -> { example, exampleId, romaji })
//
// Penggunaan:
//   node scripts/build-vocab-examples.mjs [level...]

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { translateJaId, sleep } from './translator.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const DATA_DIR = join(ROOT, 'src', 'data', 'vocab')
const CACHE_DIR = join(ROOT, '.cache-data', 'examples')
mkdirSync(CACHE_DIR, { recursive: true })

const TATOEBA = '/tmp/jpn_indices.csv'
const HANABIRA_FILES = [
  'https://raw.githubusercontent.com/tristcoil/hanabira.org/main/backend/express/json_data/sentences_600_verbs_book_0001.json',
  'https://raw.githubusercontent.com/tristcoil/hanabira.org/main/backend/express/json_data/sentences_600_suru_verbs_book_0001.json',
  'https://raw.githubusercontent.com/tristcoil/hanabira.org/main/backend/express/json_data/sentences_N3_tango_verbs_0001.json',
  'https://raw.githubusercontent.com/tristcoil/hanabira.org/main/backend/express/json_data/sentences_N3_tango_i-adjectives_0001.json',
  'https://raw.githubusercontent.com/tristcoil/hanabira.org/main/backend/express/json_data/sentences_N3_tango_na-adjectives_0001.json',
]

const LEVELS = ['n5', 'n4', 'n3', 'n2', 'n1']
const targets = process.argv.slice(2).filter((a) => LEVELS.includes(a))
const selected = targets.length ? targets : LEVELS

// Kanji arkais yang bikin kalimat Tatoeba terlihat aneh utk pemula
const ARCHAIC = '為其迄或此又然且吾汝我彼是乃之乎耳矣哉兮矣'

function cleanTatoeba(text) {
  let s = text
  s = s.replace(/\(#[0-9]+\)/g, '')
  s = s.replace(/\[[0-9]+\]/g, '')
  s = s.replace(/\{([^}]*)\}/g, '')
  s = s.replace(/\(([^)]*)\)/g, '')
  s = s.replace(/~/g, '')
  s = s.replace(/\s+/g, '')
  return s.trim()
}

// --- Sumber 1: hanabira ---
async function loadHanabira() {
  const map = new Map() // key -> { example, romaji }
  for (const url of HANABIRA_FILES) {
    try {
      const res = await fetch(url)
      if (!res.ok) continue
      const data = await res.json()
      for (const it of data) {
        const key = (it.key || '').trim()
        const jp = (it.sentence_original || '').trim()
        const romaji = (it.sentence_romaji || '').trim()
        if (!key || !jp) continue
        // pilih kalimat terpendek per kata
        const cur = map.get(key)
        if (!cur || jp.length < cur.example.length) map.set(key, { example: jp, romaji })
      }
    } catch (e) {
      console.error('  gagal unduh hanabira:', url, e.message)
    }
  }
  return map
}

// --- Sumber 2: Tatoeba ---
function loadTatoeba() {
  if (!existsSync(TATOEBA)) return []
  const lines = readFileSync(TATOEBA, 'utf8').split('\n')
  const out = []
  for (const line of lines) {
    const cols = line.split('\t')
    if (cols.length < 3) continue
    const jp = cleanTatoeba(cols[2])
    if (!jp) continue
    if (jp.length < 5 || jp.length > 18) continue
    if ([...jp].some((ch) => ARCHAIC.includes(ch))) continue
    if (/[A-Za-z0-9]/.test(jp)) continue
    out.push(jp)
  }
  return out
}

function findTatoebaExample(word, tatoeba, usedSet) {
  // Prioritas 1: cocok kata utuh (dibatasi non-kana, jadi 赤 tidak cocok 赤ちゃん)
  for (const s of tatoeba) {
    if (s.includes(word) && !usedSet.has(s) && isGoodMatch(s, word)) return s
  }
  // Prioritas 2: stem verba (buang akhiran) — hanya jika kata adalah verba
  const stem = word.replace(/[るうくぐすつぬぶむ]$/, '')
  if (stem.length >= 1 && stem !== word) {
    for (const s of tatoeba) {
      if (s.includes(stem) && !usedSet.has(s)) return s
    }
  }
  return null
}

// Pastikan kata tidak muncul sebagai bagian dari kata yang lebih panjang.
// 赤 (aka) tidak boleh cocok 赤ちゃん (akachan). Cek karakter setelah kata:
// jika masih kanji/kana dan bukan partikel/akhiran umum, anggap bukan cocok utuh.
function isGoodMatch(sentence, word) {
  const idx = sentence.indexOf(word)
  if (idx === -1) return true
  const after = sentence[idx + word.length]
  if (!after) return true
  // batas kata alami: partikel, tanda baca, atau akhir kalimat
  const BOUNDARY = /[はがをにでとものやかへ、。！？]/
  return BOUNDARY.test(after)
}

async function main() {
  console.log('Memuat sumber kalimat…')
  const hanabira = await loadHanabira()
  console.log(`  hanabira: ${hanabira.size} kata bercontoh`)
  const tatoeba = loadTatoeba()
  console.log(`  tatoeba: ${tatoeba.length} kalimat bersih\n`)

  for (const lvl of selected) {
    const vocab = (await import(join(DATA_DIR, `${lvl}.js`))).default
    const cachePath = join(CACHE_DIR, `${lvl}.json`)
    const cache = existsSync(cachePath) ? JSON.parse(readFileSync(cachePath, 'utf8')) : {}

    console.log(`\n[${lvl}] ${vocab.length} kata`)
    const usedSet = new Set()
    let fromHanabira = 0, fromTatoeba = 0, noExample = 0, failed = 0

    for (let i = 0; i < vocab.length; i++) {
      const item = vocab[i]
      const key = item.jp
      if (cache[key] && cache[key].example) { usedSet.add(cache[key].example); continue }

      let example = null
      let romaji = null
      let source = null

      // 1) hanabira
      const h = hanabira.get(key)
      if (h) { example = h.example; romaji = h.romaji; source = 'hanabira' }

      // 2) tatoeba fallback
      if (!example) {
        const t = findTatoebaExample(key, tatoeba, usedSet)
        if (t) { example = t; source = 'tatoeba' }
      }

      if (!example) {
        cache[key] = { example: null }
        noExample++
      } else {
        usedSet.add(example)
        try {
          const exampleId = await translateJaId(example)
          cache[key] = { example, exampleId, romaji }
          if (source === 'hanabira') fromHanabira++
          else fromTatoeba++
        } catch (e) {
          console.error(`  ✗ "${key}" gagal terjemah: ${e.message}`)
          cache[key] = { example, exampleId: null, romaji }
          failed++
        }
      }

      if ((i + 1) % 100 === 0) {
        writeFileSync(cachePath, JSON.stringify(cache))
        console.log(`  … ${i + 1}/${vocab.length} (hanabira ${fromHanabira}, tatoeba ${fromTatoeba}, tanpa ${noExample})`)
      }
      await sleep(180)
    }

    writeFileSync(cachePath, JSON.stringify(cache))
    emitExamples(lvl, vocab, cache)
    console.log(`[${lvl}] selesai: hanabira ${fromHanabira}, tatoeba ${fromTatoeba}, tanpa contoh ${noExample}, gagal ${failed}`)
  }
  console.log('\nSelesai.')
}

function emitExamples(lvl, vocab, cache) {
  const out = {}
  for (const it of vocab) {
    const c = cache[it.jp]
    if (c && c.example) out[it.jp] = { example: c.example, exampleId: c.exampleId, romaji: c.romaji || null }
  }
  const path = join(DATA_DIR, `${lvl}.examples.js`)
  writeFileSync(path, `// Contoh kalimat + terjemahan Indonesia (hanabira + Tatoeba + Google Translate).\nexport default ${JSON.stringify(out)}\n`)
  console.log(`  → ${path}`)
}

main().catch((e) => {
  console.error('GAGAL:', e.message)
  process.exit(1)
})
