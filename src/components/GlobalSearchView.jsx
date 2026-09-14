import { useState, useMemo, useEffect } from 'react'
import { levels } from '../data/levels.js'
import { loadLevelData } from '../data/index.js'
import SpeakButton from './SpeakButton.jsx'

// Pencarian global: cari kosakata di semua tingkat sekaligus.
export default function GlobalSearchView({ onOpenLevel }) {
  const [q, setQ] = useState('')
  const [all, setAll] = useState(null)
  const [loading, setLoading] = useState(false)

  // Muat seluruh level sekali (dipakai untuk pencarian lintas tingkat)
  useEffect(() => {
    let alive = true
    setLoading(true)
    Promise.all(levels.map((l) => loadLevelData(l.id))).then((arr) => {
      if (!alive) return
      setAll(arr.map((d, i) => ({ level: levels[i], vocab: d.vocab })))
      setLoading(false)
    })
    return () => { alive = false }
  }, [])

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!needle || !all) return []
    const out = []
    for (const { level, vocab } of all) {
      for (const v of vocab) {
        const hay = (v.jp + v.reading + v.meaning + (v.meaningId || '')).toLowerCase()
        if (hay.includes(needle)) out.push({ ...v, level })
        if (out.length >= 200) return out
      }
    }
    return out
  }, [q, all])

  return (
    <div>
      <div className="page-header">
        <h1>Cari</h1>
        <p>Cari kata di seluruh tingkat N5–N1 sekaligus.</p>
      </div>

      <input
        className="search"
        placeholder="Ketik kata Jepang, cara baca, atau arti…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        autoFocus
      />

      {loading && <p className="sub">Memuat seluruh materi…</p>}
      {!loading && !q.trim() && <p className="sub">Ketik untuk mulai mencari.</p>}
      {!loading && q.trim() && results.length === 0 && <p className="sub">Tidak ada hasil untuk "{q}".</p>}
      {!loading && results.length > 0 && (
        <p className="sub" style={{ marginBottom: 12 }}>{results.length} hasil{results.length >= 200 ? ' (maksimal)' : ''}</p>
      )}

      <div className="list">
        {results.map((item, i) => (
          <div className="item" key={i}>
            <div className="item-head">
              <span className="jp-main jp">{item.jp}</span>
              <span className="reading jp">{item.reading}</span>
              <SpeakButton text={item.jp} label={item.jp} />
              <span className="meaning">{item.meaningId || item.meaning}</span>
            </div>
            <div className="item-actions">
              <button
                className="mini-btn"
                onClick={() => onOpenLevel(item.level.id, 'vocab')}
              >
                Buka di {item.level.name}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
