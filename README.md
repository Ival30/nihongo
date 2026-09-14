# Nihongo — Platform Belajar Bahasa Jepang (N5–N1)

Aplikasi web untuk belajar bahasa Jepang dari level JLPT N5 sampai N1, dengan materi berbahasa Indonesia.

## Fitur

- **Huruf** — tabel hiragana & katakana, latihan menebak dengan suara
- **Kosakata** — 7.904 kata (N5–N1), arti Indonesia, contoh kalimat + audio, furigana, diurutkan berdasarkan frekuensi pemakaian nyata
- **Tata Bahasa** — 828 pola dengan rumus pembentukan dan 4 contoh kalimat berbahasa Indonesia per pola
- **Kanji** — 2.211 kanji dengan on-yomi, kun-yomi, arti Indonesia, dan animasi urutan goresan (KanjiVG)
- **Bacaan** — 19 bacaan pendek (dokkai) dengan furigana dan soal pemahaman
- **Latihan** — kartu hafalan, pengulangan terjadwal (SRS/SM-2), konjugasi kata kerja, latihan mendengarkan, kuis
- **Ujian** — simulasi ujian JLPT dengan timer per seksi
- **Cari** — pencarian global lintas semua tingkat
- **Jurnal** — catatan belajar harian
- **Kemajuan** — pelacakan penguasaan per tingkat

## Menjalankan

```bash
npm install
npm run dev      # server pengembangan
npm run build    # build produksi ke dist/
npm run preview  # pratinjau hasil build
```

Buka http://localhost:5173

## Teknologi

- React 18 + Vite 7
- Tanpa backend — semua progres disimpan di `localStorage`
- Suara memakai Web Speech API (bawaan browser)

## Sumber Data

| Data | Sumber | Lisensi |
|------|--------|---------|
| Kosakata | [elzup/jlpt-word-list](https://github.com/elzup/jlpt-word-list) (JMDict) | CC BY-SA |
| Kanji | kanjiapi.dev (KANJIDIC) | CC BY-SA |
| Tata bahasa | [hanabira.org](https://github.com/tristcoil/hanabira.org) | lihat repo |
| Urutan goresan | [KanjiVG](https://kanjivg.tagaini.net/) | CC BY-SA 3.0 |
| Frekuensi kata | [OpenSubtitles](https://github.com/orgtre/top-open-subtitles-sentences) | CC BY |
| Contoh kalimat | [Tatoeba](https://tatoeba.org/) | CC BY 2.0 FR |

Terjemahan Indonesia dibangkitkan dengan Google Translate, lalu disimpan statis di repo.

## Sinkronisasi data

Skrip di `scripts/` membangun ulang data dari sumber aslinya (butuh jaringan):

```bash
node scripts/fetch-data.mjs          # kosakata, kanji, tata bahasa
node scripts/translate-vocab.mjs     # arti kosakata → Indonesia
node scripts/translate-grammar.mjs   # tata bahasa → Indonesia
node scripts/translate-kanji.mjs     # arti kanji → Indonesia
node scripts/build-vocab-order.mjs   # urutkan kosakata berdasarkan frekuensi
node scripts/build-furigana.mjs      # furigana bacaan (Kuromoji)
node scripts/fetch-strokes.mjs       # urutan goresan kanji
node scripts/build-vocab-examples.mjs # contoh kalimat kosakata
```

## Struktur

```
src/
  components/     komponen tampilan (14)
  data/           data materi + loader
  App.jsx         kerangka aplikasi & navigasi
  srs.js          mesin pengulangan terjadwal (SM-2)
  speak.js        text-to-speech Jepang
scripts/          pipeline data (13 skrip)
```
