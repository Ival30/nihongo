// Urutkan kosakata JLPT berdasarkan frekuensi pemakaian nyata.
// Sumber frekuensi: OpenSubtitles (30k kata terurut) + fallback ke urutan asli.
//
// Menghasilkan file urutan: src/data/vocab-order.js
//   { n5: ['私', '人', ...], n4: [...], ... }
//
// Penggunaan: node scripts/build-vocab-order.mjs
import { writeFileSync, readFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const FREQ_FILE = '/tmp/ja_freq.csv'

if (!existsSync(FREQ_FILE)) {
  console.error('File frekuensi tidak ada:', FREQ_FILE)
  process.exit(1)
}

// Bangun peta frekuensi: kata → peringkat (1 = paling sering)
const freq = {}
let rank = 0
for (const line of readFileSync(FREQ_FILE, 'utf8').split('\n').slice(1)) {
  const word = line.split(',')[0]
  if (!word) continue
  rank++
  if (freq[word] === undefined) freq[word] = rank
}
console.log(`peta frekuensi: ${Object.keys(freq).length} kata`)

const LEVELS = ['n5', 'n4', 'n3', 'n2', 'n1']
const order = {}
let totalRanked = 0
let totalWords = 0

for (const lvl of LEVELS) {
  const vocab = (await import(join(ROOT, `src/data/vocab/${lvl}.js`))).default
  totalWords += vocab.length
  // Urutkan: yang punya peringkat frekuensi dulu (naik), lalu sisanya urutan asli
  const indexed = vocab.map((v, i) => ({ jp: v.jp, i, rank: freq[v.jp] ?? Infinity }))
  indexed.sort((a, b) => (a.rank - b.rank) || (a.i - b.i))
  order[lvl] = indexed.map((x) => x.jp)
  const ranked = indexed.filter((x) => x.rank !== Infinity).length
  totalRanked += ranked
  console.log(`${lvl}: ${ranked}/${vocab.length} kata punya data frekuensi`)
}

const out = join(ROOT, 'src/data/vocab-order.js')
writeFileSync(out, `// Urutan kosakata berdasarkan frekuensi pemakaian nyata (OpenSubtitles).\nexport const vocabOrder = ${JSON.stringify(order)}\n`)
console.log(`\ntotal: ${totalRanked}/${totalWords} kata terurut berdasarkan frekuensi`)
console.log(`→ ${out}`)
