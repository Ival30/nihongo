import { useState, useMemo } from 'react'
import { conjugate, FORMS, getConjugationWords } from '../data/conjugation.js'
import SpeakButton from './SpeakButton.jsx'

// Latihan konjugasi: ubah kata ke bentuk -te/-ta/-nai/-masu/-teiru.
export default function ConjugationView({ levelId }) {
  const words = useMemo(() => getConjugationWords(levelId), [levelId])
  const [idx, setIdx] = useState(0)
  const [formKey, setFormKey] = useState('te')
  const [input, setInput] = useState('')
  const [revealed, setRevealed] = useState(false)
  const [correct, setCorrect] = useState(0)
  const [tried, setTried] = useState(0)

  const word = words[idx % words.length]
  const conj = conjugate(word)
  const answer = conj[formKey]
  const formMeta = FORMS.find((f) => f.key === formKey)

  const check = () => {
    if (revealed) return
    setRevealed(true)
    setTried((t) => t + 1)
    const clean = input.trim().replace(/\s+/g, '')
    if (clean === answer || clean === (word.reading && conj[formKey])) {
      setCorrect((c) => c + 1)
    }
  }

  const next = () => {
    setIdx((i) => i + 1)
    setInput('')
    setRevealed(false)
  }

  return (
    <div className="practice-wrap">
      <div className="conj-prompt">
        <div className="conj-word jp">
          {word.jp}
          {word.type === 'i-adj' || word.type === 'na-adj' ? '' : ''}
        </div>
        <div className="conj-meaning">{word.meaning}</div>
        <div className="conj-ask">
          Ubah ke <strong>{formMeta.label}</strong>
          <span className="conj-hint"> — {formMeta.hint}</span>
        </div>
      </div>

      <input
        className="search conj-input"
        placeholder={`Tulis ${formMeta.label}…`}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') check() }}
        disabled={revealed}
      />

      {revealed && (
        <div className={`feedback ${input.trim() === answer ? 'good' : 'bad'}`}>
          {input.trim() === answer
            ? 'Benar!'
            : `Kurang tepat — jawabannya: ${answer}`}
        </div>
      )}

      <div className="btn-row">
        {!revealed ? (
          <button className="btn" onClick={check} disabled={!input.trim()}>Periksa</button>
        ) : (
          <button className="btn" onClick={next}>Lanjut</button>
        )}
      </div>

      {/* Pilih bentuk */}
      <div className="form-picker">
        {FORMS.filter((f) => f.key !== 'teiru' || (word.type !== 'i-adj' && word.type !== 'na-adj')).map((f) => (
          <button
            key={f.key}
            className={`mini-btn ${formKey === f.key ? 'mini-btn-on' : ''}`}
            onClick={() => { setFormKey(f.key); setInput(''); setRevealed(false) }}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="kana-progress">
        <span className="sub">Benar {correct}/{tried} · Kata {idx + 1}/{words.length}</span>
      </div>
    </div>
  )
}
