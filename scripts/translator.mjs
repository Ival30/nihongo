// Klien terjemahan EN → ID memakai endpoint publik Google Translate
// (client=dict-chrome-ex) yang tidak butuh API key.
// Penggunaan internal oleh script translate-*.

const BASE = 'https://translate.googleapis.com/translate_a/single'

export async function translateEnId(text) {
  const url = `${BASE}?client=dict-chrome-ex&sl=en&tl=id&dt=t&q=${encodeURIComponent(text)}`
  const res = await fetch(url)
  if (!res.ok) {
    const e = new Error(`HTTP ${res.status}`)
    e.retryable = res.status === 429 || res.status >= 500
    throw e
  }
  const j = await res.json()
  const out = (j[0] || []).map((seg) => seg[0]).join('')
  if (!out) throw new Error('terjemahan kosong')
  return out
}

export async function translateJaId(text) {
  const url = `${BASE}?client=dict-chrome-ex&sl=ja&tl=id&dt=t&q=${encodeURIComponent(text)}`
  const res = await fetch(url)
  if (!res.ok) {
    const e = new Error(`HTTP ${res.status}`)
    e.retryable = res.status === 429 || res.status >= 500
    throw e
  }
  const j = await res.json()
  const out = (j[0] || []).map((seg) => seg[0]).join('')
  if (!out) throw new Error('terjemahan kosong')
  return out
}

export function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}
