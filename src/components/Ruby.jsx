// Furigana: render teks Jepang dengan cara baca kecil di atas kanji (ruby).
// Memisahkan kanji di awal kata dari okurigana (akhiran kana) agar ruby-nya tepat.

const KANJI_RE = /[\u4e00-\u9faf\u3400-\u4dbf]/

function isKanji(ch) {
  return KANJI_RE.test(ch)
}

export default function Ruby({ text, reading }) {
  if (!text) return null
  if (!reading || reading === text) return <>{text}</>

  // Tidak ada kanji → tampilkan teks biasa
  if (![...text].some(isKanji)) return <>{text}</>

  // Pisahkan: kanji di awal, lalu sisa (okurigana)
  const chars = [...text]
  let leadKanji = ''
  let rest = ''
  let i = 0
  while (i < chars.length && isKanji(chars[i])) {
    leadKanji += chars[i]
    i++
  }
  rest = chars.slice(i).join('')

  // Jika ada okurigana dan reading berakhiran okurigana tsb → ruby tepat per kanji
  if (rest && reading.endsWith(rest)) {
    const kanjiReading = reading.slice(0, reading.length - rest.length)
    return (
      <>
        <ruby>
          {leadKanji}
          <rt>{kanjiReading}</rt>
        </ruby>
        {rest}
      </>
    )
  }

  // Fallback: ruby seluruh kata
  return (
    <ruby>
      {text}
      <rt>{reading}</rt>
    </ruby>
  )
}
