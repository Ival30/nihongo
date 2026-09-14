// Generator kuis: membangun soal pilihan ganda dari data kosakata/tata bahasa/kanji.
// Soal dibangun deterministik dari data agar jumlah soal selalu konsisten.

function shuffle(arr, rng = Math.random) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// RNG deterministik sederhana (mulberry32) agar soal stabil antar render
function seededRng(seed) {
  let t = seed >>> 0
  return function () {
    t += 0x6d2b79f5
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

export function buildVocabQuiz(levelId, vocabList, count = 10) {
  const rng = seededRng(levelId.length * 1000 + vocabList.length)
  const picked = shuffle(vocabList, rng).slice(0, count)
  return picked.map((item) => {
    const options = shuffle(
      [item.meaning, ...shuffle(vocabList.filter((v) => v.meaning !== item.meaning), rng).slice(0, 3).map((v) => v.meaning)],
      rng,
    )
    return {
      type: 'vocab',
      question: `Apa arti dari「${item.jp}」?`,
      answer: item.meaning,
      options,
      hint: item.reading ? `Cara baca: ${item.reading}` : undefined,
    }
  })
}

export function buildGrammarQuiz(levelId, grammarList, count = 10) {
  const rng = seededRng(levelId.length * 2000 + grammarList.length)
  const picked = shuffle(grammarList, rng).slice(0, count)
  return picked.map((item) => {
    const options = shuffle(
      [item.meaning, ...shuffle(grammarList.filter((g) => g.meaning !== item.meaning), rng).slice(0, 3).map((g) => g.meaning)],
      rng,
    )
    return {
      type: 'grammar',
      question: `Apa arti pola「${item.pattern}」?`,
      answer: item.meaning,
      options,
      hint: item.example,
    }
  })
}

export function buildKanjiQuiz(levelId, kanjiList, count = 10) {
  const rng = seededRng(levelId.length * 3000 + kanjiList.length)
  const picked = shuffle(kanjiList, rng).slice(0, count)
  return picked.map((item) => {
    const options = shuffle(
      [item.meaning, ...shuffle(kanjiList.filter((k) => k.meaning !== item.meaning), rng).slice(0, 3).map((k) => k.meaning)],
      rng,
    )
    return {
      type: 'kanji',
      question: `Apa arti kanji「${item.char}」?`,
      answer: item.meaning,
      options,
      hint: item.on ? `On-yomi: ${item.on}` : undefined,
    }
  })
}

export function buildListeningQuiz(levelId, vocabList, count = 10) {
  // Hanya kata yang punya contoh kalimat bisa dipakai untuk latihan mendengar.
  const pool = vocabList.filter((v) => v.example && (v.exampleId || v.meaningId || v.meaning))
  if (pool.length < 4) return []
  const rng = seededRng(levelId.length * 5000 + pool.length)
  const picked = shuffle(pool, rng).slice(0, count)
  const answerOf = (v) => v.exampleId || v.meaningId || v.meaning
  return picked.map((item) => {
    const options = shuffle(
      [answerOf(item), ...shuffle(pool.filter((v) => answerOf(v) !== answerOf(item)), rng).slice(0, 3).map(answerOf)],
      rng,
    )
    return {
      type: 'listening',
      question: item.example, // diputar sebagai suara, bukan ditampilkan sebelum dijawab
      audio: item.example,
      answer: answerOf(item),
      options,
      hint: undefined,
    }
  })
}

export function buildQuiz(levelId, data, count = 10) {
  const vocab = buildVocabQuiz(levelId, data.vocab, count)
  const grammar = buildGrammarQuiz(levelId, data.grammar, count)
  const kanji = buildKanjiQuiz(levelId, data.kanji, count)
  const combined = shuffle([...vocab, ...grammar, ...kanji], seededRng(levelId.length * 4000))
  return combined
}
