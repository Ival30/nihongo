// Bangun furigana untuk contoh kalimat kosakata memakai Kuromoji.
// Hasil: src/data/vocab/{n5..n1}.examples-furi.js → { "kata": "contoh《dengan》furigana" }
// Penggunaan: node scripts/build-example-furigana.mjs [n5 n4 n3 n2 n1]
import { writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import kuromoji from 'kuromoji'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

const KANJI = /[\u4e00-\u9faf\u3400-\u4dbf]/
const kataToHira = (s) => s.replace(/[\u30a1-\u30f6]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60))

function makeAnnotate(tokenizer) {
  return function annotate(text) {
    const tokens = tokenizer.tokenize(text)
    let out = ''
    for (const t of tokens) {
      const s = t.surface_form
      const r = t.reading || t.pronunciation
      if (!KANJI.test(s) || !r || r === '*' || t.reading === undefined) {
        out += s
        continue
      }
      const hira = kataToHira(r)
      let kanaTail = ''
      let si = s.length - 1
      let ri = hira.length - 1
      while (si >= 0 && ri >= 0 && !KANJI.test(s[si]) && s[si] === hira[ri]) {
        kanaTail = s[si] + kanaTail
        si--
        ri--
      }
      const kanjiPart = s.slice(0, si + 1)
      const readingPart = hira.slice(0, ri + 1)
      if (!KANJI.test(kanjiPart)) {
        out += s
      } else if (readingPart) {
        out += `${kanjiPart}《${readingPart}》${kanaTail}`
      } else {
        out += `${s}《${hira}》`
      }
    }
    return out
  }
}

const levels = process.argv.slice(2).length ? process.argv.slice(2) : ['n5', 'n4', 'n3', 'n2', 'n1']

kuromoji.builder({ dicPath: join(ROOT, 'node_modules/kuromoji/dict') }).build(async (err, tokenizer) => {
  if (err) { console.error(err); process.exit(1) }
  const annotate = makeAnnotate(tokenizer)
  for (const lvl of levels) {
    const mod = await import(join(ROOT, `src/data/vocab/${lvl}.examples.js`))
    const examples = mod.default || {}
    const keys = Object.keys(examples)
    // kumpulkan kalimat unik agar tokenisasi hemat
    const uniq = new Map()
    for (const k of keys) {
      const ex = examples[k]?.example
      if (ex && !uniq.has(ex)) uniq.set(ex, annotate(ex))
    }
    const mapped = {}
    for (const k of keys) {
      const ex = examples[k]?.example
      if (ex) mapped[k] = uniq.get(ex)
    }
    const out = join(ROOT, `src/data/vocab/${lvl}.examples-furi.js`)
    writeFileSync(out, `// Furigana contoh kalimat kosakata ${lvl.toUpperCase()} (dibangkitkan Kuromoji). Format: 漢字《かな》\nexport default ${JSON.stringify(mapped)}\n`)
    console.log(`[${lvl}] ${keys.length} kata, ${uniq.size} kalimat unik → ${out}`)
  }
})
