// Bangun furigana untuk teks bacaan memakai Kuromoji (analisis morfologi Jepang).
// Menghasilkan format 漢字《かな》 yang dipakai komponen RubyText.
//
// Aturan okurigana: bila surface & reading berbagi akhiran kana yang sama,
// akhiran itu dikeluarkan dari ruby. Contoh:
//   食べ(タベ) → 食《た》べ   行き(イキ) → 行《い》き
//
// Penggunaan: node scripts/build-furigana.mjs
import { writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import kuromoji from 'kuromoji'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

const KANJI = /[\u4e00-\u9faf\u3400-\u4dbf]/
const kataToHira = (s) => s.replace(/[\u30a1-\u30f6]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60))

function build(tokenizer) {
  // Ubah satu teks menjadi format 漢字《かな》
  function annotate(text) {
    const tokens = tokenizer.tokenize(text)
    let out = ''
    for (const t of tokens) {
      const s = t.surface_form
      const r = t.reading || t.pronunciation
      // token tanpa kanji → apa adanya
      if (!KANJI.test(s) || !r || r === '*' || t.reading === undefined) {
        out += s
        continue
      }
      const hira = kataToHira(r)
      // Pisahkan okurigana yang sama di akhir surface & reading
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
  return annotate
}

kuromoji.builder({ dicPath: join(ROOT, 'node_modules/kuromoji/dict') }).build(async (err, tokenizer) => {
  if (err) { console.error(err); process.exit(1) }
  const annotate = build(tokenizer)
  const { readings } = await import(join(ROOT, 'src/data/readings.js'))

  const result = {}
  for (const lvl of ['n5', 'n4', 'n3', 'n2', 'n1']) {
    result[lvl] = (readings[lvl] || []).map((r) => ({ id: r.id, textFuri: annotate(r.text) }))
    console.log(`${lvl}: ${result[lvl].length} bacaan`)
  }

  const out = join(ROOT, 'src/data/readings-furigana.js')
  writeFileSync(out, `// Furigana bacaan (dibangkitkan dengan Kuromoji). Format: 漢字《かな》\nexport const readingsFurigana = ${JSON.stringify(result)}\n`)
  console.log(`→ ${out}`)
})
