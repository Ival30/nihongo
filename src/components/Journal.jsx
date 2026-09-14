import { useState, useEffect } from 'react'

// Jurnal belajar pribadi — catatan harian yang tersimpan di localStorage.
// Nama pemilik ditampilkan di header jurnal.
const STORAGE_KEY = 'nihongo_journal_v1'

export function loadJournal() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []
  } catch {
    return []
  }
}

export function saveJournal(entries) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
}

export default function Journal({ ownerName }) {
  const [entries, setEntries] = useState(loadJournal)
  const [draft, setDraft] = useState('')

  useEffect(() => saveJournal(entries), [entries])

  const addEntry = () => {
    const text = draft.trim()
    if (!text) return
    const entry = {
      id: Date.now(),
      date: new Date().toISOString().slice(0, 10),
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      text,
    }
    setEntries((e) => [entry, ...e])
    setDraft('')
  }

  const removeEntry = (id) => setEntries((e) => e.filter((x) => x.id !== id))

  return (
    <div className="journal">
      <div className="journal-header">
        <div className="journal-owner">
          <div className="journal-avatar jp">{ownerName.charAt(0)}</div>
          <div>
            <div className="journal-name">{ownerName}</div>
            <div className="journal-sub">Jurnal Belajar</div>
          </div>
        </div>
        <span className="pill">{entries.length} catatan</span>
      </div>

      <div className="journal-compose">
        <textarea
          className="journal-input"
          placeholder="Tulis catatan belajarmu hari ini…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={3}
        />
        <div className="journal-actions">
          <button className="btn" onClick={addEntry} disabled={!draft.trim()}>Simpan Catatan</button>
        </div>
      </div>

      <div className="journal-list">
        {entries.length === 0 && (
          <p className="sub" style={{ textAlign: 'center', padding: '20px 0' }}>
            Belum ada catatan. Mulai tulis progres belajarmu.
          </p>
        )}
        {entries.map((e) => (
          <div className="journal-entry" key={e.id}>
            <div className="journal-meta">
              <span className="journal-date">{e.date}</span>
              <span className="journal-time">{e.time}</span>
            </div>
            <p className="journal-text">{e.text}</p>
            <button className="mini-btn ghost" onClick={() => removeEntry(e.id)}>Hapus</button>
          </div>
        ))}
      </div>
    </div>
  )
}
