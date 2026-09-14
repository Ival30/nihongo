// Bacaan N3/N2 — tambahan.
export const n3extra = [
  {
    id: 'n3-2',
    title: 'スマートフォンと 生活',
    titleId: 'Ponsel Pintar dan Kehidupan',
    text: 'スマートフォンは、今や 私たちの 生活に 欠かせない 道具に なりました。連絡を 取ったり、地図を 調べたり、買い物を したりと、一台で 多くの ことが できます。しかし、使い過ぎると、睡眠の 質が 下がったり、目が 疲れたり します。大切なのは、上手に 付き合って いく ことでしょう。',
    textId: 'Ponsel pintar kini menjadi alat yang tak terpisahkan dari kehidupan kita. Menghubungi orang, mencari peta, berbelanja — banyak hal bisa dilakukan dengan satu perangkat. Namun, jika dipakai berlebihan, kualitas tidur menurun dan mata menjadi lelah. Yang penting adalah bisa bergaul dengannya dengan bijak.',
    questions: [
      { q: 'スマートフォンで できない ことは 何ですか。', qId: 'Apa yang TIDAK bisa dilakukan dengan ponsel pintar?', options: ['料理を 作る', '連絡を 取る', '地図を 調べる', '買い物をする'], answer: '料理を 作る', explain: 'Teks menyebut menghubungi, mencari peta, belanja — bukan memasak.' },
      { q: '使い過ぎると、どう なりますか。', qId: 'Kalau dipakai berlebihan, jadi bagaimana?', options: ['睡眠の 質が 下がる', 'お金が 増える', '体が 強くなる'], answer: '睡眠の 質が 下がる', explain: 'Teks menyebut「睡眠の 質が 下がったり」.' },
      { q: '筆者が 一番 言いたい ことは 何ですか。', qId: 'Apa pesan utama penulis?', options: ['上手に 付き合う ことが 大切だ', 'スマホを 捨てるべきだ', 'スマホは 危険だ'], answer: '上手に 付き合う ことが 大切だ', explain: 'Teks menutup「大切なのは、上手に 付き合って いく ことでしょう」.' },
    ],
  },
  {
    id: 'n3-3',
    title: '働き方の 変化',
    titleId: 'Perubahan Cara Kerja',
    text: '最近、アルバイトや パートタイムで 働く 人が 増えています。正社員として 長く 働く ことだけが 働き方では ありません。自分の 生活に 合わせて 仕事を 選ぶ 人も います。一方で、収入が 安定しない という 問題も あります。',
    textId: 'Akhir-akhir ini, orang yang bekerja sebagai pekerja paruh waktu meningkat. Bekerja lama sebagai karyawan tetap bukanlah satu-satunya cara bekerja. Ada juga orang yang memilih pekerjaan sesuai kehidupannya. Di sisi lain, ada masalah pendapatan yang tidak stabil.',
    questions: [
      { q: '最近、何が 増えていますか。', qId: 'Akhir-akhir ini apa yang bertambah?', options: ['パートで 働く 人', '正社員', '会社の 数', '給料'], answer: 'パートで 働く 人', explain: 'Teks menyebut「アルバイトや パートタイムで 働く 人が 増えています」.' },
      { q: '問題点として 挙げられている ことは 何ですか。', qId: 'Apa masalah yang disebutkan?', options: ['収入が 安定しない', '仕事が 多すぎる', '休みが ない'], answer: '収入が 安定しない', explain: 'Teks menyebut「収入が 安定しない という 問題も あります」.' },
    ],
  },
]

export const n2extra = [
  {
    id: 'n2-2',
    title: '高齢化社会',
    titleId: 'Masyarakat Menua',
    text: '日本は 世界でも 特に 高齢化が 進んだ 国の 一つである。医療の 発達に 伴って 平均寿命が 延びた 一方で、働き手の 減少や 年金制度の 負担増 といった 課題が 深刻化している。こうした 状況に 対応する ため、企業では 定年を 延長したり、外国人労働者を 受け入れたりする 動きが 広がっている。',
    textId: 'Jepang adalah salah satu negara dengan penuaan penduduk paling maju di dunia. Seiring perkembangan medis, angka harapan hidup memanjang; di sisi lain, isu seperti berkurangnya tenaga kerja dan meningkatnya beban sistem pensiun makin serius. Untuk menghadapi situasi ini, di perusahaan meluas langkah memperpanjang usia pensiun dan menerima pekerja asing.',
    questions: [
      { q: '平均寿命が 延びた 理由は 何か。', qId: 'Apa alasan angka harapan hidup memanjang?', options: ['医療の 発達', '食料の 増加', '人口の 増加', '教育の 普及'], answer: '医療の 発達', explain: 'Teks menyebut「医療の 発達に 伴って 平均寿命が 延びた」.' },
      { q: '課題として 挙げられていない ものは どれか。', qId: 'Yang TIDAK disebutkan sebagai isu?', options: ['教育費の 上昇', '働き手の 減少', '年金制度の 負担増'], answer: '教育費の 上昇', explain: 'Teks menyebut tenaga kerja menurun dan beban pensiun — bukan biaya pendidikan.' },
      { q: '企業は どんな 対応を しているか。', qId: 'Perusahaan melakukan langkah apa?', options: ['定年を 延長する', '給料を 下げる', '社員を 減らす'], answer: '定年を 延長する', explain: 'Teks menyebut「定年を 延長したり、外国人労働者を 受け入れたりする」.' },
    ],
  },
  {
    id: 'n2-3',
    title: '情報の 見極め',
    titleId: 'Menilai Informasi',
    text: 'インターネット上には 膨大な 情報が あふれており、その 中には 根拠の 乏しい ものも 少なくない。受け取った 情報を そのまま 信じるのでは なく、複数の 情報源を 照らし合わせて 判断する 姿勢が 求められている。特に 社会に 大きな 影響を 与える 内容については、慎重に 扱う 必要がある。',
    textId: 'Di internet informasi berlimpah, dan di dalamnya pun tidak sedikit yang minim dasar. Alih-alih langsung mempercayai informasi yang diterima, dibutuhkan sikap menilai dengan membandingkan beberapa sumber. Terutama untuk konten yang berdampak besar pada masyarakat, perlu ditangani dengan hati-hati.',
    questions: [
      { q: '筆者は どんな 姿勢が 必要だと 述べているか。', qId: 'Sikap apa yang penulis anggap perlu?', options: ['複数の 情報源を 照らし合わせる', 'すべて 信じる', 'SNSを 使わない', '情報を 無視する'], answer: '複数の 情報源を 照らし合わせる', explain: 'Teks menyebut「複数の 情報源を 照らし合わせて 判断する 姿勢が 求められている」.' },
      { q: '特に 慎重に 扱うべきなのは どんな 内容か。', qId: 'Konten apa yang harus ditangani ekstra hati-hati?', options: ['社会に 大きな 影響を 与える 内容', '個人的な 日記', '料理の レシピ'], answer: '社会に 大きな 影響を 与える 内容', explain: 'Teks menyebut「社会に 大きな 影響を 与える 内容については、慎重に 扱う 必要がある」.' },
    ],
  },
]
