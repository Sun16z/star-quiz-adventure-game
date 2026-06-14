import type { QuestionGrade, QuizQuestion } from './question-bank';

type Subject = '國語' | '數學' | '英語' | '生活' | '自然' | '社會' | '健體';
type Semester = 'a' | 'b';

interface GradeConfig {
  id: QuestionGrade;
  number: number;
  semester: Semester;
  label: string;
  subjects: readonly Subject[];
}

const LOW_SUBJECTS: readonly Subject[] = ['國語', '數學', '英語', '生活', '健體'];
const FULL_SUBJECTS: readonly Subject[] = ['國語', '數學', '英語', '自然', '社會', '健體'];

const GRADE_CONFIGS: GradeConfig[] = [
  gradeConfig(1, 'a', LOW_SUBJECTS),
  gradeConfig(1, 'b', LOW_SUBJECTS),
  gradeConfig(2, 'a', LOW_SUBJECTS),
  gradeConfig(2, 'b', LOW_SUBJECTS),
  gradeConfig(3, 'a', FULL_SUBJECTS),
  gradeConfig(3, 'b', FULL_SUBJECTS),
  gradeConfig(4, 'a', FULL_SUBJECTS),
  gradeConfig(4, 'b', FULL_SUBJECTS),
  gradeConfig(5, 'a', FULL_SUBJECTS),
  gradeConfig(5, 'b', FULL_SUBJECTS),
  gradeConfig(6, 'a', FULL_SUBJECTS),
  gradeConfig(6, 'b', FULL_SUBJECTS),
];

export const KANGXUAN_QUESTION_BANK: QuizQuestion[] = GRADE_CONFIGS.flatMap((config) => {
  const makers: Record<Subject, (config: GradeConfig) => QuizQuestion[]> = {
    國語: mandarinQuestions,
    數學: mathQuestions,
    英語: englishQuestions,
    生活: lifeQuestions,
    自然: naturalQuestions,
    社會: socialQuestions,
    健體: healthQuestions,
  };
  return config.subjects.flatMap((subject) => makers[subject](config));
});

function gradeConfig(number: number, semester: Semester, subjects: readonly Subject[]): GradeConfig {
  const term = semester === 'a' ? '上學期' : '下學期';
  return {
    id: `grade${number}${semester}` as QuestionGrade,
    number,
    semester,
    label: `${number}年級${term}`,
    subjects,
  };
}

function question(
  grade: QuestionGrade,
  subject: Subject,
  serial: number,
  prompt: string,
  options: readonly [string, string, string, string],
  answerIndex: number,
  explanation: string,
): QuizQuestion {
  const subjectCode: Record<Subject, string> = {
    國語: 'mandarin',
    數學: 'math',
    英語: 'english',
    生活: 'life',
    自然: 'natural',
    社會: 'social',
    健體: 'health',
  };
  return {
    id: `kx-${grade}-${subjectCode[subject]}-${String(serial).padStart(2, '0')}`,
    grade,
    subject,
    prompt,
    options,
    answerIndex,
    explanation,
  };
}

function mandarinQuestions(config: GradeConfig): QuizQuestion[] {
  const { id, number, semester } = config;
  if (number <= 2) {
    return [
      question(id, '國語', 1, '「妹妹把鉛筆放進書包裡。」這句話中的「書包」是什麼？', ['人物', '物品', '動作', '聲音'], 1, '書包是可以放東西的物品。'),
      question(id, '國語', 2, '「小鳥在天空飛翔。」哪一個詞語是動作？', ['小鳥', '天空', '飛翔', '一朵'], 2, '飛翔表示正在做的動作。'),
      question(id, '國語', 3, '下列哪一個量詞最適合：「一（　）白雲」？', ['本', '朵', '枝', '台'], 1, '白雲常用「朵」作量詞。'),
      question(id, '國語', 4, '「安靜」的相反詞最接近哪一個？', ['吵鬧', '整齊', '明亮', '乾淨'], 0, '安靜的相反可以是吵鬧。'),
      question(
        id,
        '國語',
        5,
        semester === 'a' ? '「早安，老師。」這句話最適合在什麼時候說？' : '「謝謝你幫我撿球。」這句話表達什麼心情？',
        semester === 'a' ? ['早上見面時', '睡覺以前', '下雨以前', '考試以後'] : ['感謝', '生氣', '害怕', '無聊'],
        0,
        semester === 'a' ? '早安是早上打招呼時使用。' : '向別人說謝謝，是表達感謝。',
      ),
    ];
  }

  const advancedPrompts = number <= 4
    ? [
        ['「小河唱著歌流過田邊。」這句用了哪一種修辭？', ['擬人', '設問', '排比', '引用'], 0, '小河不會真的唱歌，作者把它寫得像人一樣。'],
        ['「他跑得像風一樣快。」這句主要強調什麼？', ['速度很快', '聲音很小', '天氣很冷', '心情很差'], 0, '用「像風一樣」強調跑得很快。'],
        ['「半途而廢」最接近哪一個意思？', ['做到一半就放棄', '很早完成', '重新整理', '安靜等待'], 0, '半途而廢表示事情還沒做完就停止。'],
      ] as const
    : [
        ['「鍥而不捨」最接近哪一個意思？', ['持續努力', '半途而廢', '只看表面', '隨便應付'], 0, '鍥而不捨表示堅持努力不放棄。'],
        ['「雨後的操場像一面鏡子。」這句用了哪一種修辭？', ['譬喻', '設問', '摹聲', '引用'], 0, '把操場比成鏡子，是譬喻。'],
        ['作文結尾最適合放入哪一類內容？', ['收束主題與感想', '突然換新人物', '只列午餐菜色', '寫無關笑話'], 0, '結尾常用來總結主題並寫出感想。'],
      ] as const;

  return [
    question(id, '國語', 1, advancedPrompts[0][0], advancedPrompts[0][1], advancedPrompts[0][2], advancedPrompts[0][3]),
    question(id, '國語', 2, advancedPrompts[1][0], advancedPrompts[1][1], advancedPrompts[1][2], advancedPrompts[1][3]),
    question(id, '國語', 3, advancedPrompts[2][0], advancedPrompts[2][1], advancedPrompts[2][2], advancedPrompts[2][3]),
    question(id, '國語', 4, '「因為大家分工合作，所以活動順利完成。」這句的前後關係是什麼？', ['原因和結果', '時間和地點', '人物和外貌', '顏色和形狀'], 0, '因為說原因，所以說結果。'),
    question(
      id,
      '國語',
      5,
      semester === 'a' ? '閱讀短句：「小萱先查資料，再整理重點，最後完成報告。」這段主要寫什麼？' : '閱讀短句：「阿哲練習失敗後仍調整方法，隔天再試一次。」阿哲的態度最接近哪一個？',
      semester === 'a' ? ['完成報告的過程', '午餐很好吃', '操場很寬', '天氣很熱'] : ['願意改進', '立刻放棄', '故意拖延', '只想玩耍'],
      0,
      semester === 'a' ? '句子依序描述完成報告的步驟。' : '失敗後調整方法再試，表示願意改進。',
    ),
  ];
}

function mathQuestions(config: GradeConfig): QuizQuestion[] {
  const { id, number, semester } = config;
  const s = semester === 'a' ? 0 : 1;
  if (number === 1) {
    return [
      question(id, '數學', 1, `${8 + s} + ${5 + s} = ?`, ['11', String(13 + s * 2), '15', '18'], 1, '把兩個數合起來即可。'),
      question(id, '數學', 2, `${16 + s} - ${7 + s} = ?`, ['6', '8', '9', '12'], 2, '用減法算剩下多少。'),
      question(id, '數學', 3, '十位是 3、個位是 6 的數是多少？', ['36', '63', '30', '6'], 0, '十位 3 表示 30，個位 6 合起來是 36。'),
      question(id, '數學', 4, '下列哪一個數最大？', ['28', '35', '19', '31'], 1, '比較十位，再比較個位，35 最大。'),
      question(id, '數學', 5, '鐘面長針指向 12、短針指向 4，表示幾點？', ['3 點', '4 點', '6 點', '12 點'], 1, '長針在 12 是整點，短針在 4 是 4 點。'),
    ];
  }
  if (number === 2) {
    return [
      question(id, '數學', 1, `${6 + s} × 4 = ?`, ['20', String((6 + s) * 4), '28', '32'], 1, '乘法表示幾個相同數相加。'),
      question(id, '數學', 2, `${24 + s * 6} ÷ 3 = ?`, ['6', String((24 + s * 6) / 3), '10', '12'], 1, '平均分成 3 份。'),
      question(id, '數學', 3, '一枝筆 8 元，買 5 枝要多少元？', ['13 元', '32 元', '40 元', '58 元'], 2, '8 × 5 = 40。'),
      question(id, '數學', 4, '2 公尺 15 公分等於幾公分？', ['215 公分', '2015 公分', '217 公分', '115 公分'], 0, '2 公尺是 200 公分，再加 15 公分。'),
      question(id, '數學', 5, '8:40 再過 20 分鐘是幾點？', ['8:50', '9:00', '9:20', '10:00'], 1, '40 分再過 20 分到 60 分，也就是 9:00。'),
    ];
  }
  if (number === 3) {
    return [
      question(id, '數學', 1, `${125 + s * 20} × 4 = ?`, ['480', String((125 + s * 20) * 4), '620', '700'], 1, '可先拆成百位、十位、個位再相乘。'),
      question(id, '數學', 2, `${96 + s * 24} ÷ 8 = ?`, ['10', String((96 + s * 24) / 8), '16', '18'], 1, '用除法平均分成 8 份。'),
      question(id, '數學', 3, '1/5 + 2/5 = ?', ['3/5', '3/10', '2/10', '1/2'], 0, '同分母分數相加，分母不變，分子相加。'),
      question(id, '數學', 4, '一個長方形長 8 公分、寬 5 公分，周長是多少？', ['13 公分', '26 公分', '40 公分', '80 公分'], 1, '周長是四邊合計，也就是 (8 + 5) × 2。'),
      question(id, '數學', 5, '0.6 和 0.45 哪一個比較大？', ['0.6', '0.45', '一樣大', '無法比較'], 0, '0.6 可以看成 0.60，比 0.45 大。'),
    ];
  }
  if (number === 4) {
    return [
      question(id, '數學', 1, `${3.6 + s} + 2.45 = ?`, [String(5.05 + s), String(6.05 + s), String(6.5 + s), String(7.15 + s)], 1, '小數點對齊後相加。'),
      question(id, '數學', 2, '3/8 + 2/8 = ?', ['5/8', '5/16', '1/2', '6/8'], 0, '同分母分數相加，分母不變。'),
      question(id, '數學', 3, '一個角小於 90 度，稱為什麼角？', ['銳角', '直角', '鈍角', '平角'], 0, '小於 90 度的是銳角。'),
      question(id, '數學', 4, '長方形長 9 公分、寬 6 公分，面積是多少？', ['15 平方公分', '30 平方公分', '54 平方公分', '60 平方公分'], 2, '長方形面積是長乘以寬。'),
      question(id, '數學', 5, '三角形三個內角合起來是多少？', ['90 度', '180 度', '270 度', '360 度'], 1, '三角形內角和是 180 度。'),
    ];
  }
  if (number === 5) {
    return [
      question(id, '數學', 1, '18 和 24 的最大公因數是多少？', ['3', '4', '6', '12'], 2, '18 和 24 共同因數中最大的是 6。'),
      question(id, '數學', 2, '3/4 + 1/8 = ?', ['4/12', '5/8', '7/8', '1'], 2, '3/4 = 6/8，再加 1/8 得 7/8。'),
      question(id, '數學', 3, '0.6 × 0.5 = ?', ['0.03', '0.3', '1.1', '3'], 1, '6 × 5 = 30，小數共有兩位，所以是 0.30。'),
      question(id, '數學', 4, '長方體長 5、寬 4、高 3，體積是多少？', ['12', '20', '60', '120'], 2, '長方體體積 = 長 × 寬 × 高。'),
      question(id, '數學', 5, '一件外套原價 800 元，打 9 折後是多少元？', ['720 元', '760 元', '790 元', '900 元'], 0, '9 折是原價的 0.9 倍，800 × 0.9 = 720。'),
    ];
  }
  return [
    question(id, '數學', 1, '一段路 120 公里，花 2 小時走完，平均速率是多少？', ['40 公里/時', '60 公里/時', '80 公里/時', '240 公里/時'], 1, '速率 = 距離 ÷ 時間 = 120 ÷ 2。'),
    question(id, '數學', 2, '圓周率用 3.14 計算，直徑 10 公分的圓周長約是多少？', ['15.7 公分', '31.4 公分', '62.8 公分', '100 公分'], 1, '圓周長 = 直徑 × 圓周率。'),
    question(id, '數學', 3, '甲乙人數比是 2：3，若甲有 12 人，乙有幾人？', ['8 人', '15 人', '18 人', '24 人'], 2, '甲 2 份是 12 人，1 份是 6 人，乙 3 份是 18 人。'),
    question(id, '數學', 4, '一組資料 6、8、10、12 的平均數是多少？', ['8', '9', '10', '12'], 1, '總和 36，除以 4 得 9。'),
    question(id, '數學', 5, '12 是 48 的百分之幾？', ['20%', '25%', '30%', '40%'], 1, '12 ÷ 48 = 0.25，也就是 25%。'),
  ];
}

function englishQuestions(config: GradeConfig): QuizQuestion[] {
  const { id, number, semester } = config;
  if (number <= 2) {
    return [
      question(id, '英語', 1, '「書」的英文是哪一個？', ['book', 'desk', 'egg', 'cat'], 0, 'book 是書。'),
      question(id, '英語', 2, 'red 的中文意思是什麼？', ['紅色', '藍色', '綠色', '黃色'], 0, 'red 是紅色。'),
      question(id, '英語', 3, '「早安」可以怎麼說？', ['Good morning.', 'Good night.', 'Thank you.', 'Sit down.'], 0, 'Good morning. 是早安。'),
      question(id, '英語', 4, '「三」的英文是哪一個？', ['one', 'two', 'three', 'ten'], 2, 'three 是三。'),
      question(id, '英語', 5, semester === 'a' ? 'cat 的第一個字母是？' : 'dog 的第一個字母是？', semester === 'a' ? ['C', 'A', 'T', 'G'] : ['D', 'O', 'G', 'B'], 0, '看英文單字的開頭字母即可。'),
    ];
  }
  return [
    question(id, '英語', 1, 'Which sentence is correct?', ['She likes milk.', 'She like milk.', 'She are milk.', 'She liking milk.'], 0, 'She 搭配 likes。'),
    question(id, '英語', 2, '「現在幾點？」的英文最接近哪一句？', ['What time is it?', 'Where are you?', 'How old are you?', 'What color is it?'], 0, '詢問時間可以說 What time is it?'),
    question(id, '英語', 3, 'A: Do you like bananas? B: Yes, I do. B 的意思是什麼？', ['是的，我喜歡。', '不，我不喜歡。', '我在學校。', '它是黃色。'], 0, 'Yes, I do. 是肯定回答。'),
    question(id, '英語', 4, '「圖書館」的英文是哪一個？', ['library', 'kitchen', 'bathroom', 'market'], 0, 'library 是圖書館。'),
    question(id, '英語', 5, number >= 5 ? '「我昨天打籃球。」英文最接近哪一句？' : '「我會游泳。」英文最接近哪一句？', number >= 5 ? ['I played basketball yesterday.', 'I play basketball tomorrow.', 'I am basketball.', 'I can yesterday.'] : ['I can swim.', 'I am swim.', 'I swim can.', 'I swimming can.'], 0, number >= 5 ? 'yesterday 表示昨天，動詞 play 變 played。' : '表達能力可用 can 加原形動詞。'),
  ];
}

function lifeQuestions(config: GradeConfig): QuizQuestion[] {
  const { id, semester } = config;
  return [
    question(id, '生活', 1, '看到同學跌倒受傷，最適合先做什麼？', ['請老師或大人幫忙', '大聲笑他', '馬上跑走', '把他的東西藏起來'], 0, '同學受傷時要先找大人協助。'),
    question(id, '生活', 2, '要節約用水，刷牙時最好怎麼做？', ['用杯子裝水', '水龍頭一直開', '用水管玩水', '忘記關水'], 0, '用杯子裝水可以減少浪費。'),
    question(id, '生活', 3, '下雨天走路，哪一個行為比較安全？', ['慢慢走並注意路面', '在水坑旁奔跑', '邊走邊追逐', '站在馬路中間'], 0, '雨天路滑，要慢慢走並注意安全。'),
    question(id, '生活', 4, semester === 'a' ? '觀察校園植物時，哪一個做法最合適？' : '分類回收時，紙張通常應放在哪一類？', semester === 'a' ? ['用眼睛觀察並做記錄', '折斷樹枝', '踩進花圃', '亂摘花朵'] : ['紙類', '廚餘', '電池', '玻璃'], 0, semester === 'a' ? '觀察時要愛護植物。' : '乾淨紙張通常屬於紙類回收。'),
  ];
}

function naturalQuestions(config: GradeConfig): QuizQuestion[] {
  const { id, number } = config;
  return [
    question(id, '自然', 1, '植物行光合作用時，主要需要陽光、水和哪一種氣體？', ['二氧化碳', '氧氣', '氮氣', '氫氣'], 0, '植物利用二氧化碳、水和陽光製造養分。'),
    question(id, '自然', 2, '聲音在下列哪一種情況下最不容易傳播？', ['真空中', '空氣中', '水中', '金屬中'], 0, '聲音需要介質傳播，真空中沒有介質。'),
    question(id, '自然', 3, '磁鐵最可能吸住哪一種物品？', ['鐵製迴紋針', '塑膠尺', '紙張', '木頭鉛筆'], 0, '磁鐵可以吸引鐵製物品。'),
    question(id, '自然', 4, number >= 5 ? '水蒸氣遇冷變成小水滴，這個現象叫什麼？' : '蝴蝶的幼蟲通常叫什麼？', number >= 5 ? ['凝結', '燃燒', '溶解', '摩擦'] : ['毛毛蟲', '蝌蚪', '小魚', '小鳥'], 0, number >= 5 ? '氣體遇冷變液體稱為凝結。' : '蝴蝶幼蟲常稱為毛毛蟲。'),
  ];
}

function socialQuestions(config: GradeConfig): QuizQuestion[] {
  const { id, number } = config;
  return [
    question(id, '社會', 1, '想了解道路、河流和學校位置，最適合看哪一種資料？', ['地圖', '菜單', '童話書', '日記'], 0, '地圖可以呈現位置和空間分布。'),
    question(id, '社會', 2, '居民一起討論公園改建，屬於哪一種行動？', ['公共參與', '逃避責任', '獨自占用', '破壞環境'], 0, '關心並討論公共事務是公共參與。'),
    question(id, '社會', 3, '判讀網路訊息時，哪一個做法較好？', ['確認來源並比較資料', '只看標題就轉傳', '看到驚嘆號就相信', '朋友傳的都正確'], 0, '媒體識讀要確認來源和多方資料。'),
    question(id, '社會', 4, number >= 5 ? '台灣中央山脈大致呈現哪一種走向？' : '聚落常靠近水源發展，主要是因為水源可提供什麼？', number >= 5 ? ['南北走向', '東西走向', '圓形分布', '放射狀分布'] : ['生活用水與灌溉', '讓房子自動變高', '讓道路消失', '讓天氣永遠晴朗'], 0, number >= 5 ? '中央山脈大致由北向南延伸。' : '水源和生活、農業需求有關。'),
  ];
}

function healthQuestions(config: GradeConfig): QuizQuestion[] {
  const { id, number } = config;
  return [
    question(id, '健體', 1, '運動前最適合先做什麼？', ['暖身活動', '立刻衝刺', '喝很多冰水', '閉眼奔跑'], 0, '運動前暖身可以降低受傷機會。'),
    question(id, '健體', 2, '飯前和上完廁所後應該做什麼？', ['洗手', '大喊大叫', '不喝水', '躺在地上'], 0, '洗手能減少病菌傳播。'),
    question(id, '健體', 3, '過馬路時哪一個行為比較安全？', ['看號誌並左右觀察', '低頭滑手機', '突然衝出去', '在車陣中玩耍'], 0, '遵守號誌並觀察車輛較安全。'),
    question(id, '健體', 4, number >= 5 ? '遇到同學被排擠時，哪一個做法較合適？' : '想保護眼睛，使用平板一段時間後應該怎麼做？', number >= 5 ? ['告訴老師並關心同學', '一起取笑他', '把事情錄下來嘲笑', '假裝沒看見'] : ['休息並看遠方', '貼很近看', '關燈繼續看', '連續看好幾小時'], 0, number >= 5 ? '遇到霸凌或排擠要尋求協助並支持同學。' : '讓眼睛休息可降低疲勞。'),
  ];
}
