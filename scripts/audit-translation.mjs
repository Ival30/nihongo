// Audit cache terjemahan: bedakan arti Indonesia asli vs fallback bahasa Inggris.
// Fallback terjadi saat request gagal — nilai cache sama persis dengan arti EN asli.
import { readFileSync, existsSync } from 'node:fs'

const LEVELS = ['n4', 'n3', 'n2', 'n1']

for (const lvl of LEVELS) {
  const vocab = (await import(`../src/data/vocab/${lvl}.js`)).default
  const cachePath = `.cache-data/translation/${lvl}.id.json`
  if (!existsSync(cachePath)) {
    console.log(`${lvl}: cache TIDAK ADA`)
    continue
  }
  const cache = JSON.parse(readFileSync(cachePath, 'utf8'))

  let translated = 0, fallback = 0, missing = 0
  for (const it of vocab) {
    const v = cache[it.jp]
    if (v === undefined || v === null) { missing++; continue }
    // fallback = identik dengan arti EN asli
    if (v === it.meaning) fallback++
    else translated++
  }

  const total = vocab.length
  console.log(
    `${lvl}: total ${total} | diterjemahkan ${translated} (${((translated / total) * 100).toFixed(0)}%) | fallback-EN ${fallback} | belum ada ${missing}`,
  )
}
