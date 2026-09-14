import { useState, useMemo } from 'react'
import { getReadings } from '../data/readings.js'
import { readingsFurigana } from '../data/readings-furigana.js'
import SpeakButton from './SpeakButton.jsx'
import FuriganaText from './FuriganaText.jsx'

// Bacaan pendek (dokkai) + soal pemahaman.
// Dua mode: baca teks (dengan furigana & terjemahan opsional), lalu jawab soal.
export default function DokkaiView({ level, levelId, onFinish }) {
  const readings = useMemo(() => getReadings(levelId), [levelId])
  const [idx, setIdx] = useState(0)
  const [showId, setShowId] = useState(false)
  const [showFuri, setShowFuri] = useState(true)
  const [answers, setAnswers] = useState({}) // { [qIdx]: option }
  const [checked, setChecked] = useState(false)

  if (!readings.length) {
    return <p className="sub">Belum ada bacaan untuk tingkat ini.</p>
  }

  const reading = readings[idx]
  const furiEntry = (readingsFurigana[levelId] || []).find((r) => r.id === reading.id)
  const furi = furiEntry?.textFuri || reading.text
  const answeredAll = reading.questions.every((_, i) => answers[i] !== undefined)
  const correctCount = reading.questions.filter((q, i) => answers[i] === q.answer).length

  const pick = (qi, opt) => {
    if (checked) return
    setAnswers((a) => ({ ...a, [qi]: opt }))
  }

  const check = () => {
    setChecked(true)
    if (onFinish) onFinish(correctCount, reading.questions.length)
  }

  const nextReading = () => {
    setIdx((i) => (i + 1) % readings.length)
    setAnswers({})
    setChecked(false)
    setShowId(false)
    window.scrollTo({ top: 0 })
  }

  return (
    <div className="dokkai">
      <div className="dokkai-nav">
        <span className="sub">Bacaan {idx + 1} dari {readings.length}</span>
        {readings.length > 1 && (
          <div className="dokkai-dots">
            {readings.map((r, i) => (
              <span
                key={r.id}
                className={`dokkai-dot ${i === idx ? 'active' : ''}`}
                onClick={() => { setIdx(i); setAnswers({}); setChecked(false); setShowId(false) }}
              />
            ))}
          </div>
        )}
      </div>

      <h2 className="dokkai-title">
        <span className="jp">{reading.title}</span>
        <SpeakButton text={reading.text} label={reading.title} />
      </h2>
      <p className="dokkai-title-id">{reading.titleId}</p>

      <div className="dokkai-text jp">
        {showFuri ? <FuriganaText text={furi} /> : reading.text}
      </div>

      <div className="dokkai-toggles">
        <label className="hide-toggle">
          <input type="checkbox" checked={showFuri} onChange={(e) => setShowFuri(e.target.checked)} />
          Furigana
        </label>
        <label className="hide-toggle">
          <input type="checkbox" checked={showId} onChange={(e) => setShowId(e.target.checked)} />
          Tampilkan terjemahan
        </label>
      </div>
      {showId && <div className="dokkai-translation">{reading.textId}</div>}

      <div className="section-title">Pertanyaan</div>
      {reading.questions.map((q, qi) => {
        const picked = answers[qi]
        return (
          <div className="dokkai-q" key={qi}>
            <div className="dokkai-q-head">
              <span className="dokkai-q-num">{qi + 1}</span>
              <div>
                <div className="dokkai-q-text jp">{q.q}</div>
                <div className="dokkai-q-text-id">{q.qId}</div>
              </div>
            </div>
            <div className="dokkai-options">
              {q.options.map((opt, oi) => {
                let cls = 'option'
                if (checked) {
                  if (opt === q.answer) cls += ' correct'
                  else if (opt === picked) cls += ' wrong'
                } else if (opt === picked) {
                  cls += ' selected'
                }
                return (
                  <button key={oi} className={cls} onClick={() => pick(qi, opt)} disabled={checked}>
                    <span className="jp">{opt}</span>
                  </button>
                )
              })}
            </div>
            {checked && (
              <div className={`dokkai-explain ${picked === q.answer ? 'good' : 'bad'}`}>
                {picked === q.answer ? 'Benar. ' : 'Kurang tepat. '}
                {q.explain}
              </div>
            )}
          </div>
        )
      })}

      <div className="btn-row">
        {!checked ? (
          <button className="btn" onClick={check} disabled={!answeredAll}>
            {answeredAll ? 'Periksa Jawaban' : 'Jawab semua soal dulu'}
          </button>
        ) : (
          <>
            <span className="dokkai-score">Skor: {correctCount}/{reading.questions.length}</span>
            <button className="btn" onClick={nextReading}>Bacaan Berikutnya</button>
          </>
        )}
      </div>
    </div>
  )
}
