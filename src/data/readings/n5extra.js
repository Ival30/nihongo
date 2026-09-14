// Bacaan N5 — tambahan.
export const n5extra = [
  {
    id: 'n5-3',
    title: 'わたしの 部屋',
    titleId: 'Kamarku',
    text: 'わたしの 部屋は あまり 大きく ありません。机の 上に 本が 三冊 あります。窓の そばに 小さい 花が あります。ベッドの 下に 猫が います。部屋は いつも きれいです。でも、今は 少し 汚いです。',
    textId: 'Kamarku tidak terlalu besar. Di atas meja ada tiga buku. Di dekat jendela ada bunga kecil. Di bawah tempat tidur ada kucing. Kamar selalu bersih. Tetapi, sekarang agak kotor.',
    questions: [
      { q: '机の 上に 何が ありますか。', qId: 'Apa yang ada di atas meja?', options: ['本', '猫', '花', '水'], answer: '本', explain: 'Teks menyebut「机の 上に 本が 三冊 あります」.' },
      { q: '猫は どこに いますか。', qId: 'Kucing ada di mana?', options: ['ベッドの 下', '机の 上', '窓の そば', '部屋の 外'], answer: 'ベッドの 下', explain: 'Teks menyebut「ベッドの 下に 猫が います」.' },
      { q: '今、部屋は どうですか。', qId: 'Sekarang kamarnya bagaimana?', options: ['少し 汚いです', 'きれいです', '大きいです', '新しいです'], answer: '少し 汚いです', explain: 'Teks menyebut「今は 少し 汚いです」.' },
    ],
  },
  {
    id: 'n5-4',
    title: '買い物',
    titleId: 'Belanja',
    text: '今日、友達と デパートへ 行きました。私は 新しい 靴を 買いました。友達は かばんを 買いました。それから、食堂で 昼ご飯を 食べました。天ぷらを 食べました。とても おいしかったです。',
    textId: 'Hari ini saya pergi ke department store bersama teman. Saya membeli sepatu baru. Teman saya membeli tas. Setelah itu, kami makan siang di kantin. Kami makan tempura. Sangat enak.',
    questions: [
      { q: 'だれと デパートへ 行きましたか。', qId: 'Pergi ke department store dengan siapa?', options: ['友達', '家族', '先生', '一人で'], answer: '友達', explain: 'Teks menyebut「友達と デパートへ 行きました」.' },
      { q: '私は 何を 買いましたか。', qId: 'Saya membeli apa?', options: ['靴', 'かばん', '本', '服'], answer: '靴', explain: 'Teks menyebut「私は 新しい 靴を 買いました」.' },
      { q: '昼ご飯は 何を 食べましたか。', qId: 'Makan siang makan apa?', options: ['天ぷら', '寿司', 'ラーメン', 'パン'], answer: '天ぷら', explain: 'Teks menyebut「天ぷらを 食べました」.' },
    ],
  },
]
