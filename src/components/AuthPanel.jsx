import { useState } from 'react'
import { supabase, isCloudEnabled } from '../supabase.js'

// Panel akun: daftar/masuk email+password, keluar.
// Tanpa cloud → tampil instruksi setup.
export default function AuthPanel({ user, sync, onClose }) {
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [mode, setMode] = useState('login') // login | daftar
  const [msg, setMsg] = useState(null)
  const [busy, setBusy] = useState(false)

  if (!isCloudEnabled || !supabase) {
    return (
      <div className="auth-panel">
        <div className="auth-title">Akun belum aktif</div>
        <p className="sub">Isi VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY di .env (lihat .env.example), lalu jalankan supabase-schema.sql di proyek Supabase.</p>
        <button className="btn ghost" onClick={onClose}>Tutup</button>
      </div>
    )
  }

  if (user) {
    return (
      <div className="auth-panel">
        <div className="auth-title">Akun</div>
        <div className="auth-email">{user.email}</div>
        <p className="sub" style={{ margin: '6px 0 0' }}>{sync || 'Progres tersambung ke cloud.'}</p>
        <div className="btn-row" style={{ justifyContent: 'flex-start', marginTop: 16 }}>
          <button className="btn ghost" onClick={async () => { await supabase.auth.signOut() }}>Keluar</button>
          <button className="btn ghost" onClick={onClose}>Tutup</button>
        </div>
      </div>
    )
  }

  const submit = async (e) => {
    e.preventDefault()
    setMsg(null)
    if (!email.includes('@') || pass.length < 6) {
      setMsg({ ok: false, text: 'Email valid + kata sandi min. 6 karakter.' })
      return
    }
    setBusy(true)
    try {
      if (mode === 'daftar') {
        const { error } = await supabase.auth.signUp({ email: email.trim(), password: pass })
        if (error) throw error
        setMsg({ ok: true, text: 'Akun dibuat. Kamu langsung masuk.' })
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: pass })
        if (error) throw error
      }
    } catch (err) {
      setMsg({ ok: false, text: err.message || 'Gagal masuk.' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-panel">
      <div className="auth-title">{mode === 'daftar' ? 'Buat akun' : 'Masuk'}</div>
      <p className="auth-sub">Progres tersimpan di cloud — lanjut di perangkat mana pun.</p>
      <form onSubmit={submit} className="auth-form">
        <input
          className="auth-input"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          autoFocus
        />
        <input
          className="auth-input"
          type="password"
          placeholder="Kata sandi (min. 6)"
          value={pass}
          onChange={(e) => setPass(e.target.value)}
          autoComplete={mode === 'daftar' ? 'new-password' : 'current-password'}
        />
        {msg && <p className={`auth-msg ${msg.ok ? 'ok' : 'err'}`}>{msg.text}</p>}
        <button className="btn auth-submit" type="submit" disabled={busy}>
          {busy ? 'Tunggu…' : mode === 'daftar' ? 'Daftar' : 'Masuk'}
        </button>
      </form>
      <button className="auth-switch" type="button" onClick={() => { setMode(mode === 'daftar' ? 'login' : 'daftar'); setMsg(null) }}>
        {mode === 'daftar' ? 'Sudah punya akun? Masuk' : 'Belum punya akun? Daftar'}
      </button>
    </div>
  )
}