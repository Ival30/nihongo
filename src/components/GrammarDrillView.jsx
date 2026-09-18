import { useState, useMemo, useCallback } from 'react'

// Latihan Tata Bahasa interaktif — 3 mode:
// 1. Lengkapi Kalimat (fill-in-the-blank)
// 2. Susun Kalimat (sentence reordering)
// 3. Cari Kesalahan (error spotting)

const MODES = [
  { id: 'fill', label: 'Lengkapi Kalimat' },
  { id: 'reorder', label: 'Susun Kalimat' },
  { id: 'error', label: 'Cari Kesalahan' },
]

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function pickRandom(arr, n, exclude = []) {
  const pool = arr.filter((x) => !exclude.includes(x))
  const result = []
  const copy = [...pool]
  for (let i = 0; i < n && copy.length > 0; i++) {
    const idx = Math.floor(Math.random() * copy.length)
    result.push(copy[idx])
    copy.splice(idx, 1)
  }
  return result
}

// ─── Fill-in-the-blank ──────────────────────────────────────────────
function buildFillQuestions(grammar) {
  if (grammar.length < 2) return []
  return grammar
    .filter((g) => g.examples && g.examples.length > 0)
    .map((g) => {
      const ex = g.examples[Math.floor(Math.random() * g.examples.length)]
      // Replace the pattern in the example sentence with ___
      const blanked = ex.jp.replace(g.pattern, '___')
      // If pattern not found literally, try a softer match (first occurrence of key fragment)
      const sentence = blanked === ex.jp ? ex.jp.replace(new RegExp(escapeRegex(g.pattern.split(/[　\s]/)[0]), 'u'), '___') : blanked
      // Build 4 options: 1 correct + 3 distractors
      const distractors = pickRandom(
        grammar.filter((item) => item.pattern !== g.pattern),
        3,
      ).map((d) => d.pattern)
      const options = shuffle([g.pattern, ...distractors])
      return {
        type: 'fill',
        grammarItem: g,
        sentence,
        correctPattern: g.pattern,
        options,
        example: ex,
      }
    })
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// ─── Sentence Reordering ────────────────────────────────────────────
function buildReorderQuestions(grammar) {
  const items = grammar.filter((g) => g.examples && g.examples.length > 0)
  if (items.length === 0) return []
  return items.map((g) => {
    const ex = g.examples[Math.floor(Math.random() * g.examples.length)]
    // Split sentence into words (by Japanese punctuation boundaries or character clusters)
    const words = splitJapanese(ex.jp)
    const scrambled = shuffle(words)
    return {
      type: 'reorder',
      grammarItem: g,
      correctOrder: words,
      scrambled,
      example: ex,
    }
  })
}

function splitJapanese(sentence) {
  // Split into meaningful chunks: particles, words, punctuation
  // Strategy: split by known particles and punctuation, keeping them as tokens
  const tokens = []
  let current = ''
  const particles = ['は', 'が', 'を', 'に', 'で', 'の', 'と', 'も', 'へ', 'から', 'まで', 'より', 'くらい', 'ほど', 'だけ', 'しか', 'でも', 'にも', 'への', 'での', 'としては']
  const punctuation = ['。', '、', '？', '！', '！', '・', '…', '。', '，']

  for (let i = 0; i < sentence.length; i++) {
    const ch = sentence[i]
    if (punctuation.includes(ch)) {
      if (current) tokens.push(current)
      tokens.push(ch)
      current = ''
    } else if (particles.includes(current + ch) || (current === '' && particles.includes(ch))) {
      // Check if adding this char forms a particle
      if (current === '' && particles.includes(ch)) {
        if (tokens.length > 0 && !punctuation.includes(tokens[tokens.length - 1]) && !particles.includes(tokens[tokens.length - 1])) {
          // Attach single-char particle to previous word? No — keep separate for reordering challenge
          tokens.push(ch)
        } else {
          tokens.push(ch)
        }
      } else {
        current += ch
      }
    } else {
      current += ch
    }
  }
  if (current) tokens.push(current)

  // If we got very few tokens (e.g. 1 or 2), split by character clusters of 2-3
  if (tokens.length <= 2) {
    return splitByLength(sentence, 2)
  }

  return tokens
}

function splitByLength(str, len) {
  const result = []
  for (let i = 0; i < str.length; i += len) {
    result.push(str.slice(i, i + len))
  }
  return result.filter((s) => s.length > 0)
}

// ─── Error Spotting ──────────────────────────────────────────────────
function buildErrorQuestions(grammar) {
  const items = grammar.filter((g) => g.examples && g.examples.length > 0 && grammar.length > 1)
  if (items.length === 0) return []

  return items.map((g) => {
    const ex = g.examples[Math.floor(Math.random() * g.examples.length)]
    // Pick a wrong pattern from another grammar item
    const wrongItems = grammar.filter((item) => item.pattern !== g.pattern)
    const wrongItem = wrongItems[Math.floor(Math.random() * wrongItems.length)]
    // Create the erroneous sentence by replacing the correct pattern with the wrong one
    let errorSentence = ex.jp.replace(g.pattern, wrongItem.pattern)
    // If literal replacement didn't work, try first key fragment
    if (errorSentence === ex.jp) {
      const key = g.pattern.split(/[　\s]/)[0]
      errorSentence = ex.jp.replace(new RegExp(escapeRegex(key), 'u'), wrongItem.pattern.split(/[　\s]/)[0])
    }
    return {
      type: 'error',
      grammarItem: g,
      wrongItem,
      originalSentence: ex.jp,
      errorSentence,
      correctPattern: g.pattern,
      wrongPattern: wrongItem.pattern,
      example: ex,
    }
  })
}

// ─── Fill Mode Component ────────────────────────────────────────────
function FillMode({ questions }) {
  const [idx, setIdx] = useState(0)
  const [picked, setPicked] = useState(null)
  const [score, setScore] = useState(0)
  const [done, setDone] = useState(false)

  if (questions.length === 0) return <p className="sub">Tidak cukup pola tata bahasa untuk latihan ini.</p>

  const q = questions[idx]

  const pick = (opt) => {
    if (picked) return
    setPicked(opt)
    if (opt === q.correctPattern) setScore((s) => s + 1)
  }

  const next = () => {
    if (idx + 1 >= questions.length) {
      setDone(true)
    } else {
      setIdx(idx + 1)
      setPicked(null)
    }
  }

  const restart = () => {
    setIdx(0)
    setPicked(null)
    setScore(0)
    setDone(false)
  }

  if (done) {
    const pct = Math.round((score / questions.length) * 100)
    return (
      <div className="quiz-wrap quiz-result">
        <div className="pct">{pct}% benar</div>
        <div className="score">{score} / {questions.length}</div>
        <p className="sub" style={{ margin: '10px 0 18px' }}>
          {pct >= 80 ? 'Bagus sekali — kamu menguasai pola ini!' : pct >= 50 ? 'Cukup baik. Teruslah berlatih.' : 'Jangan menyerah. Ulangi sekali lagi.'}
        </p>
        <div className="btn-row"><button className="btn" onClick={restart}>Ulangi</button></div>
      </div>
    )
  }

  return (
    <div className="quiz-wrap">
      <div className="progress">
        <div className="progress-fill" style={{ width: `${(idx / questions.length) * 100}%` }} />
      </div>
      <div className="quiz-question jp">{q.sentence}</div>
      <div className="quiz-hint">Pilih pola tata bahasa yang tepat untuk mengisi ___</div>
      <div>
        {q.options.map((opt, i) => {
          let cls = 'option'
          if (picked) {
            if (opt === q.correctPattern) cls += ' correct'
            else if (opt === picked) cls += ' wrong'
          }
          return (
            <button key={i} className={cls} onClick={() => pick(opt)} disabled={!!picked}>
              {opt}
            </button>
          )
        })}
      </div>
      {picked && (
        <div>
          <p className={`feedback ${picked === q.correctPattern ? 'good' : 'bad'}`}>
            {picked === q.correctPattern
              ? 'Benar!'
              : `Kurang tepat — jawabannya: ${q.correctPattern}`}
          </p>
          <div className="example" style={{ marginTop: 8 }}>
            <span className="jp">{q.example.jp}</span>
            <span className="id">{q.example.id || q.example.en}</span>
          </div>
          <button className="btn" style={{ marginTop: 12 }} onClick={next}>
            {idx + 1 >= questions.length ? 'Lihat Hasil' : 'Lanjut'}
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Reorder Mode Component ─────────────────────────────────────────
function ReorderMode({ questions }) {
  const [idx, setIdx] = useState(0)
  const [selected, setSelected] = useState([])
  const [checked, setChecked] = useState(false)
  const [score, setScore] = useState(0)
  const [done, setDone] = useState(false)

  if (questions.length === 0) return <p className="sub">Tidak cukup pola tata bahasa untuk latihan ini.</p>

  const q = questions[idx]

  const tapWord = (word, i) => {
    if (checked) return
    setSelected((prev) => [...prev, { word, origIndex: i }])
  }

  const untapWord = (i) => {
    if (checked) return
    setSelected((prev) => prev.filter((_, j) => j !== i))
  }

  const check = () => {
    if (selected.length !== q.correctOrder.length) return
    setChecked(true)
    const isCorrect = selected.every((s, i) => s.word === q.correctOrder[i])
    if (isCorrect) setScore((s) => s + 1)
  }

  const next = () => {
    if (idx + 1 >= questions.length) {
      setDone(true)
    } else {
      setIdx(idx + 1)
      setSelected([])
      setChecked(false)
    }
  }

  const restart = () => {
    setIdx(0)
    setSelected([])
    setChecked(false)
    setScore(0)
    setDone(false)
  }

  const isCorrect = checked && selected.every((s, i) => s.word === q.correctOrder[i])

  // Which scrambled words are still available (not yet selected)
  const availableIndices = q.scrambled
    .map((w, i) => ({ word: w, index: i }))
    .filter((item) => !selected.some((s) => s.origIndex === item.index && s.word === item.word) || selected.filter((s) => s.origIndex === item.index && s.word === item.word).length < q.scrambled.filter((w2, i2) => i2 === item.index || (w2 === item.word && q.scrambled.indexOf(w2) === item.index)).length)

  // Build available list: remove words as they get selected
  const usedOrigIndices = selected.map((s) => s.origIndex)
  const available = q.scrambled.map((w, i) => ({ word: w, index: i })).filter((item) => {
    // Count how many times this index appears in usedOrigIndices
    const usedCount = usedOrigIndices.filter((ui) => ui === item.index).length
    // Count how many times this index appears in selected up to this point
    return usedCount === 0
  })

  // Simpler approach: track remaining words by index
  const remaining = q.scrambled
    .map((w, i) => ({ word: w, index: i }))
    .filter((item) => {
      const timesUsed = selected.filter((s) => s.origIndex === item.index).length
      return timesUsed === 0
    })

  if (done) {
    const pct = Math.round((score / questions.length) * 100)
    return (
      <div className="quiz-wrap quiz-result">
        <div className="pct">{pct}% benar</div>
        <div className="score">{score} / {questions.length}</div>
        <p className="sub" style={{ margin: '10px 0 18px' }}>
          {pct >= 80 ? 'Bagus sekali — kamu menguasai pola ini!' : pct >= 50 ? 'Cukup baik. Teruslah berlatih.' : 'Jangan menyerah. Ulangi sekali lagi.'}
        </p>
        <div className="btn-row"><button className="btn" onClick={restart}>Ulangi</button></div>
      </div>
    )
  }

  return (
    <div className="quiz-wrap">
      <div className="progress">
        <div className="progress-fill" style={{ width: `${(idx / questions.length) * 100}%` }} />
      </div>
      <div className="quiz-hint" style={{ marginBottom: 6 }}>
        Pola: <strong className="jp">{q.grammarItem.pattern}</strong> — {q.grammarItem.meaningId || q.grammarItem.meaning}
      </div>
      <div className="quiz-question" style={{ fontSize: '1rem', marginBottom: 12 }}>
        Susun kata-kata berikut menjadi kalimat yang benar:
      </div>

      {/* Selected words (answer area) */}
      <div style={{
        minHeight: 52,
        padding: '10px 14px',
        background: 'var(--surface)',
        border: '2px dashed var(--border-strong)',
        borderRadius: 'var(--radius-sm)',
        marginBottom: 16,
        display: 'flex',
        flexWrap: 'wrap',
        gap: 8,
        alignItems: 'center',
      }}>
        {selected.length === 0 && (
          <span style={{ color: 'var(--faint)', fontSize: '0.9rem' }}>Ketuk kata di bawah untuk menyusun kalimat…</span>
        )}
        {selected.map((s, i) => {
          let cls = 'reorder-word'
          if (checked) {
            cls += s.word === q.correctOrder[i] ? ' correct' : ' wrong'
          }
          return (
            <span
              key={i}
              className={cls}
              onClick={() => untapWord(i)}
              style={{
                display: 'inline-block',
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                border: checked
                  ? s.word === q.correctOrder[i]
                    ? '2px solid var(--good)'
                    : '2px solid var(--bad)'
                  : '1px solid var(--accent)',
                background: checked
                  ? s.word === q.correctOrder[i]
                    ? '#eef5ef'
                    : 'var(--accent-wash)'
                  : 'var(--accent-wash)',
                color: checked
                  ? s.word === q.correctOrder[i]
                    ? '#2c5e3c'
                    : 'var(--accent-deep)'
                  : 'var(--accent-deep)',
                fontFamily: 'var(--serif)',
                fontSize: '1.05rem',
                cursor: checked ? 'default' : 'pointer',
                fontWeight: 600,
                transition: 'all 0.14s ease',
              }}
            >
              {s.word}
            </span>
          )
        })}
      </div>

      {/* Available words to tap */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        {remaining.map((item) => (
          <span
            key={item.index}
            className="reorder-word-available"
            onClick={() => tapWord(item.word, item.index)}
            style={{
              display: 'inline-block',
              padding: '6px 12px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              color: 'var(--ink)',
              fontFamily: 'var(--serif)',
              fontSize: '1.05rem',
              cursor: 'pointer',
              fontWeight: 500,
              transition: 'all 0.14s ease',
            }}
          >
            {item.word}
          </span>
        ))}
      </div>

      {!checked && selected.length === q.correctOrder.length && (
        <button className="btn" onClick={check}>Periksa</button>
      )}

      {checked && (
        <div>
          <p className={`feedback ${isCorrect ? 'good' : 'bad'}`}>
            {isCorrect ? 'Benar!' : 'Kurang tepat.'}
          </p>
          {!isCorrect && (
            <div className="example" style={{ marginTop: 8 }}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>Kalimat yang benar:</div>
              <span className="jp">{q.correctOrder.join('')}</span>
              <span className="id" style={{ display: 'block', marginTop: 2 }}>{q.example.id || q.example.en}</span>
            </div>
          )}
          <button className="btn" style={{ marginTop: 12 }} onClick={next}>
            {idx + 1 >= questions.length ? 'Lihat Hasil' : 'Lanjut'}
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Error Spotting Mode Component ──────────────────────────────────
function ErrorMode({ questions }) {
  const [idx, setIdx] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [score, setScore] = useState(0)
  const [done, setDone] = useState(false)

  if (questions.length === 0) return <p className="sub">Tidak cukup pola tata bahasa untuk latihan ini.</p>

  const q = questions[idx]

  // Split the error sentence into segments, marking which one is the error
  const segments = useMemo(() => {
    if (!q) return []
    // Find where the wrong pattern appears in the error sentence
    const errorIdx = q.errorSentence.indexOf(q.wrongPattern)
    if (errorIdx === -1) {
      // Fallback: treat whole sentence as one segment
      return [{ text: q.errorSentence, isError: true }]
    }
    const before = q.errorSentence.slice(0, errorIdx)
    const errorPart = q.wrongPattern
    const after = q.errorSentence.slice(errorIdx + q.wrongPattern.length)
    const segs = []
    if (before) segs.push({ text: before, isError: false })
    segs.push({ text: errorPart, isError: true })
    if (after) segs.push({ text: after, isError: false })
    return segs
  }, [q])

  const handleTap = (isError) => {
    if (revealed) return
    setRevealed(true)
    if (isError) setScore((s) => s + 1)
  }

  const next = () => {
    if (idx + 1 >= questions.length) {
      setDone(true)
    } else {
      setIdx(idx + 1)
      setRevealed(false)
    }
  }

  const restart = () => {
    setIdx(0)
    setRevealed(false)
    setScore(0)
    setDone(false)
  }

  if (done) {
    const pct = Math.round((score / questions.length) * 100)
    return (
      <div className="quiz-wrap quiz-result">
        <div className="pct">{pct}% benar</div>
        <div className="score">{score} / {questions.length}</div>
        <p className="sub" style={{ margin: '10px 0 18px' }}>
          {pct >= 80 ? 'Bagus sekali — kamu menguasai pola ini!' : pct >= 50 ? 'Cukup baik. Teruslah berlatih.' : 'Jangan menyerah. Ulangi sekali lagi.'}
        </p>
        <div className="btn-row"><button className="btn" onClick={restart}>Ulangi</button></div>
      </div>
    )
  }

  return (
    <div className="quiz-wrap">
      <div className="progress">
        <div className="progress-fill" style={{ width: `${(idx / questions.length) * 100}%` }} />
      </div>
      <div className="quiz-question" style={{ fontSize: '1rem', marginBottom: 6 }}>
        Temukan bagian yang salah dalam kalimat ini:
      </div>
      <div className="quiz-hint" style={{ marginBottom: 16 }}>
        Ketuk bagian yang mengandung kesalahan tata bahasa
      </div>

      {/* Sentence with tappable segments */}
      <div style={{
        padding: '20px 18px',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        marginBottom: 16,
        lineHeight: 2,
        fontFamily: 'var(--serif)',
        fontSize: '1.15rem',
      }}>
        {segments.map((seg, i) => (
          <span
            key={i}
            onClick={() => handleTap(seg.isError)}
            style={{
              cursor: revealed ? 'default' : 'pointer',
              padding: '4px 6px',
              borderRadius: 'var(--radius-sm)',
              border: revealed
                ? seg.isError
                  ? '2px solid var(--good)'
                  : '2px solid transparent'
                : '2px solid transparent',
              background: revealed
                ? seg.isError
                  ? '#eef5ef'
                  : 'transparent'
                : 'transparent',
              color: revealed
                ? seg.isError
                  ? '#2c5e3c'
                  : 'var(--ink)'
                : 'var(--ink)',
              transition: 'all 0.14s ease',
              fontWeight: revealed && seg.isError ? 700 : 400,
            }}
          >
            {seg.text}
          </span>
        ))}
      </div>

      {revealed && (
        <div>
          <p className={`feedback ${segments.some((s) => s.isError) ? 'good' : 'bad'}`}>
            Bagian yang salah: <strong className="jp">{q.wrongPattern}</strong>
          </p>
          <div className="example" style={{ marginTop: 8 }}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>Kalimat yang benar:</div>
            <span className="jp">{q.originalSentence}</span>
            <span className="id" style={{ display: 'block', marginTop: 2 }}>{q.example.id || q.example.en}</span>
          </div>
          <div style={{ marginTop: 8, fontSize: '0.88rem', color: 'var(--ink-soft)' }}>
            <strong>Pola yang benar:</strong> {q.correctPattern} — {q.grammarItem.meaningId || q.grammarItem.meaning}
          </div>
          <div style={{ fontSize: '0.88rem', color: 'var(--muted)' }}>
            <strong>Pola yang salah:</strong> {q.wrongPattern} — {q.wrongItem.meaningId || q.wrongItem.meaning}
          </div>
          <button className="btn" style={{ marginTop: 12 }} onClick={next}>
            {idx + 1 >= questions.length ? 'Lihat Hasil' : 'Lanjut'}
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────────────────
export default function GrammarDrillView({ levelId, grammar }) {
  const [mode, setMode] = useState('fill')

  const fillQuestions = useMemo(() => buildFillQuestions(grammar), [grammar])
  const reorderQuestions = useMemo(() => buildReorderQuestions(grammar), [grammar])
  const errorQuestions = useMemo(() => buildErrorQuestions(grammar), [grammar])

  // Shuffle questions on mode change
  const shuffledFill = useMemo(() => shuffle(fillQuestions), [fillQuestions])
  const shuffledReorder = useMemo(() => shuffle(reorderQuestions), [reorderQuestions])
  const shuffledError = useMemo(() => shuffle(errorQuestions), [errorQuestions])

  // Limit to a reasonable number of questions per session
  const questions = mode === 'fill'
    ? shuffledFill.slice(0, 10)
    : mode === 'reorder'
      ? shuffledReorder.slice(0, 8)
      : shuffledError.slice(0, 8)

  return (
    <div>
      <div className="tabs">
        {MODES.map((m) => (
          <div
            key={m.id}
            className={`tab ${mode === m.id ? 'active' : ''}`}
            onClick={() => setMode(m.id)}
          >
            {m.label}
          </div>
        ))}
      </div>

      {mode === 'fill' && <FillMode key={`fill-${levelId}`} questions={questions} />}
      {mode === 'reorder' && <ReorderMode key={`reorder-${levelId}`} questions={questions} />}
      {mode === 'error' && <ErrorMode key={`error-${levelId}`} questions={questions} />}
    </div>
  )
}