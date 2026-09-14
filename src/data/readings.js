// Bacaan pendek (dokkai) + soal pemahaman per level.
// Struktur: { id, title, titleId, text, textId, questions: [{ q, qId, options, answer, explain }] }

import { n5extra } from './readings/n5extra.js'
import { n4 as n4a } from './readings/n4.js'
import { n4 as n4b } from './readings/n4b.js'
import { n3extra, n2extra } from './readings/extra.js'
import { n1extra } from './readings/n1extra.js'

const base = {
  n5: [
    {
      id: 'n5-1',
      title: 'わたしの一日',
      titleId: 'Hari-hariku',
      text: 'わたしは まいあさ 六時に おきます。それから、水を 飲みます。七時に ご飯を 食べます。八時に 学校へ 行きます。学校で 日本語を 勉強します。夜、本を 読みます。十一時に 寝ます。',
      textId: 'Saya bangun jam enam setiap pagi. Setelah itu, minum air. Jam tujuh makan nasi. Jam delapan pergi ke sekolah. Di sekolah belajar bahasa Jepang. Malam, membaca buku. Jam sebelas tidur.',
      questions: [
        {
          q: '何時に おきますか。',
          qId: 'Jam berapa (dia) bangun?',
          options: ['六時', '七時', '八時', '十一時'],
          answer: '六時',
          explain: 'Teks menyebut「六時に おきます」= bangun jam enam.',
        },
        {
          q: '朝、何を 飲みますか。',
          qId: 'Pagi, minum apa?',
          options: ['水', 'お茶', 'コーヒー', 'ご飯'],
          answer: '水',
          explain: 'Teks menyebut「水を 飲みます」= minum air.',
        },
        {
          q: 'どこで 日本語を 勉強しますか。',
          qId: 'Di mana belajar bahasa Jepang?',
          options: ['学校', '家', '図書館', '駅'],
          answer: '学校',
          explain: 'Teks menyebut「学校で 日本語を 勉強します」.',
        },
      ],
    },
    {
      id: 'n5-2',
      title: '私の家族',
      titleId: 'Keluargaku',
      text: '私の 家族は 四人です。父と 母と 妹が います。父は 会社員です。母は 先生です。妹は 小学生です。私は 大学生です。日曜日に みんなで 映画を 見ます。',
      textId: 'Keluarga saya empat orang. Ada ayah, ibu, dan adik perempuan. Ayah karyawan. Ibu guru. Adik saya murid SD. Saya mahasiswa. Hari Minggu kami semua menonton film.',
      questions: [
        {
          q: '家族は 何人ですか。',
          qId: 'Ada berapa orang di keluarga?',
          options: ['四人', '三人', '五人', '二人'],
          answer: '四人',
          explain: 'Teks menyebut「家族は 四人です」.',
        },
        {
          q: '母の 仕事は 何ですか。',
          qId: 'Apa pekerjaan ibu?',
          options: ['先生', '会社員', '学生', '医者'],
          answer: '先生',
          explain: 'Teks menyebut「母は 先生です」.',
        },
        {
          q: '日曜日に 何を しますか。',
          qId: 'Hari Minggu melakukan apa?',
          options: ['映画を 見ます', '買い物を します', '勉強します', '泳ぎます'],
          answer: '映画を 見ます',
          explain: 'Teks menyebut「日曜日に みんなで 映画を 見ます」.',
        },
      ],
    },
  ],
  n4: [
    {
      id: 'n4-1',
      title: '日本の四季',
      titleId: 'Empat Musim di Jepang',
      text: '日本には 春、夏、秋、冬の 四つの 季節が あります。春は 暖かくて、桜が 咲きます。多くの 人が 花見を します。夏は 暑くて、海や 山へ 行く 人が 多いです。秋は 涼しくて、紅葉が きれいです。冬は 寒くて、北の 地方では 雪が たくさん 降ります。',
      textId: 'Di Jepang ada empat musim: semi, panas, gugur, dingin. Musim semi hangat dan sakura bermekaran. Banyak orang melihat bunga (hanami). Musim panas panas, banyak orang pergi ke laut atau gunung. Musim gugur sejuk dan daun momiji indah. Musim dingin dingin, di daerah utara turun banyak salju.',
      questions: [
        {
          q: '春に 何が 咲きますか。',
          qId: 'Apa yang bermekaran di musim semi?',
          options: ['桜', '紅葉', '雪', '花火'],
          answer: '桜',
          explain: 'Teks menyebut「春は 暖かくて、桜が 咲きます」.',
        },
        {
          q: '夏に 人は どこへ 行きますか。',
          qId: 'Ke mana orang pergi saat musim panas?',
          options: ['海や 山', '図書館', '会社', '学校'],
          answer: '海や 山',
          explain: 'Teks menyebut「夏は 暑くて、海や 山へ 行く 人が 多いです」.',
        },
        {
          q: '雪が たくさん 降るのは どこですか。',
          qId: 'Di mana turun banyak salju?',
          options: ['北の 地方', '南の 地方', '海', '山'],
          answer: '北の 地方',
          explain: 'Teks menyebut「北の 地方では 雪が たくさん 降ります」.',
        },
      ],
    },
    {
      id: 'n4-2',
      title: 'コンビニ',
      titleId: 'Toko Serba Ada (Konbini)',
      text: '日本の コンビニは とても 便利です。二十四時間 開いていて、食べ物や 飲み物だけでなく、本や 日用品も 売っています。宅配便を 送ったり、お金を 払ったりすることも できます。外国から 来た 人も よく 利用します。',
      textId: 'Konbini di Jepang sangat praktis. Buka 24 jam, tidak hanya menjual makanan dan minuman, tetapi juga buku dan barang kebutuhan harian. Kita juga bisa mengirim paket dan membayar uang. Orang dari luar negeri pun sering memanfaatkannya.',
      questions: [
        {
          q: 'コンビニは 何時間 開いていますか。',
          qId: 'Konbini buka berapa jam?',
          options: ['二十四時間', '十二時間', '八時間', '十時間'],
          answer: '二十四時間',
          explain: 'Teks menyebut「二十四時間 開いていて」.',
        },
        {
          q: 'コンビニで できない ことは 何ですか。',
          qId: 'Apa yang TIDAK bisa dilakukan di konbini?',
          options: ['車を 買う', 'お金を 払う', '宅配便を 送る', '本を 買う'],
          answer: '車を 買う',
          explain: 'Konbini menjual buku, melayani pembayaran, dan kirim paket — tetapi tidak menjual mobil.',
        },
        {
          q: 'この 文章の テーマは 何ですか。',
          qId: 'Apa tema teks ini?',
          options: ['コンビニの 便利さ', '日本の 食べ物', '外国の 店', '日本の 天気'],
          answer: 'コンビニの 便利さ',
          explain: 'Seluruh teks menjelaskan betapa praktisnya konbini.',
        },
      ],
    },
  ],
  n3: [
    {
      id: 'n3-1',
      title: 'リサイクルと 環境',
      titleId: 'Daur Ulang dan Lingkungan',
      text: '日本では、ごみを 分別して 出す 習慣が 広く 定着しています。ペットボトル、缶、瓶、紙などは それぞれ 別の 箱に 入れなければ なりません。この ような 取り組みは、資源を 大切に 使うだけでなく、環境への 負担を 減らす ことにも つながります。しかし、分別が 面倒だと 感じる 人も 少なく ありません。',
      textId: 'Di Jepang, kebiasaan memilah sampah sebelum dibuang sudah meluas. Botol plastik, kaleng, botol kaca, kertas, dan lain-lain harus dimasukkan ke kotak yang berbeda. Upaya seperti ini tidak hanya menghargai sumber daya, tetapi juga berkontribusi mengurangi beban pada lingkungan. Namun, tidak sedikit orang yang merasa pemilahan itu merepotkan.',
      questions: [
        {
          q: 'この 文章に よると、ごみは どう しなければ なりませんか。',
          qId: 'Menurut teks, sampah harus bagaimana?',
          options: ['分別して 出す', 'そのまま 捨てる', '家に 置く', '燃やす'],
          answer: '分別して 出す',
          explain: 'Teks menyebut「ごみを 分別して 出す 習慣」.',
        },
        {
          q: '分別の 利点として 挙げられていない ものは どれですか。',
          qId: 'Manfaat pemilahan yang TIDAK disebutkan?',
          options: ['お金が 増える', '資源を 大切に 使う', '環境への 負担を 減らす'],
          answer: 'お金が 増える',
          explain: 'Teks hanya menyebut hemat sumber daya dan kurangi beban lingkungan, bukan menambah uang.',
        },
        {
          q: '「しかし」の 後で、筆者は 何を 述べていますか。',
          qId: 'Setelah「しかし」, apa yang penulis nyatakan?',
          options: ['分別を 面倒だと 感じる 人も いる', 'みんな 分別が 好きだ', '分別は 簡単だ', '分別は 必要ない'],
          answer: '分別を 面倒だと 感じる 人も いる',
          explain: 'Teks berakhir「分別が 面倒だと 感じる 人も 少なく ありません」.',
        },
      ],
    },
  ],
  n2: [
    {
      id: 'n2-1',
      title: '在宅勤務の 広がり',
      titleId: 'Meluasnya Kerja dari Rumah',
      text: '近年、在宅勤務を 導入する 企業が 急速に 増えている。通勤時間が 不要に なる ことで、社員は 自分の 時間を 有効に 使えるように なった。一方で、仕事と 私生活の 境界が 曖昧に なり、かえって 疲れを 感じる という 声も 少なくない。また、同僚との 雑談が 減った ことで、チームの 一体感が 弱まった という 指摘も ある。',
      textId: 'Dalam beberapa tahun terakhir, perusahaan yang menerapkan kerja dari rumah meningkat pesat. Karena tidak perlu waktu perjalanan, karyawan bisa memanfaatkan waktu mereka secara efektif. Di sisi lain, batas antara kerja dan kehidupan pribadi menjadi kabur sehingga justru merasa lelah — keluhan seperti ini pun tidak sedikit. Ada pula kritik bahwa berkurangnya obrolan santai dengan rekan kerja melemahkan kebersamaan tim.',
      questions: [
        {
          q: '在宅勤務の 利点として 挙げられている ものは どれか。',
          qId: 'Manfaat kerja dari rumah yang disebutkan?',
          options: ['通勤時間が 不要に なる', '給料が 上がる', '仕事が 減る', '同僚が 増える'],
          answer: '通勤時間が 不要に なる',
          explain: 'Teks menyebut「通勤時間が 不要に なる ことで」sebagai keuntungan.',
        },
        {
          q: '在宅勤務の 問題点として 述べられている ものは どれか。',
          qId: 'Masalah kerja dari rumah yang disebutkan?',
          options: ['仕事と 私生活の 境界が 曖昧に なる', '通勤が 長く なる', '給料が 下がる'],
          answer: '仕事と 私生活の 境界が 曖昧に なる',
          explain: 'Teks menyebut「仕事と 私生活の 境界が 曖昧に なり」.',
        },
        {
          q: 'チームの 一体感が 弱まった 理由は 何か。',
          qId: 'Kenapa kebersamaan tim melemah?',
          options: ['同僚との 雑談が 減った から', '仕事が 増えた から', '給料が 下がった から'],
          answer: '同僚との 雑談が 減った から',
          explain: 'Teks menyebut「同僚との 雑談が 減った ことで」.',
        },
      ],
    },
  ],
  n1: [
    {
      id: 'n1-1',
      title: '言葉と 文化',
      titleId: 'Bahasa dan Budaya',
      text: '言葉は 単なる 伝達の 手段では なく、その 社会の 価値観や 思考様式を 映し出す 鏡でも ある。たとえば、日本語に は 相手との 関係に 応じて 使い分ける 敬語が 発達している。これは、集団の 和を 重んじる 文化が 言語体系に 反映された 結果だと 言えよう。逆に、言語の 変化が 社会の 変化を 促す ことも ある。言葉と 文化は、一方通行の 関係では なく、相互に 影響を 与え合う 循環的な 関係に あるのだ。',
      textId: 'Bahasa bukan sekadar alat komunikasi, melainkan juga cermin yang memantulkan nilai dan pola pikir suatu masyarakat. Misalnya, dalam bahasa Jepang berkembang bahasa hormat (keigo) yang digunakan sesuai hubungan dengan lawan bicara. Ini bisa dikatakan hasil dari budaya yang menjunjung keharmonisan kelompok yang tercermin dalam sistem bahasa. Sebaliknya, perubahan bahasa pun kadang mendorong perubahan sosial. Bahasa dan budaya bukan hubungan searah, melainkan hubungan sirkular yang saling memengaruhi.',
      questions: [
        {
          q: '筆者は 言葉を どのように とらえているか。',
          qId: 'Bagaimana penulis memandang bahasa?',
          options: ['社会の 価値観を 映す 鏡でも ある', '単なる 伝達手段に すぎない', '変化しない ものだ', '文化とは 無関係だ'],
          answer: '社会の 価値観を 映す 鏡でも ある',
          explain: 'Teks menyebut「その 社会の 価値観や 思考様式を 映し出す 鏡でも ある」.',
        },
        {
          q: '敬語の 発達は 何の 現れだと 述べているか。',
          qId: 'Perkembangan keigo disebut sebagai perwujudan apa?',
          options: ['集団の 和を 重んじる 文化', '個人主義の 強さ', '文字の 多さ', '外国の 影響'],
          answer: '集団の 和を 重んじる 文化',
          explain: 'Teks menyebut「集団の 和を 重んじる 文化が 言語体系に 反映された 結果」.',
        },
        {
          q: '言葉と 文化の 関係について、筆者は どう 述べているか。',
          qId: 'Soal hubungan bahasa dan budaya, apa kata penulis?',
          options: ['相互に 影響を 与え合う 関係だ', '文化が 一方的に 言葉を 決める', '言葉が 一方的に 文化を 決める', '無関係だ'],
          answer: '相互に 与え合う 関係だ',
          explain: 'Teks menutup「相互に 影響を 与え合う 循環的な 関係に あるのだ」.',
        },
      ],
    },
  ],
}

// Gabungkan bacaan dasar + tambahan per level
export const readings = {
  n5: [...base.n5, ...n5extra],
  n4: [...base.n4, ...n4a, ...n4b],
  n3: [...base.n3, ...n3extra],
  n2: [...base.n2, ...n2extra],
  n1: [...base.n1, ...n1extra],
}

export function getReadings(levelId) {
  return readings[levelId] || []
}
