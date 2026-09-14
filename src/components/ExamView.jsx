import { useState, useMemo, useEffect, useRef } from 'react'
import { buildQuiz, buildListeningQuiz } from '../data/quiz.js'
import { speak } from '../speak.js'

// Mode Ujian JLPT: simulasi ujian sungguhan dengan timer, beberapa seksi,
// dan laporan skor akhir. Format disederhanakan tapi menyerupai JLPT asli.

const SECTIONS = [
  { id: 'vocab', label: 'Kosakata', duration: 20 },  // menit
  { id: 'grammar', label: 'Tata Bahasa', duration: 20 },
  { id: 'kanji', label: 'Kanji', duration: 15 },
  { id: 'listening', label: 'Mendengarkan', duration: 15 },
]

const QUESTIONS_PER_SECTION = 10

function formatTime(sec) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function ExamView({ level, levelData, levelId, onFinish }) {
  const [phase, setPhase] = useState('intro') // intro | running | done
  const [section, setSection] = useState(0)
  const [qIdx, setQIdx] = useState(0)
  const [picked, setPicked] = useState(null)
  const [answers, setAnswers] = useState([]) // [{correct, section}]
  const [timeLeft, setTimeLeft] = useState(0)

  // Bangun soal per seksi
  const sectionQuizzes = useMemo(() => {
    const all = buildQuiz(levelId, levelData, QUESTIONS_PER_SECTION)
    const listening = buildListeningQuiz(levelId, levelData.vocab, QUESTIONS_PER_SECTION)
    return SECTIONS
      .map((s) => ({
        ...s,
        questions: s.id === 'listening' ? listening : all.filter((q) => q.type === s.id),
      }))
      // buang seksi tanpa soal (mis. contoh kalimat belum cukup untuk mendengarkan)
      .filter((s) => s.questions.length > 0)
  }, [levelId, levelData])

  // Laporkan skor sekali saat ujian selesai (setelah state answers final)
  const reported = useRef(false)
  useEffect(() => {
    if (phase !== 'done' || reported.current) return
    reported.current = true
    if (onFinish) onFinish(answers.filter((a) => a.correct).length, answers.length)
  }, [phase, answers, onFinish])

  // Timer
  useEffect(() => {
    if (phase !== 'running') return
    if (timeLeft <= 0) { nextSection(true); return }
    const t = setTimeout(() => setTimeLeft((v) => v - 1), 1000)
    return () => clearTimeout(t)
  }, [phase, timeLeft])

  const startExam = () => {
    reported.current = false
    setPhase('running')
    setSection(0)
    setQIdx(0)
    setPicked(null)
    setAnswers([])
    setTimeLeft(SECTIONS[0].duration * 60)
  }

  const currentSection = sectionQuizzes[section]
  const question = currentSection?.questions[qIdx]
  const isListening = currentSection?.id === 'listening'

  // Soal mendengarkan diputar otomatis saat muncul
  useEffect(() => {
    if (phase === 'running' && isListening && question?.audio) speak(question.audio)
  }, [phase, isListening, question])

  const pick = (opt) => {
    if (picked) return
    setPicked(opt)
    const correct = opt === question.answer
    setAnswers((a) => [...a, { correct, section: currentSection.id }])
  }

  const nextQuestion = () => {
    if (qIdx + 1 >= currentSection.questions.length) {
      nextSection(false)
    } else {
      setQIdx((i) => i + 1)
      setPicked(null)
    }
  }

  const nextSection = (timedOut) => {
    if (section + 1 >= sectionQuizzes.length) {
      setPhase('done')
    } else {
      const next = section + 1
      setSection(next)
      setQIdx(0)
      setPicked(null)
      setTimeLeft(SECTIONS[next].duration * 60)
    }
  }

  // --- Intro ---
  if (phase === 'intro') {
    return (
      <div className="quiz-wrap quiz-result">
        <span className="level-tag" style={{ background: level.color }}>{level.name}</span>
        <h2 style={{ margin: '10px 0 6px' }}>Ujian JLPT {level.name}</h2>
        <p className="sub" style={{ maxWidth: 420, margin: '0 auto 18px' }}>
          Simulasi ujian dengan {sectionQuizzes.length} seksi dan batas waktu. Total{' '}
          {sectionQuizzes.reduce((n, s) => n + s.questions.length, 0)} soal.
        </p>
        <div className="exam-sections">
          {sectionQuizzes.map((s) => (
            <div className="exam-section-row" key={s.id}>
              <span>{s.label}</span>
              <span className="sub">{s.questions.length} soal · {s.duration} menit</span>
            </div>
          ))}
        </div>
        <div className="btn-row">
          <button className="btn" onClick={startExam}>Mulai Ujian</button>
        </div>
      </div>
    )
  }

  // --- Done ---
  if (phase === 'done') {
    const total = answers.length
    const score = answers.filter((a) => a.correct).length
    const pct = total ? Math.round((score / total) * 100) : 0
    // skor per seksi
    const bySection = {}
    for (const a of answers) {
      if (!bySection[a.section]) bySection[a.section] = { correct: 0, total: 0 }
      bySection[a.section].total++
      if (a.correct) bySection[a.section].correct++
    }
    return (
      <div className="quiz-wrap quiz-result">
        <div className="pct">{pct}% benar</div>
        <div className="score">{score} / {total}</div>
        <p className="sub" style={{ margin: '10px 0 18px' }}>
          {pct >= 80 ? 'Lulus! Kamu menguasai tingkat ini.' : pct >= 50 ? 'Hampir — terus berlatih.' : 'Belum lulus. Jangan menyerah.'}
        </p>
        <div className="exam-sections">
          {sectionQuizzes.map((s) => {
            const r = bySection[s.id] || { correct: 0, total: 0 }
            return (
              <div className="exam-section-row" key={s.id}>
                <span>{s.label}</span>
                <span className="sub">{r.correct}/{r.total}</span>
              </div>
            )
          })}
        </div>
        <div className="btn-row">
          <button className="btn" onClick={startExam}>Ulangi Ujian</button>
        </div>
      </div>
    )
  }

  // --- Running ---
  return (
    <div className="quiz-wrap">
      <div className="exam-header">
        <span className="pill">Seksi {section + 1}/{SECTIONS.length}: {currentSection.label}</span>
        <span className={`exam-timer ${timeLeft < 60 ? 'warn' : ''}`}>⏱ {formatTime(timeLeft)}</span>
      </div>
      <div className="progress">
        <div
          className="progress-fill"
          style={{ width: `${(qIdx / currentSection.questions.length) * 100}%` }}
        />
      </div>

      {isListening ? (
        <div className="listen-card">
          <button className="listen-play" onClick={() => speak(question.audio)} aria-label="Putar ulang">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>
          <div className="listen-hint">Putar ulang dan pilih artinya</div>
          {picked && <div className="listen-placeholder jp">{question.audio}</div>}
        </div>
      ) : (
        <>
          <div className="quiz-question jp">{question.question}</div>
          {question.hint && <div className="quiz-hint">{question.hint}</div>}
        </>
      )}
      <div>
        {question.options.map((opt, i) => {
          let cls = 'option'
          if (picked) {
            if (opt === question.answer) cls += ' correct'
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
        <button className="btn" style={{ marginTop: 12 }} onClick={nextQuestion}>
          {qIdx + 1 >= currentSection.questions.length ? 'Seksi Berikutnya' : 'Lanjut'}
        </button>
      )}
    </div>
  )
}
