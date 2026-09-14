import { useState, useEffect } from 'react'

// Kartu flashcard dengan animasi flip 3D.
// Kartu otomatis tertutup kembali saat isinya berganti.
export default function Flashcard({ front, frontSub, back, backSub, onFlip, resetKey }) {
  const [flipped, setFlipped] = useState(false)

  // Tutup kartu setiap kali kartu berganti (isi depan berubah)
  useEffect(() => {
    setFlipped(false)
  }, [resetKey, front])

  const flip = () => {
    setFlipped((f) => {
      const next = !f
      if (onFlip) onFlip(next)
      return next
    })
  }

  return (
    <div className="flashcard-scene" onClick={flip}>
      <div className={`flashcard ${flipped ? 'flipped' : ''}`}>
        <div className="flash-face flash-front">
          <div className="flash-label">Tampak Depan</div>
          <div className="flash-main jp">{front}</div>
          {frontSub && <div className="flash-sub jp">{frontSub}</div>}
        </div>
        <div className="flash-face flash-back">
          <div className="flash-label">Jawaban</div>
          <div className="flash-main">{back}</div>
          {backSub && <div className="flash-sub">{backSub}</div>}
        </div>
      </div>
    </div>
  )
}
