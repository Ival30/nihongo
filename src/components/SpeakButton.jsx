import { speak, isSpeechSupported } from '../speak.js'

// Tombol suara kecil — klik untuk mengucapkan teks Jepang.
// Tampil sebagai ikon speaker SVG (bukan emoji) agar tetap elegan.
export default function SpeakButton({ text, rate, label }) {
  if (!isSpeechSupported() || !text) return null
  return (
    <button
      className="speak-btn"
      onClick={(e) => {
        e.stopPropagation()
        speak(text, { rate })
      }}
      title={label ? `Dengarkan: ${label}` : 'Dengarkan'}
      aria-label="Putar suara"
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M11 5L6 9H3v6h3l5 4V5z"
          fill="currentColor"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path
          d="M15.5 8.5a5 5 0 010 7M18 6a8.5 8.5 0 010 12"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    </button>
  )
}
