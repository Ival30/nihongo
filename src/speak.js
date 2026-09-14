// Utilitas text-to-speech Jepang memakai Web Speech API (bawaan browser).
// Tidak butuh API key atau jaringan eksternal.

let jaVoice = null
let voicesReady = false

function findJaVoice() {
  if (!('speechSynthesis' in window)) return null
  const voices = window.speechSynthesis.getVoices()
  if (!voices.length) return null
  // Preferensi: ja-JP murni, lalu apa pun berawalan 'ja'
  return (
    voices.find((v) => v.lang === 'ja-JP') ||
    voices.find((v) => v.lang && v.lang.toLowerCase().startsWith('ja')) ||
    null
  )
}

// Suara kadang dimuat asinkron; coba ambil lagi saat event voiceschanged.
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  const init = () => {
    jaVoice = findJaVoice()
    voicesReady = true
  }
  init()
  window.speechSynthesis.onvoiceschanged = init
}

export function isSpeechSupported() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

export function speak(text, { rate = 0.9 } = {}) {
  if (!isSpeechSupported()) return
  const synth = window.speechSynthesis
  synth.cancel() // hentikan ucapan sebelumnya agar tidak menumpuk

  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'ja-JP'
  if (!jaVoice) jaVoice = findJaVoice()
  if (jaVoice) u.voice = jaVoice
  u.rate = rate
  u.pitch = 1
  synth.speak(u)
}
