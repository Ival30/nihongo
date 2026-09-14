import { levels } from '../data/levels.js'
import { counts } from '../data/counts.js'
import { getSummary, getSRSStats } from '../srs.js'

// Halaman kemajuan: ringkasan pengulangan + capaian per tingkat (dari summary tersimpan).
export default function ProgressView({ progress, srs }) {
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
    </div>
  )
}
