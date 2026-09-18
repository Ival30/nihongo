import { useState, useMemo, useEffect, useRef, useCallback } from 'react'

// ── Helpers ──────────────────────────────────────────────────────────
function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function normalize(s) {
  return (s || '').toLowerCase().trim().replace(/\s+/g, '')
}

function pickRandom(pool, n) {
  const shuffled = shuffle(pool)
  return shuffled.slice(0, n)
}

// ── Main Component ───────────────────────────────────────────────────
export default function VocabDrillView({ levelId, vocab }) {
  const [mode, setMode] = useState('typing')

  // Reset state when level changes
  useEffect(() => {
    setMode('typing')
  }, [levelId])

  return (
    <div>
      <div className="tabs">
        <div className={`tab ${mode === 'typing' ? 'active' : ''}`} onClick={() => setMode('typing')}>Ketik Arti</div>
        <div className={`tab ${mode === 'matching' ? 'active' : ''}`} onClick={() => setMode('matching')}>Cocokkan</div>
        <div className={`tab ${mode === 'speed' ? 'active' : ''}`} onClick={() => setMode('speed')}>Kilat</div>
      </div>

      {mode === 'typing' && <TypingDrill levelId={levelId} vocab={vocab} />}
      {mode === 'matching' && <MatchingDrill levelId={levelId} vocab={vocab} />}
      {mode === 'speed' && <SpeedDrill levelId={levelId} vocab={vocab} />}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════
// 1. TYPING DRILL (Ketik Arti)
// ══════════════════════════════════════════════════════════════════════
function TypingDrill({ levelId, vocab }) {
  const pool = useMemo(() => shuffle(vocab), [vocab, levelId])
  const [idx, setIdx] = useState(0)
  const [input, setInput] = useState('')
  const [feedback, setFeedback] = useState(null) // null | 'correct' | 'wrong'
  const [correctAnswer, setCorrectAnswer] = useState('')
  const [score, setScore] = useState({ right: 0, total: 0 })

  useEffect(() => {
    setIdx(0); setInput(''); setFeedback(null); setScore({ right: 0, total: 0 })
  }, [levelId])

  if (!pool.length) return <p className="sub">Tidak ada kosakata untuk dilatih.</p>

  const item = pool[idx % pool.length]
  const answer = item.meaningId || item.meaning

  const handleSubmit = (e) => {
    e.preventDefault()
    if (feedback) return // already answered
    const userNorm = normalize(input)
    const ansNorm = normalize(answer)
    const isCorrect = userNorm === ansNorm
    setFeedback(isCorrect ? 'correct' : 'wrong')
    if (!isCorrect) setCorrectAnswer(answer)
    setScore((s) => ({ right: s.right + (isCorrect ? 1 : 0), total: s.total + 1 }))
  }

  const handleNext = () => {
    setIdx((i) => i + 1)
    setInput('')
    setFeedback(null)
    setCorrectAnswer('')
  }

  return (
    <div className="quiz-wrap">
      <div className="progress">
        <div className="progress-fill" style={{ width: `${(idx / pool.length) * 100}%` }} />
      </div>

      <div className="conj-prompt">
        <div className="conj-word jp">{item.jp}</div>
        <div className="conj-meaning jp">{item.reading}</div>
        <div className="conj-ask">Ketik arti dalam bahasa Indonesia:</div>
      </div>

      <form onSubmit={handleSubmit}>
        <input
          className="search conj-input"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ketik arti…"
          disabled={feedback !== null}
          autoComplete="off"
          autoFocus
        />
      </form>

      {feedback && (
        <div style={{ marginTop: 12 }}>
          <p className={`feedback ${feedback === 'correct' ? 'good' : 'bad'}`}>
            {feedback === 'correct' ? 'Benar!' : `Kurang tepat — jawabannya: ${correctAnswer}`}
          </p>
          <button className="btn" style={{ marginTop: 10 }} onClick={handleNext}>
            {idx + 1 >= pool.length ? 'Selesai' : 'Lanjut'}
          </button>
        </div>
      )}

      <div style={{ marginTop: 16 }}>
        <span className="sub">Benar {score.right}/{score.total} · {idx + 1}/{pool.length}</span>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════
// 2. MATCHING GAME (Cocokkan)
// ══════════════════════════════════════════════════════════════════════
function MatchingDrill({ levelId, vocab }) {
  const [round, setRound] = useState(0)
  const [pairs, setPairs] = useState([])
  const [selectedJp, setSelectedJp] = useState(null)
  const [matched, setMatched] = useState(new Set())
  const [wrongPair, setWrongPair] = useState(null)
  const [score, setScore] = useState({ right: 0, total: 0 })

  const initRound = useCallback(() => {
    const selected = pickRandom(vocab, Math.min(5, vocab.length))
    const jpItems = selected.map((v, i) => ({ id: i, jp: v.jp, reading: v.reading, answer: v.meaningId || v.meaning }))
    const idItems = selected.map((v, i) => ({ id: i, meaning: v.meaningId || v.meaning }))
    setPairs({ jp: jpItems, meanings: shuffle(idItems) })
    setSelectedJp(null)
    setMatched(new Set())
    setWrongPair(null)
  }, [vocab])

  useEffect(() => {
    initRound()
    setRound(0)
    setScore({ right: 0, total: 0 })
  }, [levelId, initRound])

  useEffect(() => {
    initRound()
  }, [round, initRound])

  if (!vocab.length) return <p className="sub">Tidak ada kosakata untuk dilatih.</p>
  if (!pairs.jp) return null

  const handleJpClick = (id) => {
    if (matched.has(id)) return
    setSelectedJp(id)
    setWrongPair(null)
  }

  const handleMeaningClick = (meaningId) => {
    if (selectedJp === null) return
    const jpItem = pairs.jp.find((p) => p.id === selectedJp)
    const meaningItem = pairs.meanings.find((m) => m.id === meaningId)
    if (!jpItem || !meaningItem) return

    if (jpItem.id === meaningItem.id) {
      // Correct match
      const newMatched = new Set(matched)
      newMatched.add(jpItem.id)
      setMatched(newMatched)
      setSelectedJp(null)
      setScore((s) => ({ right: s.right + 1, total: s.total + 1 }))
    } else {
      // Wrong match — flash red then reset
      setWrongPair({ jpId: selectedJp, meaningId })
      setScore((s) => ({ right: s.right, total: s.total + 1 }))
      setTimeout(() => {
        setWrongPair(null)
        setSelectedJp(null)
      }, 600)
    }
  }

  const allMatched = matched.size === pairs.jp.length
  const handleNextRound = () => {
    setRound((r) => r + 1)
  }

  if (allMatched) {
    return (
      <div className="quiz-wrap quiz-result">
        <div className="pct">Ronde selesai!</div>
        <div className="score">{score.right} / {score.total}</div>
        <p className="sub" style={{ margin: '10px 0 18px' }}>
          {score.right === score.total ? 'Sempurna!' : 'Terus berlatih!'}
        </p>
        <div className="btn-row">
          <button className="btn" onClick={handleNextRound}>Ronde Berikutnya</button>
        </div>
      </div>
    )
  }

  return (
    <div className="quiz-wrap">
      <div style={{ marginBottom: 12 }}>
        <span className="sub">Ronde {round + 1} · Cocokkan kata Jepang dengan artinya</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {/* Japanese column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {pairs.jp.map((p) => {
            let cls = 'option'
            if (matched.has(p.id)) cls += ' correct'
            else if (selectedJp === p.id) cls += ' selected'
            if (wrongPair && wrongPair.jpId === p.id) cls += ' wrong'
            return (
              <button
                key={p.id}
                className={cls}
                onClick={() => handleJpClick(p.id)}
                disabled={matched.has(p.id)}
              >
                <span className="jp" style={{ fontWeight: 700 }}>{p.jp}</span>
                <br />
                <span style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>{p.reading}</span>
              </button>
            )
          })}
        </div>

        {/* Meaning column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {pairs.meanings.map((m) => {
            let cls = 'option'
            if (matched.has(m.id)) cls += ' correct'
            if (wrongPair && wrongPair.meaningId === m.id) cls += ' wrong'
            return (
              <button
                key={m.id}
                className={cls}
                onClick={() => handleMeaningClick(m.id)}
                disabled={matched.has(m.id)}
              >
                {m.meaning}
              </button>
            )
          })}
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <span className="sub">Benar {score.right}/{score.total} · Tersisa {pairs.jp.length - matched.size} pasangan</span>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════
// 3. SPEED ROUND (Kilat)
// ══════════════════════════════════════════════════════════════════════
function SpeedDrill({ levelId, vocab }) {
  const TIME_LIMIT = 60
  const [started, setStarted] = useState(false)
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT)
  const [questions, setQuestions] = useState([])
  const [qIdx, setQIdx] = useState(0)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)
  const [answered, setAnswered] = useState(null) // 'correct' | 'wrong' | null
  const timerRef = useRef(null)

  const buildQuestions = useCallback(() => {
    // Build a long sequence of MC questions
    const shuffled = shuffle(vocab)
    const qs = []
    for (let i = 0; i < shuffled.length; i++) {
      const item = shuffled[i]
      const answer = item.meaningId || item.meaning
      // Pick 3 random distractors
      const distractors = pickRandom(
        vocab.filter((v) => (v.meaningId || v.meaning) !== answer),
        3
      ).map((v) => v.meaningId || v.meaning)
      const options = shuffle([answer, ...distractors])
      qs.push({ item, answer, options })
    }
    return qs
  }, [vocab])

  const startGame = () => {
    const qs = buildQuestions()
    setQuestions(qs)
    setQIdx(0)
    setScore(0)
    setTimeLeft(TIME_LIMIT)
    setFinished(false)
    setAnswered(null)
    setStarted(true)
  }

  useEffect(() => {
    if (!started || finished) return
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current)
          setFinished(true)
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [started, finished])

  useEffect(() => {
    setStarted(false)
    setFinished(false)
    setScore(0)
  }, [levelId])

  if (!vocab.length) return <p className="sub">Tidak ada kosakata untuk dilatih.</p>

  if (finished) {
    const total = qIdx + 1
    return (
      <div className="quiz-wrap quiz-result">
        <div className="pct">Waktu habis!</div>
        <div className="score">{score} / {total}</div>
        <p className="sub" style={{ margin: '10px 0 18px' }}>
          {score >= total * 0.8 ? 'Hebat! Kamu menguasai kosakata ini.' : 'Terus berlatih, kamu pasti bisa!'}
        </p>
        <div className="btn-row">
          <button className="btn" onClick={startGame}>Main Lagi</button>
        </div>
      </div>
    )
  }

  if (!started) {
    return (
      <div className="quiz-wrap quiz-result">
        <div className="pct">Kilat</div>
        <div className="score" style={{ fontSize: '2rem' }}>{TIME_LIMIT} detik</div>
        <p className="sub" style={{ margin: '10px 0 18px' }}>
          Tebak arti kata secepat mungkin. Jawaban benar +1, jawaban salah langsung lanjut.
        </p>
        <div className="btn-row">
          <button className="btn" onClick={startGame}>Mulai</button>
        </div>
      </div>
    )
  }

  const q = questions[qIdx % questions.length]

  const handlePick = (opt) => {
    if (answered) return
    const isCorrect = opt === q.answer
    if (isCorrect) setScore((s) => s + 1)
    setAnswered(isCorrect ? 'correct' : 'wrong')

    // Auto-advance after brief delay
    setTimeout(() => {
      setQIdx((i) => i + 1)
      setAnswered(null)
    }, isCorrect ? 400 : 800)
  }

  return (
    <div className="quiz-wrap">
      <div className="exam-header">
        <span className="sub">Benar: {score}</span>
        <span className={`exam-timer ${timeLeft <= 10 ? 'warn' : ''}`}>{timeLeft}s</span>
      </div>

      <div className="progress">
        <div className="progress-fill" style={{ width: `${((TIME_LIMIT - timeLeft) / TIME_LIMIT) * 100}%` }} />
      </div>

      <div className="conj-prompt">
        <div className="conj-word jp">{q.item.jp}</div>
        <div className="conj-meaning jp">{q.item.reading}</div>
        <div className="conj-ask">Pilih arti yang benar:</div>
      </div>

      <div>
        {q.options.map((opt, i) => {
          let cls = 'option'
          if (answered) {
            if (opt === q.answer) cls += ' correct'
            else if (answered === 'wrong' && opt !== q.answer) cls += ''
          }
          return (
            <button
              key={i}
              className={cls}
              onClick={() => handlePick(opt)}
              disabled={answered !== null}
            >
              {opt}
            </button>
          )
        })}
      </div>
    </div>
  )
}