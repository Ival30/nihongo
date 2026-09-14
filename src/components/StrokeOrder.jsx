import { useEffect, useRef, useState } from 'react'
import { loadStrokes } from '../data/strokes-loader.js'

// Animasi urutan goresan kanji (data KanjiVG).
// Goresan digambar berurutan memakai animasi stroke-dasharray.
export default function StrokeOrder({ char, size = 180, autoPlay = true }) {
  const [paths, setPaths] = useState(null)
  const [done, setDone] = useState(0)
  const [playing, setPlaying] = useState(autoPlay)
  const [speed, setSpeed] = useState(1)
  const timer = useRef(null)
  const svgRef = useRef(null)

  const total = paths ? paths.length : 0

  // Muat data goresan saat karakter berubah
  useEffect(() => {
    let alive = true
    loadStrokes().then((all) => { if (alive) setPaths(all[char] || null) })
    return () => { alive = false }
  }, [char])

  // Ulang animasi saat karakter berganti
  useEffect(() => {
    setDone(0)
    setPlaying(autoPlay)
  }, [char, autoPlay])

  // Majukan goresan satu per satu
  useEffect(() => {
    if (!playing || !total) return
    if (done >= total) { setPlaying(false); return }
    timer.current = setTimeout(() => setDone((d) => d + 1), 700 / speed)
    return () => clearTimeout(timer.current)
  }, [playing, done, total, speed])

  if (!paths) {
    return (
      <div className="stroke-missing">
        <div className="stroke-char-placeholder jp">{char}</div>
        <p className="sub">Data urutan goresan belum tersedia.</p>
      </div>
    )
  }

  const replay = () => { setDone(0); setPlaying(true) }

  return (
    <div className="stroke-order">
      <svg
        ref={svgRef}
        viewBox="0 0 109 109"
        width={size}
        height={size}
        className="stroke-svg"
        role="img"
        aria-label={`Urutan goresan ${char}`}
      >
        <rect x="0" y="0" width="109" height="109" fill="none" />
        {/* panduan grid */}
        <line x1="54.5" y1="0" x2="54.5" y2="109" stroke="var(--border)" strokeWidth="0.5" strokeDasharray="4 4" />
        <line x1="0" y1="54.5" x2="109" y2="54.5" stroke="var(--border)" strokeWidth="0.5" strokeDasharray="4 4" />
        {paths.map((d, i) => {
          const visible = i < done
          return (
            <path
              key={i}
              d={d}
              fill="none"
              stroke={i === done - 1 ? 'var(--accent)' : 'var(--ink)'}
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                opacity: visible ? 1 : 0.08,
                transition: 'opacity 0.18s ease',
              }}
            />
          )
        })}
        {/* nomor urut goresan yang sudah tampil */}
        {paths.map((d, i) => {
          if (i >= done) return null
          const m = d.match(/M\s*([\d.]+)[,\s]+([\d.]+)/)
          if (!m) return null
          return (
            <text key={`n${i}`} x={Number(m[1])} y={Number(m[2])} className="stroke-num">
              {i + 1}
            </text>
          )
        })}
      </svg>

      <div className="stroke-controls">
        <button className="btn ghost" onClick={replay}>Ulangi</button>
        <button className="btn ghost" onClick={() => setPlaying((p) => !p)}>
          {playing ? 'Jeda' : 'Lanjut'}
        </button>
        <button className="btn ghost" onClick={() => setSpeed((s) => (s === 1 ? 0.5 : 1))}>
          {speed === 1 ? 'Lambat' : 'Normal'}
        </button>
        <span className="stroke-count">{done} / {total} goresan</span>
      </div>
    </div>
  )
}
