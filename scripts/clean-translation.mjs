// Bersihkan cache terjemahan: hapus entri fallback (nilai cache == arti EN asli),
// karena itu bukan terjemahan — hanya pencemaran saat request gagal (HTTP 429).
import { readFileSync, writeFileSync, existsSync } from 'node:fs'

const LEVELS = ['n4', 'n3', 'n2', 'n1']

for (const lvl of LEVELS) {
  const vocabPath = `src/data/vocab/${lvl}.js`
  const cachePath = `.cache-data/translation/${lvl}.id.json`
  const outPath = `src/data/vocab/${lvl}.id.js`
  if (!existsSync(cachePath)) { console.log(`${lvl}: tidak ada cache, lewati`); continue }

  const vocab = (await import(`../src/data/vocab/${lvl}.js`)).default
  const cache = JSON.parse(readFileSync(cachePath, 'utf8'))
  const meaningMap = new Map(vocab.map((it) => [it.jp, it.meaning]))

  let removed = 0, kept = 0
  const clean = {}
  for (const [jp, val] of Object.entries(cache)) {
    if (val === meaningMap.get(jp)) { removed++ } // fallback EN
    else { clean[jp] = val; kept++ }
  }

  // Tulis cache bersih + emit modul JS hanya dengan terjemahan asli
  writeFileSync(cachePath, JSON.stringify(clean))
  writeFileSync(outPath, `// Arti Indonesia (otomatis via MyMemory).\nexport default ${JSON.stringify(clean)}\n`)
  console.log(`${lvl}: dipertahankan ${kept}, dihapus fallback ${removed}`)
}
console.log('Selesai.')
