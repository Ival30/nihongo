import { useState, useMemo, useCallback, useEffect } from 'react'
import { speak, isSpeechSupported } from '../speak.js'

// Latihan mendengarkan: putar suara (contoh kalimat/kata), tebak artinya.
// Sumber: kosakata level aktif yang PUNYA contoh kalimat.
export default function ListeningView({ levelId, vocab }) {
  const items = useMemo(
    () => vocab.filter((v) => v.example && v.exampleId),
    [vocab],
  )
  const [idx, setIdx] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [correct, setCorrect] = useState(0)
  const [tried, setTried] = useState(0)

  // Ganti tingkat → mulai dari awal
  useEffect(() => {
    setIdx(0); setRevealed(false); setCorrect(0); setTried(0)
  }, [levelId])

  const item = items[idx % items.length]

  const play = useCallback(() => {
    if (item) speak(item.example, { rate: 0.85 })
  }, [item])

  if (!isSpeechSupported()) {
    return <p className="sub">Browser-mu tidak mendukung pemutaran suara.</p>
  }

  if (!items.length) {
    return <p className="sub">Belum ada contoh kalimat untuk level ini. Coba level lain.</p>
  }

  const grade = (ok) => {
    if (ok) setCorrect((c) => c + 1)
    setTried((t) => t + 1)
    setRevealed(false)
    setIdx((i) => i + 1)
  }

  return (
    <div className="practice-wrap">
      <div className="listen-card">
        <button className="listen-play" onClick={play} title="Putar suara">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M8 5v14l11-7z" fill="currentColor" />
          </svg>
        </button>
        <div className="listen-hint">Dengarkan, lalu tebak artinya.</div>
        {revealed ? (
          <div className="listen-reveal">
            <div className="listen-jp jp">{item.example}</div>
            {item.exampleRomaji && <div className="rm">{item.exampleRomaji}</div>}
            <div className="listen-id">{item.exampleId}</div>
          </div>
        ) : (
          <div className="listen-placeholder">Klik ▶ untuk memutar</div>
        )}
      </div>

      <div className="btn-row">
        {!revealed ? (
          <button className="btn" onClick={() => setRevealed(true)}>Tampilkan Jawaban</button>
        ) : (
          <>
            <button className="btn grade again" onClick={() => grade(false)}>Belum paham</button>
            <button className="btn grade good" onClick={() => grade(true)}>Paham</button>
          </>
        )}
      </div>

      <div className="kana-progress">
        <span className="sub">Benar {correct}/{tried} · {(idx % items.length) + 1}/{items.length}</span>
      </div>
    </div>
  )
}
