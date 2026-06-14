import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const root = process.cwd();
const grades = [1, 2, 3, 4, 5, 6];
const semesters = [
  { id: 'a', label: '上學期' },
  { id: 'b', label: '下學期' },
];
const subjects = ['國語', '英語', '數學'];
const exams = [
  { id: 'midterm', label: '期中考' },
  { id: 'final', label: '期末考' },
];

const subjectCode = { 國語: 'mandarin', 英語: 'english', 數學: 'math' };
const referenceUrl = 'https://melances.com/test-bank/';

const questions = [];

for (const grade of grades) {
  for (const semester of semesters) {
    for (const subject of subjects) {
      for (const exam of exams) {
        const context = { grade, semester: semester.id, semesterLabel: semester.label, subject, exam: exam.id, examLabel: exam.label };
        const makers = {
          國語: mandarinQuestions,
          英語: englishQuestions,
          數學: mathQuestions,
        };
        questions.push(...makers[subject](context));
      }
    }
  }
}

const dataset = {
  schemaVersion: 1,
  title: '台灣國小康軒版國英數題庫',
  description: '原創選擇題資料集，依國小一到六年級、上下學期、國語/英語/數學、期中/期末分類，可供遊戲或練習系統重用。',
  publisher: '康軒',
  licenseNote: '題目為本專案原創題型，用於對應康軒版國小常見段考範圍；未複製第三方考卷原文。',
  sourceReference: {
    title: '米蘭老師教育資訊室：國中國小題庫考古題下載網站',
    url: referenceUrl,
    usedFor: '確認國小年級、版本、科目、上下學期與期中期末分類方式。',
  },
  grades: grades.flatMap((grade) => semesters.map((semester) => ({
    id: `grade${grade}${semester.id}`,
    grade,
    semester: semester.id,
    label: `${grade}年級${semester.label}`,
  }))),
  subjects,
  exams,
  questions,
};

writeJson('src/question-bank/elementary-kangxuan.json', dataset);
writeJson('public/question-bank/elementary-kangxuan.json', dataset);

function writeJson(path, value) {
  const output = resolve(root, path);
  mkdirSync(dirname(output), { recursive: true });
  writeFileSync(output, `${JSON.stringify(value, null, 2)}\n`);
}

function baseMeta(context, serial, skill, difficulty) {
  const gradeId = `grade${context.grade}${context.semester}`;
  return {
    id: `kx-${gradeId}-${context.exam}-${subjectCode[context.subject]}-${String(serial).padStart(2, '0')}`,
    publisher: '康軒',
    grade: gradeId,
    gradeNumber: context.grade,
    gradeLabel: `${context.grade}年級${context.semesterLabel}`,
    semester: context.semester,
    semesterLabel: context.semesterLabel,
    subject: context.subject,
    exam: context.exam,
    examLabel: context.examLabel,
    skill,
    difficulty,
    source: {
      type: 'original',
      referenceUrl,
    },
  };
}

function q(context, serial, skill, difficulty, prompt, options, answerIndex, explanation) {
  return {
    ...baseMeta(context, serial, skill, difficulty),
    prompt,
    options,
    answerIndex,
    explanation,
  };
}

function mandarinQuestions(context) {
  const { grade, semester, exam } = context;
  const lower = grade <= 2;
  const serialOffset = exam === 'final' ? 20 : 0;
  const final = exam === 'final';
  if (lower) {
    return [
      q(context, serialOffset + 1, '字音字形', 1, final ? '「小朋友在花園裡看見一隻蝴蝶。」哪一個詞是動物？' : '「太陽升起來了，天空變亮了。」哪一個詞表示自然景物？', final ? ['花園', '蝴蝶', '小朋友', '看見'] : ['太陽', '起來', '變亮', '天空'], final ? 1 : 0, final ? '蝴蝶是動物。' : '太陽是自然景物。'),
      q(context, serialOffset + 2, '量詞', 1, final ? '下列哪一個量詞最適合：「一（　）雨傘」？' : '下列哪一個量詞最適合：「一（　）鉛筆」？', final ? ['本', '把', '朵', '隻'] : ['枝', '片', '台', '條'], final ? 1 : 0, final ? '雨傘常用「把」。' : '鉛筆常用「枝」。'),
      q(context, serialOffset + 3, '詞意', 1, final ? '「整齊」的意思最接近哪一個？' : '「仔細」的意思最接近哪一個？', final ? ['亂七八糟', '排列有秩序', '聲音很大', '跑得很快'] : ['小心認真', '非常吵鬧', '馬上睡覺', '到處亂放'], final ? 1 : 0, final ? '整齊表示排列有秩序。' : '仔細表示小心、認真。'),
      q(context, serialOffset + 4, '句意理解', 1, final ? '「妹妹先洗手，再吃點心。」哪一件事先發生？' : '「哥哥一邊唱歌，一邊收玩具。」哥哥做了幾件事？', final ? ['吃點心', '洗手', '睡覺', '上學'] : ['1 件', '2 件', '3 件', '4 件'], final ? 1 : 1, final ? '句子說先洗手，再吃點心。' : '唱歌和收玩具是兩件事。'),
      q(context, serialOffset + 5, '標點', 1, final ? '「哇　彩虹出現了」空格最適合加什麼標點？' : '「你要去哪裡」句尾最適合加什麼標點？', final ? ['。', '！', '、', '：'] : ['？', '，', '！', '、'], final ? 1 : 0, final ? '表示驚喜可用驚嘆號。' : '詢問時句尾用問號。'),
      q(context, serialOffset + 6, '閱讀理解', 2, semester === 'a' ? '短文：「小安每天澆水，豆苗慢慢長高。」小安做了什麼？' : '短文：「小莉把掉在地上的書撿起來，交給老師。」小莉的行為最接近哪一個？', semester === 'a' ? ['澆水', '跑步', '買菜', '畫畫'] : ['負責任', '愛生氣', '不小心', '想睡覺'], 0, semester === 'a' ? '短文說小安每天澆水。' : '撿到書交給老師，是負責任的行為。'),
    ];
  }

  const advanced = grade <= 4;
  return [
    q(context, serialOffset + 1, '修辭', advanced ? 2 : 3, final ? '「操場像一片綠色海洋。」這句用了哪一種修辭？' : '「樹葉在風中跳舞。」這句用了哪一種修辭？', final ? ['譬喻', '設問', '排比', '引用'] : ['擬人', '誇飾', '頂真', '反問'], 0, final ? '把操場比成海洋，是譬喻。' : '樹葉不會跳舞，這是擬人。'),
    q(context, serialOffset + 2, '成語詞語', advanced ? 2 : 3, final ? '「一舉兩得」最接近哪一個意思？' : '「半途而廢」最接近哪一個意思？', final ? ['一次得到兩種好處', '做事很慢', '完全沒收穫', '只看表面'] : ['做到一半就放棄', '按時完成', '重新整理', '仔細觀察'], 0, final ? '一舉兩得表示一次行動得到兩種收穫。' : '半途而廢表示事情沒完成就停止。'),
    q(context, serialOffset + 3, '關聯詞', advanced ? 2 : 3, final ? '「他（　）每天練習，（　）進步很快。」括號最適合填哪一組？' : '「（　）下雨，（　）運動會延期。」括號最適合填哪一組？', final ? ['因為／所以', '雖然／但是', '不但／而且', '如果／仍然'] : ['因為／所以', '不但／而且', '一邊／一邊', '越來／越'], 0, '前後是原因和結果，適合用「因為／所以」。'),
    q(context, serialOffset + 4, '閱讀理解', advanced ? 2 : 4, final ? '短文：「阿庭先訪問長輩，再整理照片，最後完成家鄉報告。」這段主要寫什麼？' : '短文：「比賽失敗後，佳芸記下問題，隔天繼續練習。」佳芸的態度最接近哪一個？', final ? ['完成報告的過程', '午餐菜色', '操場大小', '天氣變化'] : ['願意檢討改進', '立刻放棄', '故意拖延', '只想休息'], 0, final ? '短文依序寫完成報告的步驟。' : '失敗後記下問題並練習，表示願意改進。'),
    q(context, serialOffset + 5, '寫作結構', advanced ? 2 : 4, final ? '作文結尾最適合放入哪一類內容？' : '文章開頭最適合先交代什麼？', final ? ['收束主題與感想', '突然加入無關人物', '只列出零食', '重複題目十次'] : ['時間、地點或主題', '完整答案解析', '無關笑話', '購物清單'], 0, final ? '結尾常用來總結主題並寫出感想。' : '開頭可先讓讀者知道情境或主題。'),
    q(context, serialOffset + 6, '字詞辨析', advanced ? 2 : 3, final ? '下列哪一個詞語用字正確？' : '「他能清楚（　）別方向。」括號中最適合填哪個字？', final ? ['分辨方向', '分辯方向', '辦別方向', '花瓣方向'] : ['辨', '辯', '瓣', '辦'], 0, final ? '「分辨」表示區分、判斷。' : '辨有分辨、判斷的意思。'),
  ];
}

function englishQuestions(context) {
  const { grade, semester, exam } = context;
  const serialOffset = exam === 'final' ? 20 : 0;
  const final = exam === 'final';
  if (grade <= 2) {
    return [
      q(context, serialOffset + 1, '字母與單字', 1, final ? '「書包」的英文最接近哪一個？' : '「書」的英文是哪一個？', final ? ['bag', 'sun', 'fish', 'milk'] : ['book', 'cat', 'red', 'desk'], 0, final ? 'bag 是包包、書包。' : 'book 是書。'),
      q(context, serialOffset + 2, '顏色', 1, final ? 'blue 的中文意思是什麼？' : 'red 的中文意思是什麼？', final ? ['藍色', '紅色', '黃色', '綠色'] : ['紅色', '藍色', '黑色', '白色'], 0, final ? 'blue 是藍色。' : 'red 是紅色。'),
      q(context, serialOffset + 3, '日常用語', 1, final ? '「謝謝你。」可以怎麼說？' : '「早安。」可以怎麼說？', final ? ['Thank you.', 'Good night.', 'Stand up.', 'I am ten.'] : ['Good morning.', 'Goodbye.', 'I like rice.', 'Open it.'], 0, final ? 'Thank you. 是謝謝你。' : 'Good morning. 是早安。'),
      q(context, serialOffset + 4, '數字', 1, final ? 'five 表示哪一個數字？' : 'three 表示哪一個數字？', final ? ['5', '2', '7', '9'] : ['1', '2', '3', '10'], final ? 0 : 2, final ? 'five 是 5。' : 'three 是 3。'),
      q(context, serialOffset + 5, '自然拼讀', 1, final ? 'dog 的第一個字母是？' : 'cat 的第一個字母是？', final ? ['D', 'O', 'G', 'B'] : ['C', 'A', 'T', 'G'], 0, '看英文單字的第一個字母即可。'),
      q(context, serialOffset + 6, '句型理解', 1, semester === 'a' ? 'A: How are you? B: I am fine. B 的意思最接近哪一個？' : 'A: What is this? B: It is a pencil. B 在說這是什麼？', semester === 'a' ? ['我很好', '我是鉛筆', '我在跑步', '我七歲'] : ['鉛筆', '橡皮擦', '蘋果', '狗'], 0, semester === 'a' ? 'I am fine. 表示我很好。' : 'pencil 是鉛筆。'),
    ];
  }
  return [
    q(context, serialOffset + 1, '句型', grade <= 4 ? 2 : 3, final ? 'Which sentence is correct?' : '「我會游泳。」英文最接近哪一句？', final ? ['She likes apples.', 'She like apples.', 'She are apples.', 'She liking apples.'] : ['I can swim.', 'I am swim.', 'I swim can.', 'I swimming can.'], 0, final ? 'She 搭配 likes。' : 'can 後面接原形動詞 swim。'),
    q(context, serialOffset + 2, '疑問句', grade <= 4 ? 2 : 3, final ? '「你住在哪裡？」英文最接近哪一句？' : '「現在幾點？」英文最接近哪一句？', final ? ['Where do you live?', 'What time is it?', 'How old are you?', 'Do you like rice?'] : ['What time is it?', 'Where are you?', 'How many books?', 'What color is it?'], 0, final ? 'Where do you live? 用來詢問住在哪裡。' : 'What time is it? 用來詢問時間。'),
    q(context, serialOffset + 3, '閱讀理解', grade <= 4 ? 2 : 3, final ? 'Read: Ben has math on Tuesday. When does Ben have math?' : 'Read: Amy likes bananas, but she does not like milk. What does Amy like?', final ? ['On Tuesday.', 'On Sunday.', 'At home.', 'In the park.'] : ['Bananas.', 'Milk.', 'Water.', 'Rice.'], 0, final ? '句子說 Ben has math on Tuesday。' : '句子說 Amy likes bananas。'),
    q(context, serialOffset + 4, '單字', grade <= 4 ? 2 : 3, final ? '「圖書館」的英文是哪一個？' : '「廚房」的英文是哪一個？', final ? ['library', 'kitchen', 'bathroom', 'market'] : ['kitchen', 'library', 'hospital', 'station'], 0, final ? 'library 是圖書館。' : 'kitchen 是廚房。'),
    q(context, serialOffset + 5, '文法', grade <= 4 ? 2 : 4, final ? '「我昨天打籃球。」英文最接近哪一句？' : 'A: Do you like oranges? B: Yes, I do. B 的意思是什麼？', final ? ['I played basketball yesterday.', 'I play basketball tomorrow.', 'I am basketball.', 'I can yesterday.'] : ['是的，我喜歡。', '不，我不喜歡。', '我在學校。', '它是橘色。'], 0, final ? 'yesterday 表示昨天，play 變 played。' : 'Yes, I do. 是肯定回答。'),
    q(context, serialOffset + 6, '語意搭配', grade <= 4 ? 2 : 3, semester === 'a' ? 'Which word is about food?' : 'Which word is about weather?', semester === 'a' ? ['sandwich', 'bedroom', 'pencil', 'train'] : ['rainy', 'library', 'marker', 'uncle'], 0, semester === 'a' ? 'sandwich 是食物。' : 'rainy 是天氣相關單字。'),
  ];
}

function mathQuestions(context) {
  const { grade, semester, exam } = context;
  const s = semester === 'a' ? 0 : 1;
  const final = exam === 'final';
  const serialOffset = final ? 20 : 0;
  if (grade === 1) {
    return [
      q(context, serialOffset + 1, '加減法', 1, `${8 + s} + ${5 + s} = ?`, ['11', String(13 + s * 2), '15', '18'], 1, '把兩個數合起來即可。'),
      q(context, serialOffset + 2, '加減法', 1, `${16 + s} - ${7 + s} = ?`, ['6', '8', '9', '12'], 2, '用減法算剩下多少。'),
      q(context, serialOffset + 3, '位值', 1, final ? '十位是 4、個位是 2 的數是多少？' : '十位是 3、個位是 6 的數是多少？', final ? ['42', '24', '40', '2'] : ['36', '63', '30', '6'], 0, '十位和個位合起來就是這個兩位數。'),
      q(context, serialOffset + 4, '比較大小', 1, final ? '下列哪一個數最小？' : '下列哪一個數最大？', final ? ['28', '35', '19', '31'] : ['28', '35', '19', '31'], final ? 2 : 1, final ? '19 比其他選項小。' : '35 比其他選項大。'),
      q(context, serialOffset + 5, '時間', 1, final ? '鐘面長針指向 12、短針指向 7，表示幾點？' : '鐘面長針指向 12、短針指向 4，表示幾點？', final ? ['6 點', '7 點', '12 點', '5 點'] : ['3 點', '4 點', '6 點', '12 點'], final ? 1 : 1, '長針在 12 是整點，短針指到幾就是幾點。'),
      q(context, serialOffset + 6, '應用題', 1, final ? '桌上有 12 顆糖，吃掉 5 顆，還剩幾顆？' : '小明有 9 張貼紙，又得到 4 張，共有幾張？', final ? ['5', '6', '7', '8'] : ['11', '12', '13', '14'], final ? 2 : 2, final ? '12 - 5 = 7。' : '9 + 4 = 13。'),
    ];
  }
  if (grade === 2) {
    return [
      q(context, serialOffset + 1, '乘法', 1, `${6 + s} × 4 = ?`, ['20', String((6 + s) * 4), '28', '32'], 1, '乘法表示幾個相同數相加。'),
      q(context, serialOffset + 2, '除法', 1, `${24 + s * 6} ÷ 3 = ?`, ['6', String((24 + s * 6) / 3), '10', '12'], 1, '平均分成 3 份。'),
      q(context, serialOffset + 3, '乘法應用', 1, '一枝筆 8 元，買 5 枝要多少元？', ['13 元', '32 元', '40 元', '58 元'], 2, '8 × 5 = 40。'),
      q(context, serialOffset + 4, '長度', 2, final ? '3 公尺 20 公分等於幾公分？' : '2 公尺 15 公分等於幾公分？', final ? ['320 公分', '3020 公分', '323 公分', '120 公分'] : ['215 公分', '2015 公分', '217 公分', '115 公分'], 0, '1 公尺是 100 公分。'),
      q(context, serialOffset + 5, '時間', 2, final ? '9:45 再過 15 分鐘是幾點？' : '8:40 再過 20 分鐘是幾點？', final ? ['9:50', '10:00', '10:15', '11:00'] : ['8:50', '9:00', '9:20', '10:00'], final ? 1 : 1, '分針加到 60 分時，時針進一小時。'),
      q(context, serialOffset + 6, '資料整理', 2, final ? '小組得到星星數：3、5、4、5。最多的是幾顆？' : '投票結果：蘋果 6 票、香蕉 4 票、葡萄 8 票。最多人選哪一個？', final ? ['3', '4', '5', '6'] : ['蘋果', '香蕉', '葡萄', '一樣多'], final ? 2 : 2, final ? '3、5、4、5 中最大是 5。' : '8 票最多，所以是葡萄。'),
    ];
  }
  if (grade === 3) {
    return [
      q(context, serialOffset + 1, '整數乘除', 2, `${125 + s * 20} × 4 = ?`, ['480', String((125 + s * 20) * 4), '620', '700'], 1, '可拆成百位、十位、個位再相乘。'),
      q(context, serialOffset + 2, '整數乘除', 2, `${96 + s * 24} ÷ 8 = ?`, ['10', String((96 + s * 24) / 8), '16', '18'], 1, '用除法平均分成 8 份。'),
      q(context, serialOffset + 3, '分數', 2, final ? '2/7 + 3/7 = ?' : '1/5 + 2/5 = ?', final ? ['5/7', '5/14', '6/7', '1/7'] : ['3/5', '3/10', '2/10', '1/2'], 0, '同分母分數相加，分母不變，分子相加。'),
      q(context, serialOffset + 4, '周長', 2, '一個長方形長 8 公分、寬 5 公分，周長是多少？', ['13 公分', '26 公分', '40 公分', '80 公分'], 1, '周長是四邊合計，也就是 (8 + 5) × 2。'),
      q(context, serialOffset + 5, '小數', 2, final ? '0.8 和 0.75 哪一個比較大？' : '0.6 和 0.45 哪一個比較大？', final ? ['0.8', '0.75', '一樣大', '無法比較'] : ['0.6', '0.45', '一樣大', '無法比較'], 0, final ? '0.8 可看成 0.80，比 0.75 大。' : '0.6 可看成 0.60，比 0.45 大。'),
      q(context, serialOffset + 6, '容量重量', 2, final ? '2 公斤 300 公克等於幾公克？' : '1 公升 200 毫升等於幾毫升？', final ? ['2300 公克', '203 公克', '3200 公克', '2003 公克'] : ['1200 毫升', '102 毫升', '1002 毫升', '2200 毫升'], 0, final ? '1 公斤是 1000 公克。' : '1 公升是 1000 毫升。'),
    ];
  }
  if (grade === 4) {
    return [
      q(context, serialOffset + 1, '小數', 3, `${3.6 + s} + 2.45 = ?`, [String(5.05 + s), String(6.05 + s), String(6.5 + s), String(7.15 + s)], 1, '小數點對齊後相加。'),
      q(context, serialOffset + 2, '分數', 3, final ? '5/9 - 2/9 = ?' : '3/8 + 2/8 = ?', final ? ['3/9', '3/18', '7/9', '1/9'] : ['5/8', '5/16', '1/2', '6/8'], 0, '同分母分數計算，分母不變。'),
      q(context, serialOffset + 3, '角度', 2, final ? '一個角大於 90 度、小於 180 度，稱為什麼角？' : '一個角小於 90 度，稱為什麼角？', final ? ['銳角', '直角', '鈍角', '平角'] : ['銳角', '直角', '鈍角', '平角'], final ? 2 : 0, final ? '大於 90 度且小於 180 度的是鈍角。' : '小於 90 度的是銳角。'),
      q(context, serialOffset + 4, '面積', 3, '長方形長 9 公分、寬 6 公分，面積是多少？', ['15 平方公分', '30 平方公分', '54 平方公分', '60 平方公分'], 2, '長方形面積是長乘以寬。'),
      q(context, serialOffset + 5, '幾何', 3, '三角形三個內角合起來是多少？', ['90 度', '180 度', '270 度', '360 度'], 1, '三角形內角和是 180 度。'),
      q(context, serialOffset + 6, '概數', 3, final ? '4968 四捨五入到千位約是多少？' : '348 四捨五入到十位約是多少？', final ? ['4000', '5000', '4900', '4960'] : ['300', '340', '350', '400'], final ? 1 : 2, final ? '百位是 9，要進位成 5000。' : '個位是 8，要進位成 350。'),
    ];
  }
  if (grade === 5) {
    return [
      q(context, serialOffset + 1, '因數倍數', 3, final ? '12 和 18 的最小公倍數是多少？' : '18 和 24 的最大公因數是多少？', final ? ['24', '30', '36', '72'] : ['3', '4', '6', '12'], final ? 2 : 2, final ? '12 的倍數有 12、24、36；18 的倍數有 18、36，所以最小公倍數是 36。' : '18 和 24 共同因數中最大的是 6。'),
      q(context, serialOffset + 2, '異分母分數', 3, '3/4 + 1/8 = ?', ['4/12', '5/8', '7/8', '1'], 2, '3/4 = 6/8，再加 1/8 得 7/8。'),
      q(context, serialOffset + 3, '小數乘除', 3, final ? '1.2 ÷ 0.3 = ?' : '0.6 × 0.5 = ?', final ? ['0.4', '4', '40', '1.5'] : ['0.03', '0.3', '1.1', '3'], final ? 1 : 1, final ? '1.2 ÷ 0.3 可同乘 10，變成 12 ÷ 3 = 4。' : '6 × 5 = 30，小數共有兩位，所以是 0.30。'),
      q(context, serialOffset + 4, '體積', 3, '長方體長 5、寬 4、高 3，體積是多少？', ['12', '20', '60', '120'], 2, '長方體體積 = 長 × 寬 × 高。'),
      q(context, serialOffset + 5, '百分率', 3, final ? '250 元商品打 8 折後是多少元？' : '一件外套原價 800 元，打 9 折後是多少元？', final ? ['180 元', '200 元', '220 元', '240 元'] : ['720 元', '760 元', '790 元', '900 元'], final ? 1 : 0, final ? '8 折是原價的 0.8 倍，250 × 0.8 = 200。' : '9 折是原價的 0.9 倍，800 × 0.9 = 720。'),
      q(context, serialOffset + 6, '速率', 4, final ? '走 15 公里花 3 小時，平均每小時走幾公里？' : '汽車 2 小時行駛 120 公里，平均每小時幾公里？', final ? ['3', '5', '12', '45'] : ['40', '60', '80', '240'], final ? 1 : 1, '速率 = 距離 ÷ 時間。'),
    ];
  }
  return [
    q(context, serialOffset + 1, '速率', 4, '一段路 120 公里，花 2 小時走完，平均速率是多少？', ['40 公里/時', '60 公里/時', '80 公里/時', '240 公里/時'], 1, '速率 = 距離 ÷ 時間 = 120 ÷ 2。'),
    q(context, serialOffset + 2, '圓', 4, final ? '半徑 5 公分的圓，直徑是多少？' : '圓周率用 3.14 計算，直徑 10 公分的圓周長約是多少？', final ? ['5 公分', '10 公分', '15 公分', '25 公分'] : ['15.7 公分', '31.4 公分', '62.8 公分', '100 公分'], final ? 1 : 1, final ? '直徑是半徑的 2 倍。' : '圓周長 = 直徑 × 圓周率。'),
    q(context, serialOffset + 3, '比與比值', 4, '甲乙人數比是 2：3，若甲有 12 人，乙有幾人？', ['8 人', '15 人', '18 人', '24 人'], 2, '甲 2 份是 12 人，1 份是 6 人，乙 3 份是 18 人。'),
    q(context, serialOffset + 4, '統計', 4, '一組資料 6、8、10、12 的平均數是多少？', ['8', '9', '10', '12'], 1, '總和 36，除以 4 得 9。'),
    q(context, serialOffset + 5, '百分率', 4, '12 是 48 的百分之幾？', ['20%', '25%', '30%', '40%'], 1, '12 ÷ 48 = 0.25，也就是 25%。'),
    q(context, serialOffset + 6, '代數', 4, final ? '若 x + 8 = 23，x 是多少？' : '若 3 × x = 27，x 是多少？', final ? ['12', '15', '18', '31'] : ['6', '8', '9', '12'], final ? 1 : 2, final ? '23 - 8 = 15。' : '27 ÷ 3 = 9。'),
  ];
}
