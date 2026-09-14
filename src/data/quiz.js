// Generator kuis: membangun soal pilihan ganda dari data kosakata/tata bahasa/kanji.
// Soal dibangun deterministik dari data agar jumlah soal selalu konsisten.
// Semua teks jawaban memakai arti bahasa Indonesia (meaningId) bila tersedia.

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

// Arti yang ditampilkan/dinilai: utamakan bahasa Indonesia.
const gloss = (item) => item.meaningId || item.meaning

// Ambil 3 pengecoh dari daftar, dengan teks berbeda dari jawaban benar.
function distractors(list, correct, rng, n = 3) {
  return shuffle(list.filter((it) => gloss(it) !== correct), rng)
    .slice(0, n)
    .map(gloss)
}

export function buildVocabQuiz(levelId, vocabList, count = 10) {
  const rng = seededRng(levelId.length * 1000 + vocabList.length)
  const picked = shuffle(vocabList, rng).slice(0, count)
  return picked.map((item) => {
    const answer = gloss(item)
    const options = shuffle([answer, ...distractors(vocabList, answer, rng)], rng)
    return {
      type: 'vocab',
      question: `Apa arti dari「${item.jp}」?`,
      answer,
      options,
      hint: item.reading ? `Cara baca: ${item.reading}` : undefined,
    }
  })
}

export function buildGrammarQuiz(levelId, grammarList, count = 10) {
  const rng = seededRng(levelId.length * 2000 + grammarList.length)
  const picked = shuffle(grammarList, rng).slice(0, count)
  return picked.map((item) => {
    const answer = gloss(item)
    const options = shuffle([answer, ...distractors(grammarList, answer, rng)], rng)
    return {
      type: 'grammar',
      question: `Apa arti pola「${item.pattern}」?`,
      answer,
      options,
      hint: item.example,
    }
  })
}

export function buildKanjiQuiz(levelId, kanjiList, count = 10) {
  const rng = seededRng(levelId.length * 3000 + kanjiList.length)
  const picked = shuffle(kanjiList, rng).slice(0, count)
  return picked.map((item) => {
    const answer = gloss(item)
    const options = shuffle([answer, ...distractors(kanjiList, answer, rng)], rng)
    return {
      type: 'kanji',
      question: `Apa arti kanji「${item.char}」?`,
      answer,
      options,
      hint: item.on ? `On-yomi: ${item.on}` : undefined,
    }
  })
}

export function buildListeningQuiz(levelId, vocabList, count = 10) {
  // Hanya kata yang punya contoh kalimat bisa dipakai untuk latihan mendengar.
  const pool = vocabList.filter((v) => v.example && gloss(v))
  if (pool.length < 4) return []
  const rng = seededRng(levelId.length * 5000 + pool.length)
  const picked = shuffle(pool, rng).slice(0, count)
  return picked.map((item) => {
    const answer = gloss(item)
    const options = shuffle([answer, ...distractors(pool, answer, rng)], rng)
    return {
      type: 'listening',
      question: item.example, // diputar sebagai suara, bukan ditampilkan sebelum dijawab
      audio: item.example,
      answer,
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
