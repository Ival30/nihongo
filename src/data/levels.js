// Definisi level JLPT beserta deskripsi dan target capaian.
// Jumlah materi dihitung dinamis dari data asli (lihat getLevelTotals di App).
export const levels = [
  {
    id: 'n5',
    name: 'N5',
    title: 'Dasar',
    color: '#22c55e',
    description: 'Titik awal. Mengenal hiragana, katakana, dan kalimat sederhana sehari-hari.',
    goals: [
      'Membaca dan menulis hiragana & katakana',
      'Memahami kalimat dasar dan percakapan pendek',
      'Menguasai kosakata sehari-hari',
    ],
  },
  {
    id: 'n4',
    name: 'N4',
    title: 'Pemula Lanjut',
    color: '#84cc16',
    description: 'Melanjutkan dasar. Kalimat majemuk dan percakapan sehari-hari yang lebih luas.',
    goals: [
      'Memahami kalimat dengan struktur lebih kompleks',
      'Membaca teks pendek sehari-hari',
      'Memperluas kosakata dan kanji dasar',
    ],
  },
  {
    id: 'n3',
    name: 'N3',
    title: 'Menengah',
    color: '#f59e0b',
    description: 'Jembatan menuju mahir. Memahami bahasa Jepang yang digunakan dalam situasi umum.',
    goals: [
      'Memahami isi artikel dan berita umum',
      'Mengikuti percakapan natural dengan kecepatan normal',
      'Menguasai kosakata dan kanji menengah',
    ],
  },
  {
    id: 'n2',
    name: 'N2',
    title: 'Mahir',
    color: '#f43f5e',
    description: 'Tingkat mahir untuk kebutuhan akademik dan profesional.',
    goals: [
      'Memahami materi kompleks seperti editorial dan laporan',
      'Berdiskusi dan menyampaikan pendapat',
      'Menguasai kosakata dan kanji tingkat lanjut',
    ],
  },
  {
    id: 'n1',
    name: 'N1',
    title: 'Mahir Tingkat Tinggi',
    color: '#a855f7',
    description: 'Kemampuan setara penutur asli. Teks abstrak, nuansa makna, dan konteks kompleks.',
    goals: [
      'Memahami teks dengan tingkat abstraksi tinggi',
      'Menangkap nuansa dan maksud tersirat',
      'Menguasai kosakata dan kanji terbanyak',
    ],
  },
]
