import { useState, useMemo } from 'react'
import { kana, flattenKana, KANA_GROUPS } from '../data/kana.js'
import { speak, isSpeechSupported } from '../speak.js'

// Latihan kana: tabel + mode latihan tebak romaji/kana dengan suara.
export default function KanaView({ level }) {
  const [script, setScript] = useState('hiragana')
  const [tab, setTab] = useState('table')
  const [group, setGroup] = useState('basic')

  return (
    <div>
      <PageHeader
        level={level}
        title="Huruf Kana"
        desc="Dasar membaca bahasa Jepang — hiragana dan katakana."
      />

      <div className="tabs">
        <div className={`tab ${script === 'hiragana' ? 'active' : ''}`} onClick={() => setScript('hiragana')}>ひらがな Hiragana</div>
        <div className={`tab ${script === 'katakana' ? 'active' : ''}`} onClick={() => setScript('katakana')}>カタカナ Katakana</div>
      </div>

      <div className="tabs" style={{ marginTop: -8 }}>
        <div className={`tab ${tab === 'table' ? 'active' : ''}`} onClick={() => setTab('table')}>Tabel</div>
        <div className={`tab ${tab === 'practice' ? 'active' : ''}`} onClick={() => setTab('practice')}>Latihan</div>
      </div>

      {tab === 'table' && (
        <KanaTable script={script} group={group} onGroup={setGroup} />
      )}
      {tab === 'practice' && (
        <KanaPractice script={script} />
      )}
    </div>
  )
}

function KanaTable({ script, group, onGroup }) {
  const s = kana[script]
  return (
    <div>
      <div className="kana-groups">
        {KANA_GROUPS.map((g) => (
          <button
            key={g.id}
            className={`mini-btn ${group === g.id ? 'mini-btn-on' : ''}`}
            onClick={() => onGroup(g.id)}
          >
            {g.label}
          </button>
        ))}
      </div>
      <p className="sub" style={{ marginBottom: 14 }}>
        {KANA_GROUPS.find((g) => g.id === group)?.desc}
      </p>
      <div className="kana-grid">
        {s[group].map((item, i) => (
          <button
            key={i}
            className="kana-cell"
            onClick={() => speak(item.k, { rate: 0.8 })}
            title={`Klik untuk dengar: ${item.r}`}
          >
            <span className="kana-char jp">{item.k}</span>
            <span className="kana-romaji">{item.r}</span>
          </button>
        ))}
      </div>
      {!isSpeechSupported() && (
        <p className="sub" style={{ marginTop: 12 }}>Browser-mu tidak mendukung suara.</p>
      )}
    </div>
  )
}

function KanaPractice({ script }) {
  const pool = useMemo(() => flattenKana(script), [script])
  const [idx, setIdx] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [score, setScore] = useState(0)
  const [tried, setTried] = useState(0)

  const item = pool[idx % pool.length]

  const next = (correct) => {
    if (correct) setScore((s) => s + 1)
    setTried((t) => t + 1)
    setRevealed(false)
    setIdx((i) => (i + 1) % pool.length)
  }

  return (
    <div className="kana-practice">
      <div className="kana-practice-card">
        <div className="kana-big jp">{item.k}</div>
        {revealed ? (
          <div className="kana-answer">
            <span className="kana-romaji-big">{item.r}</span>
          </div>
        ) : (
          <div className="kana-question">Sebutkan cara bacanya…</div>
        )}
      </div>

      <div className="btn-row">
        {!revealed ? (
          <>
            <button className="btn ghost" onClick={() => speak(item.k, { rate: 0.8 })}>Dengarkan</button>
            <button className="btn" onClick={() => setRevealed(true)}>Tampilkan Jawaban</button>
          </>
        ) : (
          <>
            <button className="btn grade again" onClick={() => next(false)}>Belum hafal</button>
            <button className="btn grade good" onClick={() => next(true)}>Hafal</button>
          </>
        )}
      </div>

      <div className="kana-progress">
        <span className="sub">
          {idx + 1} / {pool.length} · Benar {score}/{tried}
        </span>
      </div>
    </div>
  )
}

function PageHeader({ level, title, desc }) {
  return (
    <div className="page-header">
      <span className="level-tag" style={{ background: level.color }}>{level.name}</span>
      <h1>{title}</h1>
      <p>{desc}</p>
    </div>
  )
}
