import { useEffect, useRef, useState } from 'react'
import { levels } from '../data/levels.js'
import { counts } from '../data/counts.js'
import { getSummary, getSRSStats } from '../srs.js'
import {
  downloadBackup,
  readBackupFile,
  getLastBackupAt,
  ensurePersistentStorage,
} from '../backup.js'

// Halaman kemajuan: ringkasan pengulangan + capaian per tingkat (dari summary tersimpan).
export default function ProgressView({ progress, srs, streak, onRestore }) {
  const srsStats = getSRSStats(srs)
  const summary = getSummary(progress)

  return (
    <div>
      <div className="page-header">
        <h1>Kemajuan Belajar</h1>
        <p>Pantau capaianmu di setiap tingkat dan jadwal pengulangan kartu.</p>
      </div>

      <div className="section-title">Pengulangan Terjadwal</div>
      <div className="card-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}>
        <div className="card"><div className="stat"><span className="num">{srsStats.total}</span><span className="lbl">Total Kartu</span></div></div>
        <div className="card"><div className="stat"><span className="num" style={{ color: 'var(--bad)' }}>{srsStats.due}</span><span className="lbl">Menunggu</span></div></div>
        <div className="card"><div className="stat"><span className="num" style={{ color: '#c88a2e' }}>{srsStats.learning}</span><span className="lbl">Sedang dipelajari</span></div></div>
        <div className="card"><div className="stat"><span className="num" style={{ color: 'var(--good)' }}>{srsStats.mature}</span><span className="lbl">Sudah dikuasai</span></div></div>
      </div>

      <div className="section-title">Capaian per Tingkat</div>
      <div className="list">
        {levels.map((lvl) => {
          const s = summary[lvl.id] || {}
          const v = s.vocab || { seen: 0 }
          const g = s.grammar || { seen: 0 }
          const k = s.kanji || { seen: 0 }
          const seenTotal = v.seen + g.seen + k.seen
          const totalAll = counts.vocab[lvl.id] + counts.grammar[lvl.id] + counts.kanji[lvl.id]
          const pct = totalAll ? Math.round((seenTotal / totalAll) * 100) : 0

          return (
            <div className="item" key={lvl.id}>
              <div className="item-head">
                <span className="level-tag" style={{ background: lvl.color }}>{lvl.name}</span>
                <span className="meaning">{pct}%</span>
              </div>
              <div className="progress" style={{ marginTop: 12 }}>
                <div className="progress-fill" style={{ width: `${pct}%`, background: lvl.color }} />
              </div>
              <div className="stat-row" style={{ marginTop: 12 }}>
                <div className="stat"><span className="num">{v.seen}/{counts.vocab[lvl.id]}</span><span className="lbl">Kosakata</span></div>
                <div className="stat"><span className="num">{g.seen}/{counts.grammar[lvl.id]}</span><span className="lbl">Tata Bahasa</span></div>
                <div className="stat"><span className="num">{k.seen}/{counts.kanji[lvl.id]}</span><span className="lbl">Kanji</span></div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="section-title">Tentang Kemajuan</div>
      <p className="sub" style={{ maxWidth: 560 }}>
        Tandai materi sebagai <em>diketahui</em> di tiap modul untuk menambah capaian,
        atau ulangi lewat kartu hafalan. Skor kuis tersimpan sebagai nilai terbaik per tingkat.
      </p>

      <BackupSection
        progress={progress}
        srs={srs}
        streak={streak}
        onRestore={onRestore}
      />
    </div>
  )
}

// Cadangan data: localStorage ikut hilang saat clear cache — berkas JSON tidak.
function BackupSection({ progress, srs, streak, onRestore }) {
  const fileRef = useRef(null)
  const [msg, setMsg] = useState(null)
  const [lastAt, setLastAt] = useState(getLastBackupAt)
  const [persisted, setPersisted] = useState(null)

  useEffect(() => {
    ensurePersistentStorage().then(setPersisted)
  }, [])

  const onExport = () => {
    downloadBackup(srs, progress, streak)
    setLastAt(Date.now())
    setMsg({ ok: true, text: 'Cadangan diunduh. Simpan berkasnya di tempat aman.' })
  }

  const onImportFile = async (e) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    try {
      const d = await readBackupFile(f)
      onRestore({ srs: d.srs, progress: d.progress, streak: d.streak })
      setMsg({ ok: true, text: 'Cadangan dipulihkan. Progresmu kembali seperti saat diekspor.' })
    } catch (err) {
      setMsg({ ok: false, text: `Gagal memulihkan: ${err.message}` })
    }
  }

  return (
    <div style={{ marginTop: 8 }}>
      <div className="section-title">Cadangan Data</div>
      <p className="sub" style={{ maxWidth: 560, marginBottom: 12 }}>
        Progres tersimpan di browser ini. Kalau cache dihapus, data ikut hilang.
        Unduh cadangan sesekali — atau segera setelah sesi belajar panjang.
        {lastAt && (
          <> Cadangan terakhir diunduh {new Date(lastAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}.</>
        )}
        {persisted === true && <> Browser sudah diminta menjaga data aplikasi ini.</>}
      </p>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button className="btn" onClick={onExport}>Unduh Cadangan</button>
        <button className="btn ghost" onClick={() => fileRef.current?.click()}>Pulihkan dari Berkas</button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          style={{ display: 'none' }}
          onChange={onImportFile}
        />
      </div>
      {msg && (
        <p className="sub" style={{ marginTop: 10, color: msg.ok ? 'var(--good)' : 'var(--bad)' }}>
          {msg.text}
        </p>
      )}
    </div>
  )
}
