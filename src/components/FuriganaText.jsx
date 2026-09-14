// Render teks beranotasi 漢字《かな》 menjadi elemen <ruby> (furigana).
// Format ini dihasilkan oleh scripts/build-furigana.mjs.
import { Fragment } from 'react'

// Pisah string jadi potongan: { kanji, kana } atau { plain }
const PATTERN = /([\u4e00-\u9faf\u3400-\u4dbf]+)《([^》]+)》/g

export default function FuriganaText({ text }) {
  if (!text) return null
  const parts = []
  let last = 0
  let m
  let key = 0
  PATTERN.lastIndex = 0
  while ((m = PATTERN.exec(text)) !== null) {
    if (m.index > last) parts.push(<Fragment key={key++}>{text.slice(last, m.index)}</Fragment>)
    parts.push(
      <ruby key={key++}>
        {m[1]}
        <rt>{m[2]}</rt>
      </ruby>,
    )
    last = m.index + m[0].length
  }
  if (last < text.length) parts.push(<Fragment key={key++}>{text.slice(last)}</Fragment>)
  return <>{parts}</>
}
