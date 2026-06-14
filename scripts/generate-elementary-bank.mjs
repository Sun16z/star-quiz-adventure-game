import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const root = process.cwd();
const targetPerCombo = 30;
const publishers = [
  { id: '康軒', code: 'kx' },
  { id: '翰林', code: 'hl' },
  { id: '南一', code: 'ny' },
];
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
const sourceReferences = [
  {
    title: '學習方舟：全國中小學題庫網',
    url: 'https://www.studyark.org/s/kangxuanguoxiao/',
    usedFor: '確認國小題庫站列有康軒、翰林、南一等版本與期中/期末篩選。',
  },
  {
    title: '米蘭老師教育資訊室：國中國小題庫考古題下載網站',
    url: 'https://melances.com/test-bank/',
    usedFor: '確認國小年級、版本、科目、上下學期與期中期末分類方式。',
  },
  {
    title: 'OneClass 各學校學制教科書版本查詢',
    url: 'https://version.oneclass.com.tw/',
    usedFor: '確認國小教材版本會依學校與學年度而不同，並含南一、翰林、康軒等版本。',
  },
];

const questions = [];

for (const publisher of publishers) {
  for (const grade of grades) {
    for (const semester of semesters) {
      for (const subject of subjects) {
        for (const exam of exams) {
          const context = {
            publisher: publisher.id,
            publisherCode: publisher.code,
            grade,
            semester: semester.id,
            semesterLabel: semester.label,
            subject,
            exam: exam.id,
            examLabel: exam.label,
          };
          const makers = {
            國語: mandarinQuestions,
            英語: englishQuestions,
            數學: mathQuestions,
          };
          questions.push(...ensureCount(context, makers[subject](context), targetPerCombo));
        }
      }
    }
  }
}

const dataset = {
  schemaVersion: 3,
  title: '台灣國小三出版社國英數題庫',
  description: '原創選擇題資料集，依康軒/翰林/南一、國小一到六年級、上下學期、國語/英語/數學、期中/期末分類，可供遊戲或練習系統重用。',
  publishers: publishers.map((publisher) => publisher.id),
  licenseNote: '題目為本專案原創題型，用於對應台灣國小常見段考範圍；未複製第三方考卷原文。',
  sourceReference: sourceReferences[1],
  sourceReferences,
  targetPerCombo,
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

const kangxuanDataset = {
  ...dataset,
  schemaVersion: 3,
  title: '台灣國小康軒版國英數題庫',
  description: '原創選擇題資料集，依康軒、國小一到六年級、上下學期、國語/英語/數學、期中/期末分類，可供遊戲或練習系統重用。',
  publisher: '康軒',
  publishers: ['康軒'],
  questions: questions.filter((question) => question.publisher === '康軒'),
};

writeJson('src/question-bank/elementary-publishers.json', dataset);
writeJson('public/question-bank/elementary-publishers.json', dataset);
writeJson('src/question-bank/elementary-kangxuan.json', kangxuanDataset);
writeJson('public/question-bank/elementary-kangxuan.json', kangxuanDataset);

function writeJson(path, value) {
  const output = resolve(root, path);
  mkdirSync(dirname(output), { recursive: true });
  writeFileSync(output, `${JSON.stringify(value, null, 2)}\n`);
}

function ensureCount(context, list, count) {
  if (list.length !== count) {
    throw new Error(`${context.publisher}-${context.grade}${context.semester}-${context.subject}-${context.exam} generated ${list.length}, expected ${count}`);
  }
  return list;
}

function baseMeta(context, serial, skill, difficulty, unit) {
  const gradeId = `grade${context.grade}${context.semester}`;
  return {
    id: `${context.publisherCode}-${gradeId}-${context.exam}-${subjectCode[context.subject]}-${String(serial).padStart(2, '0')}`,
    publisher: context.publisher,
    grade: gradeId,
    gradeNumber: context.grade,
    gradeLabel: `${context.grade}年級${context.semesterLabel}`,
    semester: context.semester,
    semesterLabel: context.semesterLabel,
    subject: context.subject,
    exam: context.exam,
    examLabel: context.examLabel,
    unit,
    skill,
    difficulty,
    source: {
      type: 'original',
      referenceUrl: sourceReferences[0].url,
    },
  };
}

function q(context, serial, skill, difficulty, unit, prompt, options, answerIndex, explanation) {
  if (options.length !== 4) throw new Error(`Question ${serial} has ${options.length} options`);
  return {
    ...baseMeta(context, serial, skill, difficulty, unit),
    prompt,
    options,
    answerIndex,
    explanation,
  };
}

function placeAnswer(correct, distractors, answerIndex) {
  const normalized = [];
  for (const item of distractors) {
    const value = String(item);
    if (value !== String(correct) && !normalized.includes(value)) normalized.push(value);
  }
  let fallback = 1;
  while (normalized.length < 3) {
    const value = `${correct}${fallback}`;
    if (!normalized.includes(value)) normalized.push(value);
    fallback += 1;
  }
  const options = normalized.slice(0, 3);
  options.splice(answerIndex, 0, String(correct));
  return options;
}

function numericOptions(correct, answerIndex, step = 1) {
  const base = Number(correct);
  const raw = [base - step, base + step, base + step * 2, base - step * 2, base + step * 3];
  return placeAnswer(String(correct), raw.filter((value) => value >= 0).map(String), answerIndex);
}

function serialAnswerIndex(context, serial) {
  const examShift = context.exam === 'final' ? 1 : 0;
  const semesterShift = context.semester === 'b' ? 2 : 0;
  return (serial + context.grade + examShift + semesterShift) % 4;
}

function unitLabel(context, order) {
  if (context.exam === 'midterm') return `第${(order % 3) + 1}單元`;
  return order % 2 === 0 ? '期末總複習' : `第${(order % 3) + 4}單元`;
}

function mandarinQuestions(context) {
  const lower = context.grade <= 2;
  const bank = lower ? lowerMandarinBank(context) : upperMandarinBank(context);
  return bank.map((item, index) => {
    const serial = index + 1;
    return q(context, serial, item.skill, item.difficulty, unitLabel(context, index), item.prompt, item.options, item.answerIndex, item.explanation);
  });
}

function lowerMandarinBank(context) {
  const final = context.exam === 'final';
  const semesterWord = context.semester === 'a' ? '校園' : '公園';
  return [
    m('字音字形', 1, `「${semesterWord}裡開了美麗的花。」哪一個詞是地方？`, ['校園', '美麗', '開了', '花'], 0, `${semesterWord}表示地點。`),
    m('量詞', 1, '下列哪一個量詞最適合：「一（　）鉛筆」？', ['枝', '朵', '台', '條'], 0, '鉛筆常用「枝」。'),
    m('詞意', 1, final ? '「整齊」的意思最接近哪一個？' : '「仔細」的意思最接近哪一個？', final ? ['排列有秩序', '跑得很快', '聲音很大', '亂七八糟'] : ['小心認真', '非常吵鬧', '馬上睡覺', '到處亂放'], 0, final ? '整齊表示有秩序。' : '仔細表示小心、認真。'),
    m('相反詞', 1, '「快樂」的相反詞是哪一個？', ['難過', '高興', '開心', '歡喜'], 0, '快樂的相反可以是難過。'),
    m('標點', 1, '「你要去哪裡」句尾最適合加什麼標點？', ['？', '，', '！', '、'], 0, '問句句尾用問號。'),
    m('句意理解', 1, '「妹妹先洗手，再吃點心。」哪一件事先發生？', ['洗手', '吃點心', '睡覺', '上學'], 0, '句子說先洗手，再吃點心。'),
    m('部首', 1, '「海」的部首最接近哪一個？', ['水（氵）', '木', '火', '口'], 0, '海和水有關，部首是三點水。'),
    m('詞語搭配', 1, '哪一個詞語最適合接在「打」後面？', ['掃', '甜', '藍', '昨天'], 0, '可以說「打掃」。'),
    m('閱讀理解', 2, '短文：「小安每天澆水，豆苗慢慢長高。」小安做了什麼？', ['澆水', '跑步', '買菜', '畫畫'], 0, '短文說小安每天澆水。'),
    m('造句理解', 1, '「哥哥一邊唱歌，一邊收玩具。」哥哥做了幾件事？', ['2 件', '1 件', '3 件', '4 件'], 0, '唱歌和收玩具是兩件事。'),
    m('量詞', 1, '下列哪一個量詞最適合：「一（　）小狗」？', ['隻', '本', '朵', '張'], 0, '小狗常用「隻」。'),
    m('標點', 1, '「哇　彩虹出現了」空格最適合加什麼標點？', ['！', '。', '、', '：'], 0, '表示驚喜可用驚嘆號。'),
    m('字義辨析', 1, '「明亮」最接近哪一個意思？', ['光線充足', '很吵鬧', '味道很甜', '動作很慢'], 0, '明亮表示光線充足。'),
    m('句序', 2, '哪一組句子順序最合理？', ['起床→刷牙→上學', '上學→睡覺→刷牙', '吃飯→種子→鉛筆', '跑步→月亮→書包'], 0, '早上通常先起床，再刷牙，最後上學。'),
    m('閱讀理解', 2, '短文：「小莉把地上的書撿起來，交給老師。」小莉的行為最接近哪一個？', ['負責任', '愛生氣', '很粗心', '想睡覺'], 0, '撿到書交給老師，是負責任的行為。'),
    m('注音字詞', 1, '「ㄆㄧㄥˊ果」正確的字是哪一個？', ['蘋', '平', '瓶', '評'], 0, '蘋果的蘋是草字頭。'),
    m('詞語分類', 1, '下列哪一個是動作？', ['跳', '紅色', '天空', '鉛筆'], 0, '跳表示動作。'),
    m('同義詞', 1, '「漂亮」的意思最接近哪一個？', ['美麗', '寒冷', '安靜', '生氣'], 0, '漂亮和美麗意思相近。'),
    m('句型', 2, '「因為下雨，所以我們撐傘。」這句的前後關係是什麼？', ['原因和結果', '顏色和形狀', '人物和名字', '數量和大小'], 0, '因為說原因，所以說結果。'),
    m('閱讀理解', 2, '短文：「下課時，小文排隊等著洗手。」小文做得怎麼樣？', ['守秩序', '很貪心', '不禮貌', '亂丟垃圾'], 0, '排隊等待是守秩序。'),
    m('部首', 1, '「林、樹、森」共同和哪一個部首有關？', ['木', '水', '火', '口'], 0, '這些字都和木有關。'),
    m('量詞', 1, '下列哪一個量詞最適合：「一（　）白雲」？', ['朵', '本', '枝', '台'], 0, '白雲常用「朵」。'),
    m('句意理解', 2, '「媽媽把水果洗乾淨後，放在盤子裡。」水果最後在哪裡？', ['盤子裡', '書包裡', '操場上', '鉛筆盒裡'], 0, '句子說放在盤子裡。'),
    m('詞語搭配', 1, '哪一個詞語最適合形容「天氣很熱」？', ['炎熱', '寒冷', '安靜', '整齊'], 0, '天氣很熱可以說炎熱。'),
    m('標點', 1, '「我喜歡蘋果、香蕉和草莓。」句中的「、」叫什麼？', ['頓號', '問號', '句號', '冒號'], 0, '並列詞語之間常用頓號。'),
    m('句子完整', 2, '哪一句語意最完整？', ['我今天到圖書館看書。', '因為所以圖書館。', '看書今天我。', '到的書很。'], 0, '完整句子要能清楚表達意思。'),
    m('閱讀理解', 2, '短文：「小朋友一起整理教室，桌椅排得很整齊。」大家做了什麼？', ['整理教室', '買玩具', '看電影', '摘水果'], 0, '短文說大家整理教室。'),
    m('字詞辨析', 1, '下列哪一個詞語用字正確？', ['打掃', '打稍', '打梢', '打搔'], 0, '打掃是正確寫法。'),
    m('語氣', 1, '「請你幫我開門，好嗎？」這句話的語氣最接近哪一個？', ['有禮貌的請求', '大聲責罵', '宣布比賽', '描述顏色'], 0, '使用「請」和「好嗎」表示有禮貌。'),
    m('閱讀理解', 2, final ? '短文：「阿宏做完功課後，檢查一次才交給老師。」阿宏做事怎麼樣？' : '短文：「小美看到同學哭了，遞給他面紙。」小美怎麼樣？', final ? ['仔細', '貪玩', '生氣', '害羞'] : ['體貼', '粗心', '吵鬧', '懶惰'], 0, final ? '做完再檢查，表示仔細。' : '關心同學是體貼的表現。'),
  ];
}

function upperMandarinBank(context) {
  const final = context.exam === 'final';
  const senior = context.grade >= 5;
  return [
    m('修辭', senior ? 3 : 2, '「樹葉在風中跳舞。」這句用了哪一種修辭？', ['擬人', '引用', '設問', '頂真'], 0, '樹葉不會真的跳舞，這是擬人。'),
    m('修辭', senior ? 3 : 2, '「操場像一片綠色海洋。」這句用了哪一種修辭？', ['譬喻', '排比', '反問', '摹聲'], 0, '把操場比成海洋，是譬喻。'),
    m('成語詞語', 2, '「半途而廢」最接近哪一個意思？', ['做到一半就放棄', '按時完成', '重新整理', '仔細觀察'], 0, '半途而廢表示事情沒完成就停止。'),
    m('成語詞語', 2, '「一舉兩得」最接近哪一個意思？', ['一次得到兩種好處', '做事很慢', '完全沒收穫', '只看表面'], 0, '一舉兩得表示一次行動得到兩種收穫。'),
    m('關聯詞', 2, '「（　）下雨，（　）運動會延期。」括號最適合填哪一組？', ['因為／所以', '不但／而且', '一邊／一邊', '越來／越'], 0, '前後是原因和結果。'),
    m('關聯詞', 3, '「他（　）每天練習，（　）進步很快。」括號最適合填哪一組？', ['因為／所以', '雖然／但是', '不但／而且', '如果／仍然'], 0, '每天練習是原因，進步很快是結果。'),
    m('閱讀理解', 3, '短文：「阿庭先訪問長輩，再整理照片，最後完成家鄉報告。」這段主要寫什麼？', ['完成報告的過程', '午餐菜色', '操場大小', '天氣變化'], 0, '短文依序寫完成報告的步驟。'),
    m('閱讀理解', 3, '短文：「比賽失敗後，佳芸記下問題，隔天繼續練習。」佳芸的態度最接近哪一個？', ['願意檢討改進', '立刻放棄', '故意拖延', '只想休息'], 0, '失敗後記下問題並練習，表示願意改進。'),
    m('寫作結構', 3, '作文結尾最適合放入哪一類內容？', ['收束主題與感想', '突然加入無關人物', '只列出零食', '重複題目十次'], 0, '結尾常用來總結主題並寫出感想。'),
    m('寫作結構', 3, '文章開頭最適合先交代什麼？', ['時間、地點或主題', '完整答案解析', '無關笑話', '購物清單'], 0, '開頭可先讓讀者知道情境或主題。'),
    m('字詞辨析', 2, '下列哪一個詞語用字正確？', ['分辨方向', '分辯方向', '辦別方向', '花瓣方向'], 0, '分辨表示區分、判斷。'),
    m('標點', 2, '「老師提醒我們：考試時要先看清楚題目。」冒號的作用是什麼？', ['引出後面的說明', '表示句子結束', '表示聲音拉長', '表示兩字相同'], 0, '冒號常用來引出說明。'),
    m('詞意', 2, '「絡繹不絕」表示什麼？', ['連續不斷', '完全沒有', '非常安靜', '只來一次'], 0, '絡繹不絕表示前後連續不中斷。'),
    m('句意理解', 2, '「弟弟把功課寫完以後，才去打球。」哪一件事先發生？', ['寫完功課', '去打球', '買球鞋', '整理球場'], 0, '句中說寫完功課以後才去打球。'),
    m('排比', 3, '哪一個句子有排比效果？', ['我們要勤讀書、常運動、懂禮貌。', '風吹過樹梢。', '他帶了一把傘。', '天空出現彩虹。'], 0, '三個結構相近的短語並列，有排比效果。'),
    m('句子完整', 2, '下列哪一句語意最完整、最通順？', ['因為下雨，所以比賽延期。', '因為下雨，比賽。', '所以延期因為下雨。', '比賽因為所以下雨延期。'], 0, '原因和結果都完整。'),
    m('標題判斷', 3, '短文：「阿芳先查資料，再和同學討論，最後完成海報。」最適合的標題是哪一個？', ['一張海報的完成', '雨天的操場', '好吃的早餐', '迷路的小狗'], 0, '短文重點是完成海報的過程。'),
    m('語意判斷', 2, '「他跑得像風一樣快。」這句是在強調什麼？', ['跑得很快', '跑得很慢', '風很安靜', '他沒有跑步'], 0, '像風一樣用來強調速度快。'),
    m('詞語搭配', 2, '哪一個詞語最適合接在「珍惜」後面？', ['時間', '聲音很藍', '昨天跑步', '如果桌子'], 0, '常說珍惜時間、珍惜資源。'),
    m('文章主旨', senior ? 4 : 3, '一篇文章反覆提到「合作讓任務更快完成」，主旨最可能是什麼？', ['合作的重要', '天氣的變化', '食物的種類', '玩具的價錢'], 0, '反覆出現的核心概念常是主旨。'),
    m('推論', senior ? 4 : 3, '短文：「校隊每天清晨練習，終於在比賽得到佳績。」可以推論哪一件事？', ['努力可能帶來成果', '比賽不需要準備', '清晨一定下雨', '校隊都討厭練習'], 0, '每天練習後得到佳績，可推論努力有成果。'),
    m('詞性', senior ? 3 : 2, '「勇敢的隊員走上舞台。」句中的「勇敢」主要用來形容什麼？', ['隊員', '舞台', '走上', '句號'], 0, '勇敢形容隊員。'),
    m('語病修正', senior ? 4 : 3, '哪一句比較通順？', ['我們參觀博物館，學到許多知識。', '我們參觀知識，博物館許多。', '博物館學到我們參觀。', '知識許多參觀我們。'], 0, '第一句語序自然且意思完整。'),
    m('說明文', senior ? 4 : 3, '說明文最重視哪一項？', ['清楚介紹事物或方法', '只寫幻想情節', '完全不用順序', '只列人物對話'], 0, '說明文重在清楚說明。'),
    m('記敘文', 3, '記敘一件校外教學，最需要交代哪一組？', ['時間、地點、經過', '價格、重量、顏色', '半徑、直徑、圓周', '字母、音標、拼字'], 0, '記敘文常交代時間、地點和事情經過。'),
    m('修辭', senior ? 4 : 3, '「教室裡安靜得連針掉下來都聽得到。」這句用了哪一種寫法？', ['誇飾', '引用', '頂真', '摹聲'], 0, '把安靜程度放大描寫，是誇飾。'),
    m('閱讀理解', senior ? 4 : 3, '短文：「志工先分類物資，再依需求送到各班。」這段主要呈現哪一種能力？', ['有條理地安排工作', '隨便分配工作', '只重視速度', '完全不合作'], 0, '先分類再配送，表示做事有條理。'),
    m('詞意', senior ? 3 : 2, '「鍥而不捨」最接近哪一個意思？', ['持續努力不放棄', '只看表面', '隨便應付', '半途停止'], 0, '鍥而不捨表示堅持努力。'),
    m('閱讀策略', senior ? 4 : 3, '閱讀長文章時，想快速掌握重點，最適合先做什麼？', ['看標題與段落重點', '只看最後一個字', '把書闔起來', '跳過所有標點'], 0, '標題和段落重點能幫助掌握大意。'),
    m('寫作取材', senior ? 4 : 3, final ? '寫「難忘的一天」時，哪一項最能讓內容具體？' : '寫「我的好朋友」時，哪一項最能讓人物鮮明？', final ? ['加入具體事件與感受', '只寫今天很好', '一直重複題目', '列出不相關數字'] : ['描寫行為與互動例子', '只寫他很好', '抄一段菜單', '只列數學算式'], 0, final ? '具體事件和感受能讓文章更完整。' : '透過例子可呈現人物特色。'),
  ];
}

function m(skill, difficulty, prompt, options, answerIndex, explanation) {
  return { skill, difficulty, prompt, options, answerIndex, explanation };
}

function englishQuestions(context) {
  const lower = context.grade <= 2;
  const bank = lower ? lowerEnglishBank(context) : upperEnglishBank(context);
  return bank.map((item, index) => q(context, index + 1, item.skill, item.difficulty, unitLabel(context, index), item.prompt, item.options, item.answerIndex, item.explanation));
}

function lowerEnglishBank(context) {
  const final = context.exam === 'final';
  return [
    e('字母與單字', 1, '「書」的英文是哪一個？', ['book', 'cat', 'red', 'desk'], 0, 'book 是書。'),
    e('字母與單字', 1, '「書包」的英文最接近哪一個？', ['bag', 'sun', 'fish', 'milk'], 0, 'bag 是包包、書包。'),
    e('顏色', 1, 'red 的中文意思是什麼？', ['紅色', '藍色', '黑色', '白色'], 0, 'red 是紅色。'),
    e('顏色', 1, 'blue 的中文意思是什麼？', ['藍色', '紅色', '黃色', '綠色'], 0, 'blue 是藍色。'),
    e('日常用語', 1, '「早安。」可以怎麼說？', ['Good morning.', 'Goodbye.', 'I like rice.', 'Open it.'], 0, 'Good morning. 是早安。'),
    e('日常用語', 1, '「謝謝你。」可以怎麼說？', ['Thank you.', 'Good night.', 'Stand up.', 'I am ten.'], 0, 'Thank you. 是謝謝你。'),
    e('數字', 1, 'three 表示哪一個數字？', ['3', '1', '2', '10'], 0, 'three 是 3。'),
    e('數字', 1, 'five 表示哪一個數字？', ['5', '2', '7', '9'], 0, 'five 是 5。'),
    e('自然拼讀', 1, 'cat 的第一個字母是？', ['C', 'A', 'T', 'G'], 0, 'cat 的第一個字母是 C。'),
    e('自然拼讀', 1, 'dog 的第一個字母是？', ['D', 'O', 'G', 'B'], 0, 'dog 的第一個字母是 D。'),
    e('句型理解', 1, 'A: How are you? B: I am fine. B 的意思最接近哪一個？', ['我很好', '我是鉛筆', '我在跑步', '我七歲'], 0, 'I am fine. 表示我很好。'),
    e('句型理解', 1, 'A: What is this? B: It is a pencil. B 在說這是什麼？', ['鉛筆', '橡皮擦', '蘋果', '狗'], 0, 'pencil 是鉛筆。'),
    e('動物單字', 1, '「貓」的英文是哪一個？', ['cat', 'dog', 'fish', 'bird'], 0, 'cat 是貓。'),
    e('動物單字', 1, '「狗」的英文是哪一個？', ['dog', 'book', 'apple', 'red'], 0, 'dog 是狗。'),
    e('食物單字', 1, 'apple 的中文意思是什麼？', ['蘋果', '香蕉', '牛奶', '麵包'], 0, 'apple 是蘋果。'),
    e('食物單字', 1, 'milk 的中文意思是什麼？', ['牛奶', '果汁', '米飯', '雞蛋'], 0, 'milk 是牛奶。'),
    e('教室用語', 1, 'Sit down. 的意思最接近哪一個？', ['坐下', '打開書', '謝謝你', '再見'], 0, 'Sit down. 是坐下。'),
    e('教室用語', 1, 'Stand up. 的意思最接近哪一個？', ['站起來', '晚安', '我喜歡', '這是紅色'], 0, 'Stand up. 是站起來。'),
    e('問候語', 1, 'Goodbye. 的中文意思是什麼？', ['再見', '早安', '謝謝', '請坐'], 0, 'Goodbye. 是再見。'),
    e('問候語', 1, 'Good night. 的中文意思是什麼？', ['晚安', '早安', '你好', '對不起'], 0, 'Good night. 是晚安。'),
    e('句型', 1, 'I am Sam. 的意思最接近哪一個？', ['我是 Sam。', '我喜歡 Sam。', '這是 Sam。', 'Sam 在跑步。'], 0, 'I am ... 表示我是。'),
    e('句型', 1, 'This is a ruler. 這句在介紹什麼？', ['尺', '書', '貓', '水'], 0, 'ruler 是尺。'),
    e('顏色', 1, 'green 的中文意思是什麼？', ['綠色', '黃色', '紫色', '白色'], 0, 'green 是綠色。'),
    e('顏色', 1, 'yellow 的中文意思是什麼？', ['黃色', '黑色', '紅色', '藍色'], 0, 'yellow 是黃色。'),
    e('數字', 1, 'ten 表示哪一個數字？', ['10', '2', '6', '8'], 0, 'ten 是 10。'),
    e('數字', 1, 'seven 表示哪一個數字？', ['7', '3', '5', '9'], 0, 'seven 是 7。'),
    e('身體部位', 1, 'eye 的中文意思是什麼？', ['眼睛', '耳朵', '手', '腳'], 0, 'eye 是眼睛。'),
    e('身體部位', 1, 'hand 的中文意思是什麼？', ['手', '鼻子', '頭', '膝蓋'], 0, 'hand 是手。'),
    e('句型理解', 1, final ? 'I like bananas. 這句表示我喜歡什麼？' : 'I see a bird. 這句表示我看見什麼？', final ? ['香蕉', '蘋果', '書', '狗'] : ['鳥', '魚', '球', '雨傘'], 0, final ? 'bananas 是香蕉。' : 'bird 是鳥。'),
    e('語意搭配', 1, context.semester === 'a' ? 'Which word is a color?' : 'Which word is an animal?', context.semester === 'a' ? ['white', 'pencil', 'desk', 'milk'] : ['fish', 'book', 'green', 'seven'], 0, context.semester === 'a' ? 'white 是顏色。' : 'fish 是動物。'),
  ];
}

function upperEnglishBank(context) {
  const senior = context.grade >= 5;
  return [
    e('句型', 2, 'Which sentence is correct?', ['She likes apples.', 'She like apples.', 'She are apples.', 'She liking apples.'], 0, 'She 搭配 likes。'),
    e('能力句型', 2, '「我會游泳。」英文最接近哪一句？', ['I can swim.', 'I am swim.', 'I swim can.', 'I swimming can.'], 0, 'can 後面接原形動詞 swim。'),
    e('疑問句', 2, '「現在幾點？」英文最接近哪一句？', ['What time is it?', 'Where are you?', 'How many books?', 'What color is it?'], 0, 'What time is it? 用來詢問時間。'),
    e('疑問句', 3, '「你住在哪裡？」英文最接近哪一句？', ['Where do you live?', 'What time is it?', 'How old are you?', 'Do you like rice?'], 0, 'Where do you live? 用來詢問住在哪裡。'),
    e('閱讀理解', 2, 'Read: Amy likes bananas, but she does not like milk. What does Amy like?', ['Bananas.', 'Milk.', 'Water.', 'Rice.'], 0, '句子說 Amy likes bananas。'),
    e('閱讀理解', 2, 'Read: Ben has math on Tuesday. When does Ben have math?', ['On Tuesday.', 'On Sunday.', 'At home.', 'In the park.'], 0, '句子說 Ben has math on Tuesday。'),
    e('單字', 2, '「圖書館」的英文是哪一個？', ['library', 'kitchen', 'bathroom', 'market'], 0, 'library 是圖書館。'),
    e('單字', 2, '「廚房」的英文是哪一個？', ['kitchen', 'library', 'hospital', 'station'], 0, 'kitchen 是廚房。'),
    e('文法', senior ? 4 : 3, '「我昨天打籃球。」英文最接近哪一句？', ['I played basketball yesterday.', 'I play basketball tomorrow.', 'I am basketball.', 'I can yesterday.'], 0, 'yesterday 表示昨天，play 變 played。'),
    e('問答', 2, 'A: Do you like oranges? B: Yes, I do. B 的意思是什麼？', ['是的，我喜歡。', '不，我不喜歡。', '我在學校。', '它是橘色。'], 0, 'Yes, I do. 是肯定回答。'),
    e('語意搭配', 2, 'Which word is about food?', ['sandwich', 'bedroom', 'pencil', 'train'], 0, 'sandwich 是食物。'),
    e('語意搭配', 2, 'Which word is about weather?', ['rainy', 'library', 'marker', 'uncle'], 0, 'rainy 是天氣相關單字。'),
    e('介系詞', senior ? 3 : 2, 'I have English ___ Monday. 哪一個最適合？', ['on', 'in', 'at', 'under'], 0, '星期幾前常用 on。'),
    e('現在進行式', senior ? 3 : 2, 'Look! The boys ___ soccer.', ['are playing', 'is play', 'plays', 'played'], 0, 'The boys 是複數，現在進行式用 are playing。'),
    e('單複數', 2, 'There are three ___ on the desk.', ['books', 'book', 'bookes', 'booking'], 0, 'three 後面接複數 books。'),
    e('be 動詞', 2, 'My brother ___ tall.', ['is', 'are', 'am', 'be'], 0, 'My brother 是單數，用 is。'),
    e('閱讀理解', senior ? 3 : 2, 'Read: Tina goes to school by bus. How does Tina go to school?', ['By bus.', 'By bike.', 'On foot.', 'By train.'], 0, '句子說 by bus。'),
    e('閱讀理解', senior ? 3 : 2, 'Read: The bakery is next to the bank. Where is the bakery?', ['Next to the bank.', 'Behind the park.', 'In the school.', 'Under the table.'], 0, '句子說 next to the bank。'),
    e('時間', 2, 'It is seven thirty. 中文意思最接近哪一個？', ['七點半', '七點整', '三點七分', '十二點七分'], 0, 'seven thirty 是七點半。'),
    e('頻率副詞', senior ? 4 : 3, 'I ___ brush my teeth before bed. 哪一個最適合表示「總是」？', ['always', 'never', 'behind', 'yellow'], 0, 'always 表示總是。'),
    e('比較級', senior ? 4 : 3, 'This box is ___ than that one.', ['heavier', 'heavy', 'heaviest', 'heavily'], 0, 'than 前常用比較級 heavier。'),
    e('未來式', senior ? 4 : 3, 'We ___ visit the museum tomorrow.', ['will', 'did', 'are yesterday', 'has'], 0, 'tomorrow 可搭配 will 表示未來。'),
    e('疑問詞', 2, '___ is your birthday? It is in May.', ['When', 'Where', 'Who', 'What color'], 0, '詢問時間用 When。'),
    e('疑問詞', 2, '___ are you going? I am going to the park.', ['Where', 'How many', 'What time', 'Who'], 0, '詢問地點用 Where。'),
    e('助動詞', senior ? 3 : 2, '___ you help me? Yes, I can.', ['Can', 'Are', 'Does', 'Was'], 0, '回答 Yes, I can. 時，問句可用 Can。'),
    e('過去式', senior ? 4 : 3, 'Yesterday, Dad ___ dinner.', ['cooked', 'cook', 'cooks', 'cooking'], 0, 'Yesterday 表示過去，cook 變 cooked。'),
    e('閱讀推論', senior ? 4 : 3, 'Read: Leo put on a coat because it was cold. Why did Leo put on a coat?', ['It was cold.', 'It was hot.', 'He liked apples.', 'He was in a library.'], 0, 'because 後面說原因是天氣冷。'),
    e('序數', senior ? 3 : 2, 'The first month of a year is ___.', ['January', 'May', 'Sunday', 'winter'], 0, '一年第一個月是 January。'),
    e('連接詞', senior ? 4 : 3, 'I was tired, ___ I finished my homework.', ['but', 'under', 'next', 'very'], 0, '前後有轉折，可以用 but。'),
    e('綜合文法', senior ? 4 : 3, context.exam === 'final' ? 'Which sentence talks about the future?' : 'Which sentence talks about the past?', context.exam === 'final' ? ['I will go hiking tomorrow.', 'I went hiking yesterday.', 'I am hiking now.', 'I hike every day.'] : ['I visited my grandma yesterday.', 'I will visit tomorrow.', 'I am visiting now.', 'I visit every week.'], 0, context.exam === 'final' ? 'will 和 tomorrow 表示未來。' : 'visited 和 yesterday 表示過去。'),
  ];
}

function e(skill, difficulty, prompt, options, answerIndex, explanation) {
  return { skill, difficulty, prompt, options, answerIndex, explanation };
}

function mathQuestions(context) {
  const makers = {
    1: mathGrade1,
    2: mathGrade2,
    3: mathGrade3,
    4: mathGrade4,
    5: mathGrade5,
    6: mathGrade6,
  };
  return makers[context.grade](context).map((item, index) => q(context, index + 1, item.skill, item.difficulty, unitLabel(context, index), item.prompt, item.options, item.answerIndex, item.explanation));
}

function mathGrade1(context) {
  const items = [];
  for (let i = 0; i < 8; i++) {
    const serial = i + 1;
    const a = 5 + context.grade + i + (context.semester === 'b' ? 2 : 0);
    const b = 2 + ((i + (context.exam === 'final' ? 2 : 0)) % 6);
    const answerIndex = serialAnswerIndex(context, serial);
    items.push(mathItem('加減法', 1, `${a} + ${b} = ?`, numericOptions(a + b, answerIndex), answerIndex, `${a} + ${b} = ${a + b}。`));
  }
  for (let i = 0; i < 7; i++) {
    const serial = i + 9;
    const a = 18 + i + (context.semester === 'b' ? 3 : 0);
    const b = 4 + (i % 5);
    const answerIndex = serialAnswerIndex(context, serial);
    items.push(mathItem('加減法', 1, `${a} - ${b} = ?`, numericOptions(a - b, answerIndex), answerIndex, `${a} - ${b} = ${a - b}。`));
  }
  items.push(...[
    placeMath(context, 16, '位值', 1, '十位是 3、個位是 6 的數是多少？', '36', ['63', '30', '6']),
    placeMath(context, 17, '位值', 1, '十位是 4、個位是 2 的數是多少？', '42', ['24', '40', '2']),
    placeMath(context, 18, '比較大小', 1, '下列哪一個數最大？', '35', ['28', '19', '31']),
    placeMath(context, 19, '比較大小', 1, '下列哪一個數最小？', '19', ['28', '35', '31']),
    placeMath(context, 20, '時間', 1, '鐘面長針指向 12、短針指向 4，表示幾點？', '4 點', ['3 點', '6 點', '12 點']),
    placeMath(context, 21, '時間', 1, '鐘面長針指向 12、短針指向 7，表示幾點？', '7 點', ['6 點', '12 點', '5 點']),
    placeMath(context, 22, '幾何', 1, '哪一個圖形有 3 條邊？', '三角形', ['正方形', '圓形', '長方形']),
    placeMath(context, 23, '幾何', 1, '哪一個圖形沒有角？', '圓形', ['三角形', '正方形', '長方形']),
    placeMath(context, 24, '應用題', 1, '小明有 9 張貼紙，又得到 4 張，共有幾張？', '13 張', ['11 張', '12 張', '14 張']),
    placeMath(context, 25, '應用題', 1, '桌上有 12 顆糖，吃掉 5 顆，還剩幾顆？', '7 顆', ['5 顆', '6 顆', '8 顆']),
    placeMath(context, 26, '序數', 1, '排隊時，小玉前面有 2 人，小玉是第幾個？', '第 3 個', ['第 1 個', '第 2 個', '第 4 個']),
    placeMath(context, 27, '分類', 1, '下列哪一組都是偶數？', '2、4、6', ['1、3、5', '2、3、4', '5、6、7']),
    placeMath(context, 28, '長度', 1, '哪一個物品最適合用公分量長度？', '鉛筆', ['操場一圈', '城市距離', '一桶水']),
    placeMath(context, 29, '錢幣', 1, '10 元加 5 元共有多少元？', '15 元', ['10 元', '12 元', '20 元']),
    placeMath(context, 30, '資料整理', 1, '投票結果：蘋果 6 票、香蕉 4 票、葡萄 8 票。最多人選哪一個？', '葡萄', ['蘋果', '香蕉', '一樣多']),
  ]);
  return items;
}

function mathGrade2(context) {
  const items = [];
  for (let i = 0; i < 10; i++) {
    const serial = i + 1;
    const a = 3 + (i % 6);
    const b = 2 + ((i + context.grade) % 7);
    const answerIndex = serialAnswerIndex(context, serial);
    items.push(mathItem('乘法', 1, `${a} × ${b} = ?`, numericOptions(a * b, answerIndex, b), answerIndex, `${a} × ${b} = ${a * b}。`));
  }
  for (let i = 0; i < 6; i++) {
    const serial = i + 11;
    const divisor = 2 + (i % 4);
    const quotient = 4 + i;
    const total = divisor * quotient;
    const answerIndex = serialAnswerIndex(context, serial);
    items.push(mathItem('除法', 1, `${total} ÷ ${divisor} = ?`, numericOptions(quotient, answerIndex), answerIndex, `${total} 平均分成 ${divisor} 份，每份是 ${quotient}。`));
  }
  items.push(...[
    placeMath(context, 17, '乘法應用', 1, '一枝筆 8 元，買 5 枝要多少元？', '40 元', ['13 元', '32 元', '58 元']),
    placeMath(context, 18, '長度', 2, '2 公尺 15 公分等於幾公分？', '215 公分', ['2015 公分', '217 公分', '115 公分']),
    placeMath(context, 19, '長度', 2, '3 公尺 20 公分等於幾公分？', '320 公分', ['3020 公分', '323 公分', '120 公分']),
    placeMath(context, 20, '時間', 2, '8:40 再過 20 分鐘是幾點？', '9:00', ['8:50', '9:20', '10:00']),
    placeMath(context, 21, '時間', 2, '9:45 再過 15 分鐘是幾點？', '10:00', ['9:50', '10:15', '11:00']),
    placeMath(context, 22, '平分', 1, '24 顆糖果，每袋裝 3 顆，可以裝成幾袋？', '8 袋', ['6 袋', '7 袋', '9 袋']),
    placeMath(context, 23, '錢幣', 2, '一本筆記本 18 元，買 2 本要多少元？', '36 元', ['20 元', '30 元', '38 元']),
    placeMath(context, 24, '位值', 2, '508 的十位數字是多少？', '0', ['5', '8', '50']),
    placeMath(context, 25, '三位數加減', 2, '236 + 125 = ?', '361', ['351', '362', '461']),
    placeMath(context, 26, '三位數加減', 2, '420 - 185 = ?', '235', ['225', '245', '305']),
    placeMath(context, 27, '圖形', 1, '長方形有幾個角？', '4 個', ['3 個', '5 個', '6 個']),
    placeMath(context, 28, '圖形', 1, '正方形四邊的長度有什麼關係？', '一樣長', ['都不一樣', '只有兩邊一樣', '沒有邊']),
    placeMath(context, 29, '資料整理', 2, '小組得到星星數：3、5、4、5。最多的是幾顆？', '5 顆', ['3 顆', '4 顆', '6 顆']),
    placeMath(context, 30, '應用題', 2, '有 6 盒餅乾，每盒 4 片，共有幾片？', '24 片', ['10 片', '20 片', '28 片']),
  ]);
  return items;
}

function mathGrade3(context) {
  const items = [];
  for (let i = 0; i < 8; i++) {
    const serial = i + 1;
    const a = 112 + i * 13 + (context.semester === 'b' ? 20 : 0);
    const b = 3 + (i % 4);
    const answerIndex = serialAnswerIndex(context, serial);
    items.push(mathItem('整數乘法', 2, `${a} × ${b} = ?`, numericOptions(a * b, answerIndex, b * 10), answerIndex, `把 ${a} 乘以 ${b}，答案是 ${a * b}。`));
  }
  for (let i = 0; i < 6; i++) {
    const serial = i + 9;
    const divisor = 4 + (i % 5);
    const quotient = 12 + i;
    const total = divisor * quotient;
    const answerIndex = serialAnswerIndex(context, serial);
    items.push(mathItem('整數除法', 2, `${total} ÷ ${divisor} = ?`, numericOptions(quotient, answerIndex), answerIndex, `${total} ÷ ${divisor} = ${quotient}。`));
  }
  items.push(...[
    placeMath(context, 15, '分數', 2, '1/5 + 2/5 = ?', '3/5', ['3/10', '2/10', '1/2']),
    placeMath(context, 16, '分數', 2, '2/7 + 3/7 = ?', '5/7', ['5/14', '6/7', '1/7']),
    placeMath(context, 17, '周長', 2, '長方形長 8 公分、寬 5 公分，周長是多少？', '26 公分', ['13 公分', '40 公分', '80 公分']),
    placeMath(context, 18, '周長', 2, '正方形邊長 6 公分，周長是多少？', '24 公分', ['12 公分', '18 公分', '36 公分']),
    placeMath(context, 19, '小數', 2, '0.6 和 0.45 哪一個比較大？', '0.6', ['0.45', '一樣大', '無法比較']),
    placeMath(context, 20, '小數', 2, '0.8 和 0.75 哪一個比較大？', '0.8', ['0.75', '一樣大', '無法比較']),
    placeMath(context, 21, '容量', 2, '1 公升 200 毫升等於幾毫升？', '1200 毫升', ['102 毫升', '1002 毫升', '2200 毫升']),
    placeMath(context, 22, '重量', 2, '2 公斤 300 公克等於幾公克？', '2300 公克', ['203 公克', '3200 公克', '2003 公克']),
    placeMath(context, 23, '時間', 2, '下午 2:20 再過 45 分鐘是幾點？', '下午 3:05', ['下午 2:55', '下午 3:15', '下午 4:05']),
    placeMath(context, 24, '角度', 2, '直角是多少度？', '90 度', ['45 度', '100 度', '180 度']),
    placeMath(context, 25, '圖形', 2, '平行四邊形的對邊有什麼關係？', '互相平行且等長', ['都垂直', '沒有邊', '只有一邊']),
    placeMath(context, 26, '應用題', 2, '每盒有 12 顆球，7 盒共有幾顆？', '84 顆', ['72 顆', '80 顆', '90 顆']),
    placeMath(context, 27, '應用題', 2, '96 張紙平均分給 8 組，每組幾張？', '12 張', ['10 張', '14 張', '16 張']),
    placeMath(context, 28, '資料整理', 2, '資料 6、8、8、10 中，出現最多的是哪個數？', '8', ['6', '10', '32']),
    placeMath(context, 29, '估算', 2, '198 + 305 大約接近哪一個數？', '500', ['300', '400', '700']),
    placeMath(context, 30, '分數比較', 2, '同樣大小的披薩，1/3 和 1/4 哪一個比較大？', '1/3', ['1/4', '一樣大', '不能比較']),
  ]);
  return items;
}

function mathGrade4(context) {
  return [
    ...decimalAddItems(context, 1, 6),
    ...fractionItems(context, 7),
    placeMath(context, 13, '角度', 2, '一個角小於 90 度，稱為什麼角？', '銳角', ['直角', '鈍角', '平角']),
    placeMath(context, 14, '角度', 2, '一個角大於 90 度、小於 180 度，稱為什麼角？', '鈍角', ['銳角', '直角', '平角']),
    placeMath(context, 15, '面積', 3, '長方形長 9 公分、寬 6 公分，面積是多少？', '54 平方公分', ['15 平方公分', '30 平方公分', '60 平方公分']),
    placeMath(context, 16, '面積', 3, '正方形邊長 8 公分，面積是多少？', '64 平方公分', ['16 平方公分', '32 平方公分', '56 平方公分']),
    placeMath(context, 17, '幾何', 3, '三角形三個內角合起來是多少？', '180 度', ['90 度', '270 度', '360 度']),
    placeMath(context, 18, '概數', 3, '348 四捨五入到十位約是多少？', '350', ['300', '340', '400']),
    placeMath(context, 19, '概數', 3, '4968 四捨五入到千位約是多少？', '5000', ['4000', '4900', '4960']),
    placeMath(context, 20, '除法', 3, '248 ÷ 4 = ?', '62', ['52', '60', '72']),
    placeMath(context, 21, '乘法', 3, '36 × 24 = ?', '864', ['724', '846', '900']),
    placeMath(context, 22, '小數', 3, '5.2 - 1.75 = ?', '3.45', ['3.35', '4.45', '6.95']),
    placeMath(context, 23, '單位換算', 3, '3 公里 250 公尺等於幾公尺？', '3250 公尺', ['3025 公尺', '3500 公尺', '3205 公尺']),
    placeMath(context, 24, '統計', 3, '資料 4、6、8、10 的平均數是多少？', '7', ['6', '8', '28']),
    placeMath(context, 25, '應用題', 3, '一張票 125 元，買 6 張要多少元？', '750 元', ['625 元', '700 元', '800 元']),
    placeMath(context, 26, '應用題', 3, '一桶水 18 公升，平均倒入 6 個水壺，每個幾公升？', '3 公升', ['2 公升', '4 公升', '6 公升']),
    placeMath(context, 27, '垂直平行', 3, '兩條直線相交成 90 度，稱為什麼？', '互相垂直', ['互相平行', '互相重疊', '沒有關係']),
    placeMath(context, 28, '小數比較', 3, '3.08、3.8、3.18 中最大的是哪一個？', '3.8', ['3.08', '3.18', '一樣大']),
    placeMath(context, 29, '分數比較', 3, '同分母分數 5/9 和 7/9 哪一個比較大？', '7/9', ['5/9', '一樣大', '不能比較']),
    placeMath(context, 30, '整數四則', 3, '先算乘除：6 + 4 × 3 = ?', '18', ['30', '24', '15']),
  ];
}

function mathGrade5(context) {
  return [
    placeMath(context, 1, '因數倍數', 3, '18 和 24 的最大公因數是多少？', '6', ['3', '4', '12']),
    placeMath(context, 2, '因數倍數', 3, '12 和 18 的最小公倍數是多少？', '36', ['24', '30', '72']),
    placeMath(context, 3, '異分母分數', 3, '3/4 + 1/8 = ?', '7/8', ['4/12', '5/8', '1']),
    placeMath(context, 4, '異分母分數', 3, '5/6 - 1/3 = ?', '1/2', ['4/3', '4/6', '2/9']),
    placeMath(context, 5, '小數乘除', 3, '0.6 × 0.5 = ?', '0.3', ['0.03', '1.1', '3']),
    placeMath(context, 6, '小數乘除', 3, '1.2 ÷ 0.3 = ?', '4', ['0.4', '40', '1.5']),
    placeMath(context, 7, '體積', 3, '長方體長 5、寬 4、高 3，體積是多少？', '60', ['12', '20', '120']),
    placeMath(context, 8, '百分率', 3, '一件外套原價 800 元，打 9 折後是多少元？', '720 元', ['760 元', '790 元', '900 元']),
    placeMath(context, 9, '百分率', 3, '250 元商品打 8 折後是多少元？', '200 元', ['180 元', '220 元', '240 元']),
    placeMath(context, 10, '速率', 4, '汽車 2 小時行駛 120 公里，平均每小時幾公里？', '60', ['40', '80', '240']),
    placeMath(context, 11, '速率', 4, '走 15 公里花 3 小時，平均每小時走幾公里？', '5', ['3', '12', '45']),
    placeMath(context, 12, '分數乘法', 3, '2/3 × 6 = ?', '4', ['2', '3', '6']),
    placeMath(context, 13, '分數除法', 4, '3 ÷ 1/2 = ?', '6', ['1.5', '3.5', '5']),
    placeMath(context, 14, '面積', 3, '三角形底 10 公分、高 6 公分，面積是多少？', '30 平方公分', ['16 平方公分', '60 平方公分', '36 平方公分']),
    placeMath(context, 15, '面積', 3, '平行四邊形底 12 公分、高 5 公分，面積是多少？', '60 平方公分', ['17 平方公分', '30 平方公分', '120 平方公分']),
    placeMath(context, 16, '容積', 4, '長方體容器長 4、寬 3、高 5，容積是多少立方單位？', '60', ['12', '20', '45']),
    placeMath(context, 17, '比率', 4, '全班 40 人，有 10 人參加合唱團，比例是多少？', '1/4', ['1/2', '1/3', '1/5']),
    placeMath(context, 18, '百分率', 4, '12 是 60 的百分之幾？', '20%', ['12%', '25%', '50%']),
    placeMath(context, 19, '平均', 3, '資料 70、80、90 的平均是多少？', '80', ['70', '85', '240']),
    placeMath(context, 20, '折線圖', 3, '折線圖最適合觀察哪一種資料？', '隨時間變化的趨勢', ['物品形狀', '字詞部首', '單字拼法']),
    placeMath(context, 21, '應用題', 4, '每公尺布 120 元，買 2.5 公尺要多少元？', '300 元', ['240 元', '280 元', '350 元']),
    placeMath(context, 22, '應用題', 4, '一箱蘋果 18 公斤，賣掉 2/3，賣掉幾公斤？', '12 公斤', ['6 公斤', '9 公斤', '15 公斤']),
    placeMath(context, 23, '最大公因數', 3, '36 和 48 的最大公因數是多少？', '12', ['6', '8', '16']),
    placeMath(context, 24, '最小公倍數', 3, '6 和 8 的最小公倍數是多少？', '24', ['12', '18', '48']),
    placeMath(context, 25, '小數比較', 3, '0.507、0.57、0.5 中最大的是哪一個？', '0.57', ['0.507', '0.5', '一樣大']),
    placeMath(context, 26, '四則運算', 3, '36 ÷ 4 + 7 × 2 = ?', '23', ['18', '27', '32']),
    placeMath(context, 27, '未知數', 4, '若 x + 15 = 42，x 是多少？', '27', ['25', '28', '57']),
    placeMath(context, 28, '比例', 4, '甲乙比是 2：5，總共 21 份量時，甲是多少？', '6', ['3', '9', '15']),
    placeMath(context, 29, '單位換算', 3, '2.5 公升等於幾毫升？', '2500 毫升', ['250 毫升', '2050 毫升', '5000 毫升']),
    placeMath(context, 30, '體積', 4, '正方體邊長 4，體積是多少？', '64', ['16', '48', '80']),
  ];
}

function mathGrade6(context) {
  return [
    placeMath(context, 1, '速率', 4, '一段路 120 公里，花 2 小時走完，平均速率是多少？', '60 公里/時', ['40 公里/時', '80 公里/時', '240 公里/時']),
    placeMath(context, 2, '圓', 4, '圓周率用 3.14 計算，直徑 10 公分的圓周長約是多少？', '31.4 公分', ['15.7 公分', '62.8 公分', '100 公分']),
    placeMath(context, 3, '圓', 4, '半徑 5 公分的圓，直徑是多少？', '10 公分', ['5 公分', '15 公分', '25 公分']),
    placeMath(context, 4, '比與比值', 4, '甲乙人數比是 2：3，若甲有 12 人，乙有幾人？', '18 人', ['8 人', '15 人', '24 人']),
    placeMath(context, 5, '統計', 4, '一組資料 6、8、10、12 的平均數是多少？', '9', ['8', '10', '12']),
    placeMath(context, 6, '百分率', 4, '12 是 48 的百分之幾？', '25%', ['20%', '30%', '40%']),
    placeMath(context, 7, '代數', 4, '若 3 × x = 27，x 是多少？', '9', ['6', '8', '12']),
    placeMath(context, 8, '代數', 4, '若 x + 8 = 23，x 是多少？', '15', ['12', '18', '31']),
    placeMath(context, 9, '圓面積', 4, '圓半徑 3 公分，圓面積約是多少？', '28.26 平方公分', ['18.84 平方公分', '9.42 平方公分', '56.52 平方公分']),
    placeMath(context, 10, '扇形', 4, '圓心角 90 度的扇形是整個圓的幾分之幾？', '1/4', ['1/2', '1/3', '1/8']),
    placeMath(context, 11, '比例尺', 4, '地圖比例尺 1:1000，圖上 3 公分代表實際幾公分？', '3000 公分', ['300 公分', '1003 公分', '30000 公分']),
    placeMath(context, 12, '正比', 4, '買 2 本書 160 元，買 5 本同樣的書要多少元？', '400 元', ['320 元', '360 元', '500 元']),
    placeMath(context, 13, '反比', 5, '同一工作，工人越多，完成時間通常會怎樣？', '變短', ['變長', '不可能變', '變成重量']),
    placeMath(context, 14, '柱體體積', 4, '底面積 20、高 6 的柱體，體積是多少？', '120', ['26', '60', '240']),
    placeMath(context, 15, '表面積', 5, '正方體邊長 3，表面積是多少？', '54', ['9', '27', '36']),
    placeMath(context, 16, '機率', 4, '袋中有 3 顆紅球、1 顆藍球，抽到紅球的機率是多少？', '3/4', ['1/4', '1/3', '4/3']),
    placeMath(context, 17, '百分率', 4, '原價 500 元，漲價 10% 後是多少？', '550 元', ['510 元', '450 元', '600 元']),
    placeMath(context, 18, '百分率', 4, '一件商品 600 元，降價 15% 後是多少？', '510 元', ['450 元', '515 元', '585 元']),
    placeMath(context, 19, '速度換算', 5, '每分鐘 80 公尺，5 分鐘走幾公尺？', '400 公尺', ['85 公尺', '160 公尺', '800 公尺']),
    placeMath(context, 20, '流水問題', 5, '水龍頭每分鐘流 6 公升，8 分鐘可流多少公升？', '48 公升', ['14 公升', '42 公升', '56 公升']),
    placeMath(context, 21, '等量公理', 4, '若 x - 7 = 18，x 是多少？', '25', ['11', '24', '26']),
    placeMath(context, 22, '等量公理', 4, '若 2x + 4 = 20，x 是多少？', '8', ['6', '10', '12']),
    placeMath(context, 23, '比值', 4, '4：10 的比值可化簡為？', '2：5', ['1：5', '4：5', '5：2']),
    placeMath(context, 24, '基準量', 5, '某數的 25% 是 30，某數是多少？', '120', ['60', '90', '150']),
    placeMath(context, 25, '資料判讀', 4, '一組資料中，最常出現的數稱為什麼？', '眾數', ['平均數', '中位數', '最大值']),
    placeMath(context, 26, '資料判讀', 4, '資料 3、5、7、9、11 的中位數是多少？', '7', ['5', '8', '9']),
    placeMath(context, 27, '圓周長', 4, '半徑 4 公分的圓，周長約是多少？', '25.12 公分', ['12.56 公分', '50.24 公分', '16 公分']),
    placeMath(context, 28, '應用題', 5, '甲速率 60 公里/時，行駛 2.5 小時，距離是多少？', '150 公里', ['120 公里', '180 公里', '240 公里']),
    placeMath(context, 29, '分數百分率', 4, '3/5 化成百分率是多少？', '60%', ['30%', '50%', '80%']),
    placeMath(context, 30, '綜合四則', 4, '48 ÷ (6 + 2) × 3 = ?', '18', ['2', '12', '24']),
  ];
}

function decimalAddItems(context, startSerial, count) {
  const items = [];
  for (let i = 0; i < count; i++) {
    const serial = startSerial + i;
    const a = 2.4 + i * 0.3 + (context.semester === 'b' ? 0.5 : 0);
    const b = 1.25 + (i % 3) * 0.2;
    const correct = Number((a + b).toFixed(2));
    const answerIndex = serialAnswerIndex(context, serial);
    items.push(mathItem('小數', 3, `${a.toFixed(1)} + ${b.toFixed(2)} = ?`, numericOptions(correct, answerIndex, 0.1), answerIndex, '小數點對齊後相加。'));
  }
  return items;
}

function fractionItems(context, startSerial) {
  const rows = [
    ['3/8 + 2/8 = ?', '5/8', ['5/16', '1/2', '6/8']],
    ['5/9 - 2/9 = ?', '3/9', ['3/18', '7/9', '1/9']],
    ['1/6 + 4/6 = ?', '5/6', ['5/12', '4/12', '1/2']],
    ['7/10 - 3/10 = ?', '4/10', ['10/10', '3/20', '1/10']],
    ['2/5 + 1/5 = ?', '3/5', ['3/10', '2/10', '4/5']],
    ['6/7 - 1/7 = ?', '5/7', ['5/14', '7/7', '4/7']],
  ];
  return rows.map((row, index) => placeMath(context, startSerial + index, '分數', 3, row[0], row[1], row[2]));
}

function placeMath(context, serial, skill, difficulty, prompt, correct, distractors) {
  const answerIndex = serialAnswerIndex(context, serial);
  return mathItem(skill, difficulty, prompt, placeAnswer(correct, distractors, answerIndex), answerIndex, mathExplanation(skill, prompt, correct));
}

function mathItem(skill, difficulty, prompt, options, answerIndex, explanation) {
  return { skill, difficulty, prompt, options, answerIndex, explanation };
}

function mathExplanation(skill, prompt, correct) {
  if (skill.includes('分數')) return `依分數規則計算，答案是 ${correct}。`;
  if (skill.includes('面積')) return `依面積公式計算，答案是 ${correct}。`;
  if (skill.includes('體積') || skill.includes('容積')) return `依體積或容積公式計算，答案是 ${correct}。`;
  if (skill.includes('百分')) return `依百分率計算，答案是 ${correct}。`;
  if (skill.includes('角')) return `依角度概念判斷，答案是 ${correct}。`;
  if (prompt.includes('=')) return `計算後可得 ${correct}。`;
  return `依題意判斷，答案是 ${correct}。`;
}
