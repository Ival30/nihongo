import { useState, useMemo, useEffect, useRef } from 'react'
import FuriganaText from './FuriganaText.jsx'

// Layar pengulangan terjadwal (SRS).
// Alur: tampilkan kartu → buka jawaban → nilai ingatan (Ulangi/Sulit/Baik/Mudah).
// Kartu yang dinilai "Ulangi" dikembalikan ke antrian sesi ini, bukan dibuang.
export default function SRSReview({ cards, onReview, onDone }) {
  // Salinan antrian sesi: kartu baru ditambahkan saat dinilai "Ulangi"
  const [queue, setQueue] = useState(() => cards || [])
  const [idx, setIdx] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [reviewed, setReviewed] = useState(0)

  // Sinkronkan bila daftar kartu dari luar berubah (mis. dibuka ulang)
  const cardsRef = useRef(cards)
  useEffect(() => {
    if (cardsRef.current !== cards) {
      cardsRef.current = cards
      setQueue(cards || [])
      setIdx(0)
      setRevealed(false)
      setReviewed(0)
    }
  }, [cards])

  if (!queue || queue.length === 0) {
    return (
      <div className="quiz-wrap quiz-result">
        <h2 style={{ margin: '10px 0' }}>Tidak ada kartu untuk diulang</h2>
        <p className="sub">
          Semua kartu sudah terjadwal. Tambahkan kartu baru atau tunggu jadwal pengulangan berikutnya.
        </p>
        <div className="btn-row">
          <button className="btn" onClick={onDone}>Selesai</button>
        </div>
      </div>
    )
  }

  // Antrian habis → sesi selesai
  if (idx >= queue.length) {
    return (
      <div className="quiz-wrap quiz-result">
        <h2 style={{ margin: '10px 0' }}>Sesi selesai</h2>
        <p className="sub">{reviewed} kartu telah dinilai. Kerja bagus.</p>
        <div className="btn-row">
          <button className="btn" onClick={onDone}>Selesai</button>
        </div>
      </div>
    )
  }

  const card = queue[idx]
  const total = queue.length

  const grade = (quality) => {
    onReview(card.id, quality)
    setReviewed((n) => n + 1)
    // "Ulangi" (0) → masukkan kembali ke akhir antrian agar benar-benar diulang
    if (quality === 0) {
      setQueue((q) => [...q, card])
    }
    setIdx((i) => i + 1)
    setRevealed(false)
  }

  return (
    <div className="quiz-wrap">
      <div className="progress">
        <div
          className="progress-fill"
          style={{ width: `${(idx / total) * 100}%` }}
        />
      </div>
      <p className="sub" style={{ textAlign: 'center', marginBottom: 14 }}>
        Kartu {idx + 1} dari {total} · {card.reps > 0 ? `pengulangan ke-${card.reps}` : 'kartu baru'}
      </p>

      <CardFace card={card} revealed={revealed} />

      {revealed ? (
        <div className="grade-row">
          <button className="btn grade again" onClick={() => grade(0)}>Ulangi</button>
          <button className="btn grade hard" onClick={() => grade(3)}>Sulit</button>
          <button className="btn grade good" onClick={() => grade(4)}>Baik</button>
          <button className="btn grade easy" onClick={() => grade(5)}>Mudah</button>
        </div>
      ) : (
        <div className="btn-row">
          <button className="btn" onClick={() => setRevealed(true)}>Lihat Jawaban</button>
        </div>
      )}
    </div>
  )
}

// Bangun tampilan kartu dari metadata yang tersimpan.
function CardFace({ card, revealed }) {
  const meta = card.meta || {}
  const content = card.id.slice(card.id.indexOf(':') + 1)
  const type = card.id.split(':')[0]

  const label = type === 'vocab' ? 'Kosakata' : type === 'grammar' ? 'Tata Bahasa' : 'Kanji'

  return (
    <div className="flashcard-scene">
      <div className="flashcard">
        <div className="flash-face flash-front" style={{ transform: 'none', position: 'static' }}>
          <div className="flash-label">{label}</div>
          <div
            className="flash-main jp"
            style={type === 'kanji' ? { fontSize: '4rem' } : undefined}
          >
            {content}
          </div>
          {type === 'vocab' && meta.reading && (
            <div className="flash-sub jp">{meta.reading}</div>
          )}
        </div>
      </div>

      {revealed && (
        <div className="reveal-panel">
          <div className="flash-main">{meta.meaning || meta.meaningId}</div>
          {meta.on && (
            <div className="flash-sub">On: {meta.on} · Kun: {meta.kun}</div>
          )}
          {meta.example && <div className="example jp">{meta.exampleFuri ? <FuriganaText text={meta.exampleFuri} /> : meta.example}</div>}
        </div>
      )}
    </div>
  )
}
