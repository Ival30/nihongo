// Mesin konjugasi bahasa Jepang (verba & kata sifat).
// Mendukung: godan (5-dan), ichidan (1-dan), irregular (する/くる),
// i-adjective, na-adjective.
//
// Bentuk yang dihasilkan: te, ta (lampau), nai (negatif), masu (sopan),
// teiru (sedang). Untuk kata sifat: te, ta, nai, sopan.

// Tabel transformasi godan: [te, ta, nai-akar, masu-akar]
const GODAN = {
  う: ['って', 'った', 'わ', 'い'],
  く: ['いて', 'いた', 'か', 'き'],
  ぐ: ['いで', 'いだ', 'が', 'ぎ'],
  す: ['して', 'した', 'さ', 'し'],
  つ: ['って', 'った', 'た', 'ち'],
  ぬ: ['んで', 'んだ', 'な', 'に'],
  ぶ: ['んで', 'んだ', 'ば', 'び'],
  む: ['んで', 'んだ', 'ま', 'み'],
  る: ['って', 'った', 'ら', 'り'],
}

// Pecah kata jadi [batang, akhiran kana terakhir]
function splitKana(s) {
  const stem = s.slice(0, -1)
  const end = s.slice(-1)
  return { stem, end }
}

function conjugateVerb(form, type, reading) {
  // form: dictionary (bentuk kamus) + reading (cara baca kana)
  if (type === 'suru' || form === 'する') {
    return {
      te: 'して', ta: 'した', nai: 'しない', masu: 'します', teiru: 'している',
    }
  }
  if (type === 'kuru' || form === 'くる' || form === '来る') {
    return {
      te: 'きて', ta: 'きた', nai: 'こない', masu: 'きます', teiru: 'きている',
    }
  }
  // 行く adalah pengecualian godan: te/ta → いって/いった
  if (form === '行く' || reading === 'いく') {
    return {
      te: 'いって', ta: 'いった', nai: 'いかない', masu: 'いきます', teiru: 'いっている',
    }
  }
  if (type === 'ichidan') {
    const stem = reading.slice(0, -1) // buang る
    return {
      te: stem + 'て', ta: stem + 'た', nai: stem + 'ない',
      masu: stem + 'ます', teiru: stem + 'ている',
    }
  }
  // godan default
  const { stem, end } = splitKana(reading)
  const [te, ta, naiRoot, masuRoot] = GODAN[end] || GODAN['う']
  return {
    te: stem + te,
    ta: stem + ta,
    nai: stem + naiRoot + 'ない',
    masu: stem + masuRoot + 'ます',
    teiru: stem + te + 'いる',
  }
}

function conjugateIAdj(reading) {
  const stem = reading.slice(0, -1) // buang い
  return {
    te: stem + 'くて',
    ta: stem + 'かった',
    nai: stem + 'くない',
    polite: stem + 'いです',
    teiru: null,
  }
}

function conjugateNaAdj(form) {
  return {
    te: form + 'で',
    ta: form + 'だった',
    nai: form + 'じゃない',
    polite: form + 'です',
    teiru: null,
  }
}

// API utama: terima item kosakata { jp, reading, type } → hasil konjugasi
export function conjugate(item) {
  const type = item.type
  if (type === 'i-adj') return { ...conjugateIAdj(item.reading || item.jp), form: item.jp }
  if (type === 'na-adj') return { ...conjugateNaAdj(item.jp), form: item.jp }
  // verba
  return { ...conjugateVerb(item.jp, type, item.reading || item.jp), form: item.jp }
}

// Daftar bentukan + label untuk latihan
export const FORMS = [
  { key: 'te', label: 'て形', hint: 'bentuk -te (sambung/permintaan)' },
  { key: 'ta', label: 'た形', hint: 'bentuk lampau' },
  { key: 'nai', label: 'ない形', hint: 'bentuk negatif' },
  { key: 'masu', label: 'ます形', hint: 'bentuk sopan' },
  { key: 'teiru', label: 'ている', hint: 'sedang berlangsung' },
]

// Kata kerja & sifat umum untuk latihan, dikelompok per level.
// type: godan | ichidan | suru | kuru | i-adj | na-adj
export const conjugationWords = {
  n5: [
    { jp: '食べる', reading: 'たべる', type: 'ichidan', meaning: 'makan' },
    { jp: '飲む', reading: 'のむ', type: 'godan', meaning: 'minum' },
    { jp: '行く', reading: 'いく', type: 'godan', meaning: 'pergi' },
    { jp: '来る', reading: 'くる', type: 'kuru', meaning: 'datang' },
    { jp: 'する', reading: 'する', type: 'suru', meaning: 'melakukan' },
    { jp: '見る', reading: 'みる', type: 'ichidan', meaning: 'melihat' },
    { jp: '聞く', reading: 'きく', type: 'godan', meaning: 'mendengar' },
    { jp: '読む', reading: 'よむ', type: 'godan', meaning: 'membaca' },
    { jp: '書く', reading: 'かく', type: 'godan', meaning: 'menulis' },
    { jp: '話す', reading: 'はなす', type: 'godan', meaning: 'berbicara' },
    { jp: '買う', reading: 'かう', type: 'godan', meaning: 'membeli' },
    { jp: '帰る', reading: 'かえる', type: 'godan', meaning: 'pulang' },
    { jp: '起きる', reading: 'おきる', type: 'ichidan', meaning: 'bangun' },
    { jp: '寝る', reading: 'ねる', type: 'ichidan', meaning: 'tidur' },
    { jp: '高い', reading: 'たかい', type: 'i-adj', meaning: 'mahal/tinggi' },
    { jp: '大きい', reading: 'おおきい', type: 'i-adj', meaning: 'besar' },
    { jp: '小さい', reading: 'ちいさい', type: 'i-adj', meaning: 'kecil' },
    { jp: '新しい', reading: 'あたらしい', type: 'i-adj', meaning: 'baru' },
    { jp: '静か', reading: 'しずか', type: 'na-adj', meaning: 'tenang' },
    { jp: '元気', reading: 'げんき', type: 'na-adj', meaning: 'sehat' },
  ],
  n4: [
    { jp: '決める', reading: 'きめる', type: 'ichidan', meaning: 'memutuskan' },
    { jp: '手伝う', reading: 'てつだう', type: 'godan', meaning: 'membantu' },
    { jp: '急ぐ', reading: 'いそぐ', type: 'godan', meaning: 'bergegas' },
    { jp: '集める', reading: 'あつめる', type: 'ichidan', meaning: 'mengumpulkan' },
    { jp: '疲れる', reading: 'つかれる', type: 'ichidan', meaning: 'lelah' },
    { jp: '便利', reading: 'べんり', type: 'na-adj', meaning: 'praktis' },
    { jp: '大切', reading: 'たいせつ', type: 'na-adj', meaning: 'penting' },
    { jp: '眠い', reading: 'ねむい', type: 'i-adj', meaning: 'mengantuk' },
    { jp: '恥ずかしい', reading: 'はずかしい', type: 'i-adj', meaning: 'malu' },
    { jp: '残念', reading: 'ざんねん', type: 'na-adj', meaning: 'sayang sekali' },
  ],
  n3: [
    { jp: '増える', reading: 'ふえる', type: 'ichidan', meaning: 'bertambah' },
    { jp: '減る', reading: 'へる', type: 'godan', meaning: 'berkurang' },
    { jp: '含む', reading: 'ふくむ', type: 'godan', meaning: 'mengandung' },
    { jp: '変わる', reading: 'かわる', type: 'godan', meaning: 'berubah' },
    { jp: '通う', reading: 'かよう', type: 'godan', meaning: 'rutin pergi' },
    { jp: '断る', reading: 'ことわる', type: 'godan', meaning: 'menolak' },
    { jp: '確かめる', reading: 'たしかめる', type: 'ichidan', meaning: 'memastikan' },
    { jp: '驚く', reading: 'おどろく', type: 'godan', meaning: 'terkejut' },
  ],
}

// Gabung kata kerja/sifat untuk semua level (untuk akses cepat)
export function getConjugationWords(levelId) {
  return conjugationWords[levelId] || conjugationWords.n5
}
