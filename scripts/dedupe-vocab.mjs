// Hapus entri kosakata duplikat (jp sama) di tiap level.
// Menjaga entri pertama, membuang kemunculan berikutnya.
//
// Penggunaan: node scripts/dedupe-vocab.mjs
import { readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

for (const lvl of ['n5', 'n4', 'n3', 'n2', 'n1']) {
  const path = join(ROOT, `src/data/vocab/${lvl}.js`)
  const src = readFileSync(path, 'utf8')
  const m = src.match(/export default (\[.*\])\s*$/s)
  if (!m) { console.log(`${lvl}: format tidak dikenali, dilewati`); continue }
  const items = JSON.parse(m[1])

  const seen = new Set()
  const out = []
  for (const it of items) {
    if (seen.has(it.jp)) continue
    seen.add(it.jp)
    out.push(it)
  }
  if (out.length === items.length) {
    console.log(`${lvl}: tidak ada duplikat (${items.length})`)
    continue
  }
  writeFileSync(path, `// Kosakata JLPT ${lvl.toUpperCase()} (sumber: JMDict via jlpt-word-list).\nexport default ${JSON.stringify(out)}\n`)
  console.log(`${lvl}: ${items.length} → ${out.length} (buang ${items.length - out.length} duplikat)`)
}
