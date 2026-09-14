import { useState } from 'react'
import Flashcard from './Flashcard.jsx'

// Layar review SRS: menampilkan kartu yang jatuh tempo, lalu pengguna menilai
// kualitas ingatan (lagi / sulit / bagus / mudah) yang menentukan interval berikutnya.
export default function SRSReview({ cards, onReview, onDone }) {
  const [idx, setIdx] = useState(0)
  const [revealed, setRevealed] = useState(false)

  if (!cards || cards.length === 0) {
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

  const card = cards[idx]

  const grade = (quality) => {
    onReview(card.id, quality)
    if (idx + 1 >= cards.length) {
      onDone()
    } else {
      setIdx(idx + 1)
      setRevealed(false)
    }
  }

  return (
    <div className="quiz-wrap">
      <div className="progress">
        <div
          className="progress-fill"
          style={{ width: `${(idx / cards.length) * 100}%` }}
        />
      </div>
      <p className="sub" style={{ textAlign: 'center', marginBottom: 14 }}>
        Kartu {idx + 1} dari {cards.length} · interval: {card.interval} hari · pengulangan: {card.reps}
      </p>

      <CardFace card={card} revealed={revealed} onReveal={() => setRevealed(true)} />

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

function CardFace({ card, revealed, onReveal }) {
  // Kartu SRS menyimpan { id, type, content, ... } — rekonstruksi tampilan dari tipe
  const [type, key] = card.id.split(':')
  const content = card.id.slice(card.id.indexOf(':') + 1)

  // Kita butuh data asli. Kartu dibangun dengan metadata yang disimpan di kartu.
  const meta = card.meta || {}

  if (type === 'vocab') {
    return (
      <div className="flashcard-scene">
        <div className="flashcard">
          <div className="flash-face flash-front" style={{ transform: 'none', position: 'static' }}>
            <div className="flash-label">Kosakata</div>
            <div className="flash-main jp">{content}</div>
            {meta.reading && <div className="flash-sub jp">{meta.reading}</div>}
          </div>
        </div>
        {revealed && (
          <div className="reveal-panel">
            <div className="flash-main">{meta.meaning}</div>
            {meta.example && <div className="example jp">{meta.example}</div>}
          </div>
        )}
      </div>
    )
  }

  if (type === 'grammar') {
    return (
      <div className="flashcard-scene">
        <div className="flashcard">
          <div className="flash-face flash-front" style={{ transform: 'none', position: 'static' }}>
            <div className="flash-label">Tata Bahasa</div>
            <div className="flash-main jp">{content}</div>
          </div>
        </div>
        {revealed && (
          <div className="reveal-panel">
            <div className="flash-main">{meta.meaning}</div>
            {meta.example && <div className="example jp">{meta.example}</div>}
          </div>
        )}
      </div>
    )
  }

  if (type === 'kanji') {
    return (
      <div className="flashcard-scene">
        <div className="flashcard">
          <div className="flash-face flash-front" style={{ transform: 'none', position: 'static' }}>
            <div className="flash-label">Kanji</div>
            <div className="flash-main jp" style={{ fontSize: '4rem' }}>{content}</div>
          </div>
        </div>
        {revealed && (
          <div className="reveal-panel">
            <div className="flash-main">{meta.meaning}</div>
            <div className="flash-sub">On: {meta.on} · Kun: {meta.kun}</div>
          </div>
        )}
      </div>
    )
  }

  return null
}
