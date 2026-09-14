// Pemuat data per-level (code-splitting). Hanya level aktif yang diunduh.
// Glosari Indonesia + contoh kalimat (bila tersedia) digabungkan ke kosakata.

const cache = {}

export async function loadLevelData(levelId) {
  if (cache[levelId]) return cache[levelId]
  const [vocab, grammar, kanji, idGloss, grammarId, examples, kanjiId] = await Promise.all([
    import(`./vocab/${levelId}.js`),
    import(`./grammar/${levelId}.js`),
    import(`./kanji/${levelId}.js`),
    loadIdGloss(levelId),
    loadGrammarId(levelId),
    loadExamples(levelId),
    loadKanjiId(levelId),
  ])
  const vocabMerged = mergeId(vocab.default, idGloss)
  const vocabWithExamples = mergeExamples(vocabMerged, examples)
  const grammarMerged = grammarId || grammar.default
  const kanjiMerged = mergeKanjiId(kanji.default, kanjiId)
  cache[levelId] = { vocab: vocabWithExamples, grammar: grammarMerged, kanji: kanjiMerged }
  return cache[levelId]
}

async function loadKanjiId(levelId) {
  try {
    const m = await import(`./kanji/${levelId}.id.js`)
    return m.default
  } catch {
    return null
  }
}

// Gabungkan arti Indonesia ke kanji.
function mergeKanjiId(kanji, kanjiId) {
  if (!kanjiId) return kanji
  return kanji.map((it) => ({ ...it, meaningId: kanjiId[it.char] || null }))
}

async function loadIdGloss(levelId) {
  try {
    const m = await import(`./vocab/${levelId}.id.js`)
    return m.default
  } catch {
    return null
  }
}

async function loadGrammarId(levelId) {
  try {
    const m = await import(`./grammar/${levelId}.id.js`)
    return m.default
  } catch {
    return null
  }
}

async function loadExamples(levelId) {
  try {
    const m = await import(`./vocab/${levelId}.examples.js`)
    return m.default
  } catch {
    return null
  }
}

// Gabungkan arti Indonesia ke kosakata.
function mergeId(vocab, idGloss) {
  if (!idGloss) return vocab
  return vocab.map((it) => ({ ...it, meaningId: idGloss[it.jp] || null }))
}

// Gabungkan contoh kalimat ke kosakata.
function mergeExamples(vocab, examples) {
  if (!examples) return vocab
  return vocab.map((it) => {
    const ex = examples[it.jp]
    return ex ? { ...it, example: ex.example, exampleId: ex.exampleId, exampleRomaji: ex.romaji } : it
  })
}
