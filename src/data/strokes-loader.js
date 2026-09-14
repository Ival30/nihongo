// Muat data urutan goresan secara dinamis (hanya saat dipakai).
let cache = null

export async function loadStrokes() {
  if (cache) return cache
  const m = await import('./strokes.js')
  cache = m.strokes
  return cache
}
