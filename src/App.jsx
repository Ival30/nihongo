import { useState, useMemo, useEffect, useRef } from 'react'
import { levels } from './data/levels.js'
import { counts } from './data/counts.js'
import { vocabOrder } from './data/vocab-order.js'
import { loadLevelData } from './data/index.js'
import { buildQuiz } from './data/quiz.js'
import {
  loadSRS, saveSRS, loadProgress, saveProgress,
  getDueCards, reviewCard, addCards, getSRSStats,
  recordItemProgress, recordQuizProgress,
  loadStreak, saveStreak, recordActivity, isActiveToday,
} from './srs.js'
import Flashcard from './components/Flashcard.jsx'
import SRSReview from './components/SRSReview.jsx'
import ProgressView from './components/ProgressView.jsx'
import SpeakButton from './components/SpeakButton.jsx'
import KanaView from './components/KanaView.jsx'
import Ruby from './components/Ruby.jsx'
import FuriganaText from './components/FuriganaText.jsx'
import ConjugationView from './components/ConjugationView.jsx'
import ListeningView from './components/ListeningView.jsx'
import ExamView from './components/ExamView.jsx'
import DokkaiView from './components/DokkaiView.jsx'
import VocabDrillView from './components/VocabDrillView.jsx'
import GrammarDrillView from './components/GrammarDrillView.jsx'
import GlobalSearchView from './components/GlobalSearchView.jsx'
import StrokeOrder from './components/StrokeOrder.jsx'
import AuthPanel from './components/AuthPanel.jsx'
import { supabase, isCloudEnabled } from './supabase.js'
import { loadCloud, saveCloud, shouldPullCloud } from './cloud.js'

// Navigasi utama — ringkas, tanpa sublabel yang ramai.
const NAV = [
  { id: 'cari', label: 'Cari' },
  { id: 'kana', label: 'Huruf' },
  { id: 'vocab', label: 'Kosakata' },
  { id: 'grammar', label: 'Tata Bahasa' },
  { id: 'kanji', label: 'Kanji' },
  { id: 'dokkai', label: 'Bacaan' },
  { id: 'latihan', label: 'Latihan' },
  { id: 'exam', label: 'Ujian' },
  { id: 'progress', label: 'Kemajuan' },
]


const PAGE_SIZE = 50

// Baca/write state navigasi ke URL hash (format: #/view/level)
function readHash() {
  const h = window.location.hash.replace(/^#\/?/, '')
  const [view, levelId] = h.split('/')
  return { view: view || null, levelId: levelId || null }
}

function writeHash(view, levelId) {
  const next = `#/${view}/${levelId}`
  if (window.location.hash !== next) {
    window.history.replaceState(null, '', next)
  }
}

function getLevel(levelId) {
  return levels.find((l) => l.id === levelId) || levels[0]
}

export default function App() {
  const [view, setView] = useState(() => readHash().view || 'home')
  const [levelId, setLevelId] = useState(() => readHash().levelId || 'n5')
  const [srs, setSrs] = useState(loadSRS)
  const [progress, setProgress] = useState(loadProgress)
  const [levelData, setLevelData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [streak, setStreak] = useState(loadStreak)
  const [user, setUser] = useState(null)
  const [showAuth, setShowAuth] = useState(false)
  const [syncMsg, setSyncMsg] = useState(null)
  const [kainaraPrompt, setKainaraPrompt] = useState(null) // toast Kainara

  // Sesi Supabase: pulihkan + pantau login/logout
  useEffect(() => {
    if (!isCloudEnabled || !supabase) return
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user || null))
    const { data: sub } = supabase.auth.onAuthStateChange((_ev, session) => {
      setUser(session?.user || null)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  // Saat login: tarik cloud, timpa lokal bila cloud isi
  useEffect(() => {
    if (!user || !supabase) return
    let alive = true
    loadCloud(supabase, user.id)
      .then((cloud) => {
        if (!alive || !cloud) return
        setSrs((s) => { const cur = { srs: s, progress }; return shouldPullCloud(cloud, cur) ? (cloud.srs || s) : s })
        setProgress((p) => { const cur = { srs, progress: p }; return shouldPullCloud(cloud, cur) ? (cloud.progress || p) : p })
        if (cloud.streak) setStreak(cloud.streak)
        setSyncMsg('Progres cloud dimuat.')
      })
      .catch(() => setSyncMsg('Gagal muat cloud — pakai data lokal.'))
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  // Saat login + data berubah: dorong ke cloud (debounce 1.5 dtk)
  useEffect(() => {
    if (!user || !supabase) return
    const t = setTimeout(() => {
      saveCloud(supabase, user.id, { srs, progress, streak })
        .then(() => setSyncMsg('Tersimpan di cloud.'))
        .catch(() => setSyncMsg('Gagal simpan cloud — data lokal aman.'))
    }, 1500)
    return () => clearTimeout(t)
  }, [user, srs, progress, streak])

  useEffect(() => saveStreak(streak), [streak])

  // Catat aktivitas belajar → memperbarui streak harian
  const markActivity = () => setStreak((s) => recordActivity(s))

  // Kainara: asisten belajar — muncul setelah user mulai belajar, arahkan ke login
  const KAINARA_SHOWN_KEY = 'nihongo_kainara_shown'
  const triggerKainara = () => {
    if (user) return // sudah login, tidak perlu prompt
    if (localStorage.getItem(KAINARA_SHOWN_KEY)) return // sudah pernah ditampilkan
    const totalLearned = Object.values(progress?.items || {}).reduce((n, type) => n + Object.values(type).filter((v) => v.learned).length, 0)
    if (totalLearned < 3) return // belum cukup belajar
    localStorage.setItem(KAINARA_SHOWN_KEY, '1')
    setKainaraPrompt('learned')
  }
  useEffect(() => { triggerKainara() }, [progress, user])

  const level = getLevel(levelId)
  const showLevel = !['home', 'progress', 'kana', 'cari'].includes(view)

  useEffect(() => saveSRS(srs), [srs])
  useEffect(() => saveProgress(progress), [progress])

  // Persist view & level ke URL hash agar refresh tidak balik ke beranda
  useEffect(() => {
    writeHash(view, levelId)
  }, [view, levelId])

  // Muat data level saat dibutuhkan (bukan home/progress/kana/dokkai)
  const needsData = !['home', 'progress', 'kana', 'dokkai', 'cari'].includes(view)
  useEffect(() => {
    if (!needsData) return
    let alive = true
    setLoading(true)
    loadLevelData(levelId).then((d) => {
      if (alive) { setLevelData(d); setLoading(false) }
    })
    return () => { alive = false }
  }, [needsData, levelId])

  const handleNav = (id) => {
    setView(id)
    window.scrollTo({ top: 0 })
  }

  const handleLevel = (id) => {
    setLevelId(id)
    if (view === 'home') setView('vocab')
  }

  return (
    <div className="app">
      <TopBar
        view={view}
        levelId={levelId}
        showLevel={showLevel}
        dueCount={getSRSStats(srs).due}
        streak={streak}
        user={user}
        onBrand={() => handleNav('home')}
        onNav={handleNav}
        onLevel={handleLevel}
        onAccount={() => setShowAuth((v) => !v)}
      />
      {showAuth && (
        <div style={{ maxWidth: 'var(--maxw)', margin: '0 auto', padding: '18px 30px 0', width: '100%' }}>
          <AuthPanel user={user} sync={syncMsg} onClose={() => setShowAuth(false)} />
        </div>
      )}
      {kainaraPrompt && (
        <KainaraToast
          reason={kainaraPrompt}
          onLogin={() => { setKainaraPrompt(null); setShowAuth(true) }}
          onDismiss={() => setKainaraPrompt(null)}
        />
      )}
      <main className="main">
        {view === 'home' && (
          <Home levelId={levelId} onLevel={setLevelId} progress={progress} srs={srs} onOpen={handleNav} />
        )}

        {view === 'cari' && (
          <GlobalSearchView onOpenLevel={(lid, v) => { setLevelId(lid); handleNav(v) }} />
        )}

        {view === 'kana' && <KanaView level={level} />}

        {view === 'dokkai' && (
          <DokkaiView
            levelId={levelId}
            onFinish={(score, total) => setProgress((p) => recordQuizProgress(p, `dokkai-${levelId}`, score, total))}
          />
        )}

        {needsData && loading && <Loading />}
        {needsData && !loading && levelData && (
          <>
            {view === 'vocab' && (
              <VocabView
                level={level}
                levelId={levelId}
                items={levelData.vocab}
                progress={progress}
                onMark={(key, ok) => { markActivity(); setProgress((p) => recordItemProgress(p, 'vocab', key, levelId, ok)) }}
                onAddToSRS={(batch) => setSrs((s) => addCards(s, 'vocab', batch, (it) => ({ content: it.jp, meta: { reading: it.reading, meaning: it.meaningId || it.meaning, example: it.example, exampleFuri: it.exampleFuri, exampleId: it.exampleId } })))}
              />
            )}
            {view === 'grammar' && (
              <GrammarView
                level={level}
                items={levelData.grammar}
                progress={progress}
                onMark={(key, ok) => { markActivity(); setProgress((p) => recordItemProgress(p, 'grammar', key, levelId, ok)) }}
                onAddToSRS={(batch) => setSrs((s) => addCards(s, 'grammar', batch, (it) => ({ content: it.pattern, meta: { meaning: it.meaningId || it.meaning, example: it.example, exampleId: it.exampleId } })))}
              />
            )}
            {view === 'kanji' && (
              <KanjiView
                level={level}
                items={levelData.kanji}
                progress={progress}
                onMark={(key, ok) => { markActivity(); setProgress((p) => recordItemProgress(p, 'kanji', key, levelId, ok)) }}
                onAddToSRS={(batch) => setSrs((s) => addCards(s, 'kanji', batch, (it) => ({ content: it.char, meta: { meaning: it.meaningId || it.meaning, on: it.on, kun: it.kun } })))}
              />
            )}
            {view === 'latihan' && (
              <PracticeView
                level={level}
                levelData={levelData}
                levelId={levelId}
                srs={srs}
                onReview={(id, q) => { markActivity(); setSrs((s) => reviewCard(s, id, q)) }}
                onFinish={(score, total) => { markActivity(); setProgress((p) => recordQuizProgress(p, levelId, score, total)) }}
              />
            )}
            {view === 'exam' && (
              <ExamView
                level={level}
                levelData={levelData}
                levelId={levelId}
                onFinish={(score, total) => { markActivity(); setProgress((p) => recordQuizProgress(p, levelId, score, total)) }}
              />
            )}
          </>
        )}

        {view === 'progress' && (
          <ProgressView
            progress={progress}
            srs={srs}
            streak={streak}
            onRestore={(d) => {
              if (d.srs) setSrs(d.srs)
              if (d.progress) setProgress(d.progress)
              if (d.streak) setStreak(d.streak)
            }}
          />
        )}
      </main>
    </div>
  )
}

function Loading() {
  return <p className="sub" style={{ padding: '40px 0', textAlign: 'center' }}>Memuat materi…</p>
}

function useTheme() {
  const [dark, setDark] = useState(() => {
    const stored = localStorage.getItem('nihongo_theme')
    if (stored) return stored === 'dark'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('nihongo_theme', dark ? 'dark' : 'light')
  }, [dark])

  return [dark, setDark]
}

function TopBar({ view, levelId, showLevel, dueCount, streak, user, onBrand, onNav, onLevel, onAccount }) {
  const [dark, setDark] = useTheme()
  return (
    <header className="topbar">
      <div className="brand" onClick={onBrand}>
        <span className="brand-ja">日本語</span>
      </div>

      <nav className="nav-links">
        {NAV.map((n) => (
          <button
            key={n.id}
            className={`nav-link ${view === n.id ? 'active' : ''}`}
            onClick={() => onNav(n.id)}
          >
            {n.label}
          </button>
        ))}
      </nav>

      <div className="topbar-right">
        <button className="theme-toggle" onClick={() => setDark(d => !d)} title={dark ? 'Light mode' : 'Dark mode'}>
          {dark ? (
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="5"/><g stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></g></svg>
          ) : (
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
          )}
        </button>
        <button className="btn ghost" style={{ padding: '6px 12px' }} onClick={onAccount} title={user ? user.email : 'Masuk / Daftar'}>
          {user ? user.email.split('@')[0] : 'Masuk'}
        </button>
        {streak?.current > 0 && (
          <span className="streak-chip" title={`Rentetan belajar: ${streak.current} hari (terbaik ${streak.best})`}>
            {streak.current}
          </span>
        )}
        {dueCount > 0 && view !== 'latihan' && (
          <button className="review-chip" onClick={() => onNav('latihan')}>
            {dueCount}
          </button>
        )}
        {showLevel && (
          <div className="level-pills">
            {levels.map((l) => (
              <button
                key={l.id}
                className={`level-pill ${levelId === l.id ? 'active' : ''}`}
                onClick={() => onLevel(l.id)}
              >
                {l.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </header>
  )
}

// Kartu ringkasan harian: apa yang perlu dikerjakan hari ini.
function TodayCard({ levelId, progress, srs, onOpen }) {
  const stats = getSRSStats(srs)
  const summary = progress.summary || {}
  const lvlSummary = summary[levelId] || {}
  const vocabLearned = lvlSummary.vocab?.seen || 0
  const grammarLearned = lvlSummary.grammar?.seen || 0
  const kanjiLearned = lvlSummary.kanji?.seen || 0
  const totalLearned = vocabLearned + grammarLearned + kanjiLearned
  const level = getLevel(levelId)

  // Saran langkah berikutnya, berurutan prioritas
  let cta = null
  if (stats.due > 0) {
    cta = { label: `Ulangi ${stats.due} kartu`, view: 'latihan', hint: 'Kartu sudah waktunya diulang' }
  } else if (totalLearned === 0) {
    cta = { label: 'Mulai dari kosakata', view: 'vocab', hint: `${level.name} — kata paling sering dipakai` }
  } else {
    cta = { label: 'Lanjut belajar', view: 'vocab', hint: `${level.name} — lanjutkan materi berikutnya` }
  }

  return (
    <div className="today-card">
      <div className="today-head">
        <span className="today-label">Hari ini</span>
        <span className="level-tag" style={{ background: level.color }}>{level.name}</span>
      </div>
      <div className="today-stats">
        <div className="today-stat">
          <span className="num">{stats.due}</span>
          <span className="lbl">kartu menunggu</span>
        </div>
        <div className="today-stat">
          <span className="num">{vocabLearned}</span>
          <span className="lbl">kosakata dikuasai</span>
        </div>
        <div className="today-stat">
          <span className="num">{grammarLearned}</span>
          <span className="lbl">tata bahasa</span>
        </div>
        <div className="today-stat">
          <span className="num">{kanjiLearned}</span>
          <span className="lbl">kanji</span>
        </div>
      </div>
      <button className="btn today-cta" onClick={() => onOpen(cta.view)}>{cta.label}</button>
      <p className="today-hint">{cta.hint}</p>
    </div>
  )
}

function Home({ levelId, onLevel, progress, srs, onOpen }) {
  return (
    <div>
      <div className="home-hero">
        <div className="seal jp">日</div>
        <h1>Belajar Bahasa Jepang, dari N5 sampai N1</h1>
        <p>
          Kosakata, tata bahasa, dan kanji disusun bertahap sesuai standar JLPT —
          lengkap dengan kartu hafalan, pengulangan terjadwal, dan kuis.
        </p>
      </div>

      <TodayCard levelId={levelId} progress={progress} srs={srs} onOpen={onOpen} />

      <div className="section-title">Pilih Tingkat</div>
      <div className="card-grid">
        {levels.map((l) => (
          <div
            key={l.id}
            className="card clickable"
            onClick={() => onLevel(l.id)}
            style={l.id === levelId ? { borderColor: l.color } : {}}
          >
            <span className="level-tag" style={{ background: l.color }}>{l.name}</span>
            <h3>{l.title}</h3>
            <p className="sub">{l.description}</p>
            <div className="stat-row">
              <div className="stat"><span className="num">{counts.vocab[l.id].toLocaleString('id-ID')}</span><span className="lbl">Kosakata</span></div>
              <div className="stat"><span className="num">{counts.grammar[l.id].toLocaleString('id-ID')}</span><span className="lbl">Tata Bahasa</span></div>
              <div className="stat"><span className="num">{counts.kanji[l.id].toLocaleString('id-ID')}</span><span className="lbl">Kanji</span></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function usePagination(items, size = PAGE_SIZE) {
  const [page, setPage] = useState(0)
  const totalPages = Math.max(1, Math.ceil(items.length / size))
  const safePage = Math.min(page, totalPages - 1)
  const slice = items.slice(safePage * size, safePage * size + size)
  return { slice, page: safePage, totalPages, setPage }
}

function Pagination({ page, totalPages, setPage }) {
  if (totalPages <= 1) return null
  return (
    <div className="pagination">
      <button className="page-btn" disabled={page === 0} onClick={() => setPage(page - 1)}>← Sebelumnya</button>
      <span className="page-info">{page + 1} / {totalPages}</span>
      <button className="page-btn" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>Berikutnya →</button>
    </div>
  )
}

function VocabView({ level, levelId, items, progress, onMark, onAddToSRS }) {
  const [q, setQ] = useState('')
  const [hideLearned, setHideLearned] = useState(false)
  const records = progress.items?.vocab || {}
  const isLearned = (jp) => !!records[jp]?.learned

  // Urutkan berdasarkan frekuensi pemakaian nyata (bukan alfabetis)
  const ordered = useMemo(() => {
    const order = vocabOrder[levelId]
    if (!order) return items
    const pos = new Map(order.map((jp, i) => [jp, i]))
    return [...items].sort((a, b) => {
      const pa = pos.has(a.jp) ? pos.get(a.jp) : 1e9
      const pb = pos.has(b.jp) ? pos.get(b.jp) : 1e9
      return pa - pb
    })
  }, [items, levelId])

  // Filter pencarian
  const matched = useMemo(
    () => ordered.filter((i) => (i.jp + i.reading + i.meaning + (i.meaningId || '')).toLowerCase().includes(q.toLowerCase())),
    [ordered, q],
  )

  // Sort: belum dipelajari dulu, lalu yang sudah dipelajari. Lalu filter bila "sembunyikan".
  const filtered = useMemo(() => {
    const sorted = [...matched].sort((a, b) => {
      const la = isLearned(a.jp) ? 1 : 0
      const lb = isLearned(b.jp) ? 1 : 0
      return la - lb
    })
    return hideLearned ? sorted.filter((i) => !isLearned(i.jp)) : sorted
  }, [matched, records, hideLearned])

  const { slice, page, totalPages, setPage } = usePagination(filtered)
  const learnedCount = items.filter((i) => isLearned(i.jp)).length

  return (
    <div>
      <PageHeader
        level={level}
        title="Kosakata"
        desc={`${items.length.toLocaleString('id-ID')} kata · ${learnedCount} dipelajari`}
      />
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
        <input className="search" placeholder="Cari kata…" value={q} onChange={(e) => { setQ(e.target.value); setPage(0) }} />
        <button className="btn ghost" onClick={() => onAddToSRS(items.slice(0, 100))}>+100 kata ke kartu</button>
      </div>
      <label className="hide-toggle">
        <input type="checkbox" checked={hideLearned} onChange={(e) => { setHideLearned(e.target.checked); setPage(0) }} />
        Sembunyikan yang sudah dipelajari
      </label>
      <div className="list">
        {slice.map((item, i) => {
          const rec = records[item.jp]
          const learned = !!rec?.learned
          return (
            <div className={`item ${learned ? 'item-learned' : ''}`} key={i}>
              <div className="item-head">
                <span className="jp-main jp"><Ruby text={item.jp} reading={item.reading} /></span>
                <span className="reading jp">{item.reading}</span>
                <SpeakButton text={item.jp} label={item.jp} />
                <span className="meaning">{item.meaningId || item.meaning}</span>
              </div>
              {item.meaningId && <div className="id-en">{item.meaning}</div>}
              {item.example && (
                <div className="example">
                  <span className="ex-jp-row">
                    <span className="jp">{item.exampleFuri ? <FuriganaText text={item.exampleFuri} /> : item.example}</span>
                    <SpeakButton text={item.example} label={item.example} />
                  </span>
                  {item.exampleRomaji && <span className="rm">{item.exampleRomaji}</span>}
                  <span className="id">{item.exampleId}</span>
                </div>
              )}
              <div className="item-actions">
                <button className={`mini-btn ${learned ? 'mini-btn-on' : ''}`} onClick={() => onMark(item.jp, true)}>Tahu</button>
                <button className="mini-btn ghost" onClick={() => onMark(item.jp, false)}>Belum</button>
                {learned && <span className="pill" style={{ color: 'var(--good)' }}>Dipelajari</span>}
              </div>
            </div>
          )
        })}
        {slice.length === 0 && <p className="sub">Tidak ditemukan.</p>}
      </div>
      <Pagination page={page} totalPages={totalPages} setPage={setPage} />
    </div>
  )
}

function GrammarView({ level, items, progress, onMark, onAddToSRS }) {
  const [hideLearned, setHideLearned] = useState(false)
  const records = progress.items?.grammar || {}
  const isLearned = (pattern) => !!records[pattern]?.learned

  const filtered = useMemo(() => {
    const sorted = [...items].sort((a, b) => {
      const la = isLearned(a.pattern) ? 1 : 0
      const lb = isLearned(b.pattern) ? 1 : 0
      return la - lb
    })
    return hideLearned ? sorted.filter((i) => !isLearned(i.pattern)) : sorted
  }, [items, records, hideLearned])

  const { slice, page, totalPages, setPage } = usePagination(filtered)
  const learnedCount = items.filter((i) => isLearned(i.pattern)).length

  return (
    <div>
      <PageHeader level={level} title="Tata Bahasa" desc={`${items.length.toLocaleString('id-ID')} pola · ${learnedCount} dipelajari`} />
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
        <button className="btn ghost" onClick={() => onAddToSRS(items.slice(0, 100))}>+100 pola ke kartu</button>
      </div>
      <label className="hide-toggle">
        <input type="checkbox" checked={hideLearned} onChange={(e) => { setHideLearned(e.target.checked); setPage(0) }} />
        Sembunyikan yang sudah dipelajari
      </label>
      <div className="list">
        {slice.map((item, i) => {
          const learned = !!records[item.pattern]?.learned
          return (
            <div className={`item ${learned ? 'item-learned' : ''}`} key={i}>
              <div className="item-head">
                <span className="jp-main jp">{item.pattern}</span>
                <SpeakButton text={item.pattern} label={item.pattern} />
                <span className="meaning">{item.meaningId || item.meaning}</span>
              </div>
              {item.meaningId && <div className="id-en">{item.meaning}</div>}
              {item.formation && (
                <div style={{ marginTop: 6 }}>
                  <span className="pill">Pembentukan</span>
                  <span className="sub">{item.formationId || item.formation}</span>
                </div>
              )}
              {item.examples && item.examples.length > 0 && (
                <div className="examples">
                  {item.examples.map((ex, j) => (
                    <div className="example" key={j}>
                      <span className="ex-jp-row">
                        <span className="jp">{ex.jp}</span>
                        <SpeakButton text={ex.jp} label={ex.jp} />
                      </span>
                      {ex.romaji && <span className="rm">{ex.romaji}</span>}
                      <span className="id">{ex.id || ex.en}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="item-actions">
                <button className={`mini-btn ${learned ? 'mini-btn-on' : ''}`} onClick={() => onMark(item.pattern, true)}>Tahu</button>
                <button className="mini-btn ghost" onClick={() => onMark(item.pattern, false)}>Belum</button>
                {learned && <span className="pill" style={{ color: 'var(--good)' }}>Dipelajari</span>}
              </div>
            </div>
          )
        })}
      </div>
      <Pagination page={page} totalPages={totalPages} setPage={setPage} />
    </div>
  )
}

function KanjiView({ level, items, progress, onMark, onAddToSRS }) {
  const [openStroke, setOpenStroke] = useState(null)
  const toggleStroke = (ch) => setOpenStroke((cur) => (cur === ch ? null : ch))
  const [hideLearned, setHideLearned] = useState(false)
  const records = progress.items?.kanji || {}
  const isLearned = (char) => !!records[char]?.learned

  const filtered = useMemo(() => {
    const sorted = [...items].sort((a, b) => {
      const la = isLearned(a.char) ? 1 : 0
      const lb = isLearned(b.char) ? 1 : 0
      return la - lb
    })
    return hideLearned ? sorted.filter((i) => !isLearned(i.char)) : sorted
  }, [items, records, hideLearned])

  const { slice, page, totalPages, setPage } = usePagination(filtered, 100)
  const learnedCount = items.filter((i) => isLearned(i.char)).length

  return (
    <div>
      <PageHeader level={level} title="Kanji" desc={`${items.length.toLocaleString('id-ID')} kanji · ${learnedCount} dipelajari`} />
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
        <button className="btn ghost" onClick={() => onAddToSRS(items.slice(0, 100))}>+100 kanji ke kartu</button>
      </div>
      <label className="hide-toggle">
        <input type="checkbox" checked={hideLearned} onChange={(e) => { setHideLearned(e.target.checked); setPage(0) }} />
        Sembunyikan yang sudah dipelajari
      </label>
      <div className="kanji-grid">
        {slice.map((k, i) => {
          const learned = !!records[k.char]?.learned
          return (
            <div className={`kanji-card ${learned ? 'item-learned' : ''}`} key={i}>
              <div className="kanji-char jp">{k.char}</div>
              <div style={{ display: 'flex', justifyContent: 'center', margin: '6px 0 2px' }}>
                <SpeakButton text={k.char} label={k.char} />
              </div>
              <div className="kanji-meaning">{(k.meaningId || k.meaning).split(',')[0]}</div>
              {k.meaningId && <div className="kanji-meaning-en">{k.meaning.split(',')[0]}</div>}
              <div className="kanji-meta">
                <span className="row">On: {k.on}</span>
                <span className="row">Kun: {k.kun}</span>
                {k.strokes > 0 && <span className="row">{k.strokes} coretan</span>}
              </div>
              <button className="mini-btn stroke-toggle" onClick={() => toggleStroke(k.char)}>
                {openStroke === k.char ? 'Tutup' : 'Urutan goresan'}
              </button>
              {openStroke === k.char && <StrokeOrder char={k.char} size={170} />}
              <div className="item-actions" style={{ justifyContent: 'center' }}>
                <button className={`mini-btn ${learned ? 'mini-btn-on' : ''}`} onClick={() => onMark(k.char, true)}>Tahu</button>
                <button className="mini-btn ghost" onClick={() => onMark(k.char, false)}>Belum</button>
              </div>
            </div>
          )
        })}
      </div>
      <Pagination page={page} totalPages={totalPages} setPage={setPage} />
    </div>
  )
}

function PracticeView({ level, levelData, levelId, srs, onReview, onFinish }) {
  const [sub, setSub] = useState('flashcard')
  // Hook dipanggil di level atas komponen (bukan di dalam JSX kondisional)
  const dueCards = useMemo(() => getDueCards(srs, 50), [srs])
  return (
    <div>
      <PageHeader
        level={level}
        title="Latihan"
        desc="Kartu hafalan, pengulangan terjadwal, dan kuis untuk mengasah ingatan."
      />
      <div className="tabs">
        <div className={`tab ${sub === 'flashcard' ? 'active' : ''}`} onClick={() => setSub('flashcard')}>Kartu</div>
        <div className={`tab ${sub === 'srs' ? 'active' : ''}`} onClick={() => setSub('srs')}>Ulang</div>
        <div className={`tab ${sub === 'conj' ? 'active' : ''}`} onClick={() => setSub('conj')}>Konjugasi</div>
        <div className={`tab ${sub === 'listen' ? 'active' : ''}`} onClick={() => setSub('listen')}>Dengar</div>
        <div className={`tab ${sub === 'quiz' ? 'active' : ''}`} onClick={() => setSub('quiz')}>Kuis</div>
        <div className={`tab ${sub === 'drill' ? 'active' : ''}`} onClick={() => setSub('drill')}>Latih Kata</div>
        <div className={`tab ${sub === 'grammar-drill' ? 'active' : ''}`} onClick={() => setSub('grammar-drill')}>Latih Tata Bahasa</div>
      </div>

      {sub === 'flashcard' && (
        <FlashcardView level={level} vocab={levelData.vocab} grammar={levelData.grammar} kanji={levelData.kanji} />
      )}
      {sub === 'srs' && (
        <SRSReview cards={dueCards} onReview={onReview} onDone={() => setSub('flashcard')} />
      )}
      {sub === 'conj' && (
        <ConjugationView levelId={levelId} />
      )}
      {sub === 'listen' && (
        <ListeningView levelId={levelId} vocab={levelData.vocab} />
      )}
      {sub === 'quiz' && (
        <QuizView level={level} data={levelData} levelId={levelId} onFinish={onFinish} />
      )}
      {sub === 'drill' && (
        <VocabDrillView levelId={levelId} vocab={levelData.vocab} />
      )}
      {sub === 'grammar-drill' && (
        <GrammarDrillView levelId={levelId} grammar={levelData.grammar} />
      )}
    </div>
  )
}

function FlashcardView({ level, vocab, grammar, kanji }) {
  const [mode, setMode] = useState('vocab')
  const [idx, setIdx] = useState(0)
  const [shuffled, setShuffled] = useState(false)

  const pool = useMemo(() => {
    const arr = mode === 'vocab' ? vocab : mode === 'grammar' ? grammar : kanji
    if (!shuffled) return arr
    const a = [...arr]
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[a[i], a[j]] = [a[j], a[i]]
    }
    return a
  }, [mode, vocab, grammar, kanji, shuffled])

  const item = pool.length ? pool[idx % pool.length] : null
  const nav = (dir) => setIdx((i) => (i + dir + pool.length) % pool.length)
  const switchMode = (m) => { setMode(m); setIdx(0); setShuffled(false) }

  if (!item) return <p className="sub">Belum ada materi untuk kartu hafalan di tingkat ini.</p>

  return (
    <div>
      <div className="tabs" style={{ marginTop: -6 }}>
        <div className={`tab ${mode === 'vocab' ? 'active' : ''}`} onClick={() => switchMode('vocab')}>Kosakata</div>
        <div className={`tab ${mode === 'grammar' ? 'active' : ''}`} onClick={() => switchMode('grammar')}>Tata Bahasa</div>
        <div className={`tab ${mode === 'kanji' ? 'active' : ''}`} onClick={() => switchMode('kanji')}>Kanji</div>
      </div>

      {mode === 'vocab' && item && <Flashcard resetKey={idx} front={item.jp} frontSub={item.reading} back={item.meaningId || item.meaning} />}
      {mode === 'grammar' && item && <Flashcard resetKey={idx} front={item.pattern} frontSub={item.formationId || item.formation} back={item.meaningId || item.meaning} backSub={item.exampleId || item.example} />}
      {mode === 'kanji' && item && <Flashcard resetKey={idx} front={item.char} frontSub={item.strokes > 0 ? `${item.strokes} coretan` : ''} back={(item.meaningId || item.meaning).split(',')[0]} backSub={`On: ${item.on} · Kun: ${item.kun}`} />}

      <div className="btn-row">
        <button className="btn ghost" onClick={() => nav(-1)}>←</button>
        <span className="sub" style={{ alignSelf: 'center', minWidth: 90, textAlign: 'center' }}>{idx + 1} / {pool.length}</span>
        <button className="btn ghost" onClick={() => nav(1)}>→</button>
        <button className="btn ghost" onClick={() => { setShuffled(!shuffled); setIdx(0) }}>{shuffled ? 'Urutkan' : 'Acak'}</button>
      </div>
    </div>
  )
}

function QuizView({ level, data, levelId, onFinish }) {
  const quiz = useMemo(() => buildQuiz(levelId, data, 8), [levelId])
  const [idx, setIdx] = useState(0)
  const [picked, setPicked] = useState(null)
  const [score, setScore] = useState(0)
  const [done, setDone] = useState(false)

  const reported = useRef(false)

  const restart = () => {
    reported.current = false
    setIdx(0); setPicked(null); setScore(0); setDone(false)
  }

  // Ganti tingkat → mulai kuis dari awal
  useEffect(() => { restart() }, [levelId])

  // Laporkan skor sekali saat kuis selesai (bukan saat render)
  useEffect(() => {
    if (done && !reported.current) {
      reported.current = true
      onFinish(score, quiz.length)
    }
  }, [done, score, quiz.length, onFinish])

  if (quiz.length === 0) return <p className="sub">Tidak ada soal.</p>

  if (done) {
    const pct = Math.round((score / quiz.length) * 100)
    return (
      <div className="quiz-wrap quiz-result">
        <div className="pct">{pct}% benar</div>
        <div className="score">{score} / {quiz.length}</div>
        <p className="sub" style={{ margin: '10px 0 18px' }}>
          {pct >= 80 ? 'Bagus sekali — kamu sudah menguasai tingkat ini.' : pct >= 50 ? 'Cukup baik. Teruslah berlatih.' : 'Jangan menyerah. Ulangi sekali lagi.'}
        </p>
        <div className="btn-row"><button className="btn" onClick={restart}>Ulangi Kuis</button></div>
      </div>
    )
  }

  const q = quiz[idx]

  const pick = (opt) => {
    if (picked) return
    setPicked(opt)
    if (opt === q.answer) setScore((s) => s + 1)
  }

  const next = () => {
    if (idx + 1 >= quiz.length) setDone(true)
    else { setIdx(idx + 1); setPicked(null) }
  }

  return (
    <div className="quiz-wrap">
      <div className="progress"><div className="progress-fill" style={{ width: `${(idx / quiz.length) * 100}%` }} /></div>
      <div className="quiz-question jp">{q.question}</div>
      {q.hint && <div className="quiz-hint">{q.hint}</div>}
      <div>
        {q.options.map((opt, i) => {
          let cls = 'option'
          if (picked) {
            if (opt === q.answer) cls += ' correct'
            else if (opt === picked) cls += ' wrong'
          }
          return <button key={i} className={cls} onClick={() => pick(opt)} disabled={!!picked}>{opt}</button>
        })}
      </div>
      {picked && (
        <div>
          <p className={`feedback ${picked === q.answer ? 'good' : 'bad'}`}>
            {picked === q.answer ? 'Benar.' : `Kurang tepat — jawabannya: ${q.answer}`}
          </p>
          <button className="btn" style={{ marginTop: 12 }} onClick={next}>
            {idx + 1 >= quiz.length ? 'Lihat Hasil' : 'Lanjut'}
          </button>
        </div>
      )}
    </div>
  )
}

function PageHeader({ level, title, desc }) {
  return (
    <div className="page-header">
      <h1>{title}</h1>
      <p>{desc}</p>
    </div>
  )
}

// Kainara — asisten belajar yang muncul saat user mulai aktif
const KAINARA_MESSAGES = {
  learned: {
    greeting: 'Hai, aku Kainara! 🎌',
    body: 'Kamu sudah mulai belajar — hebat! Supaya progresmu tidak hilang kalau ganti perangkat, yuk simpan di akun.',
    cta: 'Simpan Progres',
  },
}

function KainaraToast({ reason, onLogin, onDismiss }) {
  const msg = KAINARA_MESSAGES[reason] || KAINARA_MESSAGES.learned
  const [leaving, setLeaving] = useState(false)
  const dismiss = () => { setLeaving(true); setTimeout(onDismiss, 300) }
  return (
    <div className={`kainara-overlay ${leaving ? 'leaving' : ''}`} onClick={dismiss}>
      <div className="kainara-card" onClick={(e) => e.stopPropagation()}>
        <div className="kainara-greeting">{msg.greeting}</div>
        <p className="kainara-body">{msg.body}</p>
        <div className="btn-row" style={{ justifyContent: 'flex-start', marginTop: 14 }}>
          <button className="btn" onClick={onLogin}>{msg.cta}</button>
          <button className="btn ghost" onClick={dismiss}>Nanti saja</button>
        </div>
      </div>
    </div>
  )
}
