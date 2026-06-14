import { GENERATED_QUESTION_BANK } from './generated-question-bank';
import { GRADE4B_QUESTION_BANK } from './grade4b-question-bank';

export type QuestionGrade = 'grade2b' | 'grade4b' | 'grade5b';

export interface QuestionGradeInfo {
  id: QuestionGrade;
  shortLabel: string;
  label: string;
  desc: string;
  subjects: string[];
}

export interface QuizQuestion {
  id: string;
  grade: QuestionGrade;
  subject: string;
  prompt: string;
  options: readonly [string, string, string, string];
  answerIndex: number;
  explanation: string;
}

export const QUESTION_GRADES: QuestionGradeInfo[] = [
  {
    id: 'grade2b',
    shortLabel: '二下',
    label: '二年級下學期',
    desc: '國語、數學、生活、英語、自然觀察',
    subjects: ['國語', '數學', '生活', '英語', '自然'],
  },
  {
    id: 'grade4b',
    shortLabel: '四下',
    label: '四年級下學期期末',
    desc: '國語、英語、數學期末複習',
    subjects: ['國語', '英語', '數學'],
  },
  {
    id: 'grade5b',
    shortLabel: '五下',
    label: '五年級下學期',
    desc: '國語、數學、自然、社會、英語',
    subjects: ['國語', '數學', '自然', '社會', '英語'],
  },
];

export const DEFAULT_QUESTION_GRADE: QuestionGrade = 'grade2b';

const BASE_QUESTION_BANK: QuizQuestion[] = [
  {
    id: 'g2b-math-001',
    grade: 'grade2b',
    subject: '數學',
    prompt: '小安有 18 顆彈珠，又得到 7 顆，現在共有幾顆？',
    options: ['21 顆', '24 顆', '25 顆', '27 顆'],
    answerIndex: 2,
    explanation: '18 + 7 = 25，所以共有 25 顆。',
  },
  {
    id: 'g2b-math-002',
    grade: 'grade2b',
    subject: '數學',
    prompt: '一盒有 6 枝鉛筆，4 盒共有幾枝鉛筆？',
    options: ['10 枝', '18 枝', '20 枝', '24 枝'],
    answerIndex: 3,
    explanation: '6 的 4 倍是 24，也可以想成 6 + 6 + 6 + 6。',
  },
  {
    id: 'g2b-math-003',
    grade: 'grade2b',
    subject: '數學',
    prompt: '鐘面上長針指著 6，短針在 3 和 4 中間，表示幾點半？',
    options: ['2 點半', '3 點半', '4 點半', '6 點半'],
    answerIndex: 1,
    explanation: '長針指 6 表示半點，短針在 3 和 4 中間是 3 點半。',
  },
  {
    id: 'g2b-math-004',
    grade: 'grade2b',
    subject: '數學',
    prompt: '46 比 39 多多少？',
    options: ['5', '6', '7', '8'],
    answerIndex: 2,
    explanation: '46 - 39 = 7。',
  },
  {
    id: 'g2b-chinese-001',
    grade: 'grade2b',
    subject: '國語',
    prompt: '「仔細」的意思最接近哪一個？',
    options: ['很快', '很小心', '很大聲', '很生氣'],
    answerIndex: 1,
    explanation: '仔細就是小心、認真地看或做。',
  },
  {
    id: 'g2b-chinese-002',
    grade: 'grade2b',
    subject: '國語',
    prompt: '下列哪一個詞語適合形容「太陽很大，天氣很熱」？',
    options: ['寒冷', '炎熱', '安靜', '整齊'],
    answerIndex: 1,
    explanation: '天氣很熱可以用「炎熱」形容。',
  },
  {
    id: 'g2b-chinese-003',
    grade: 'grade2b',
    subject: '國語',
    prompt: '「我把書放進書包裡。」這句話中的「書包」是什麼？',
    options: ['人物', '地方', '物品', '動作'],
    answerIndex: 2,
    explanation: '書包是可以放書的物品。',
  },
  {
    id: 'g2b-life-001',
    grade: 'grade2b',
    subject: '生活',
    prompt: '看到同學跌倒受傷，最適合先做什麼？',
    options: ['大聲笑他', '請老師或大人幫忙', '馬上跑走', '把他的東西藏起來'],
    answerIndex: 1,
    explanation: '同學受傷時，要先通知老師或大人協助。',
  },
  {
    id: 'g2b-life-002',
    grade: 'grade2b',
    subject: '生活',
    prompt: '下雨天走在路上，哪一個行為比較安全？',
    options: ['在水坑旁奔跑', '拿雨傘遮雨並慢慢走', '邊走邊看手機', '在馬路中間玩水'],
    answerIndex: 1,
    explanation: '下雨天路面濕滑，撐傘並慢慢走比較安全。',
  },
  {
    id: 'g2b-life-003',
    grade: 'grade2b',
    subject: '生活',
    prompt: '要節約用水，刷牙時應該怎麼做？',
    options: ['水龍頭一直開著', '把杯子裝滿水再刷', '用水管沖地板', '忘記關水龍頭'],
    answerIndex: 1,
    explanation: '用杯子裝水刷牙，可以減少水一直流掉。',
  },
  {
    id: 'g2b-math-005',
    grade: 'grade2b',
    subject: '數學',
    prompt: '把 12 個蘋果平分給 3 個人，每人可以分到幾個？',
    options: ['3 個', '4 個', '6 個', '9 個'],
    answerIndex: 1,
    explanation: '12 平分成 3 份，每份是 4。',
  },
  {
    id: 'g2b-chinese-004',
    grade: 'grade2b',
    subject: '國語',
    prompt: '「妹妹一邊唱歌，一邊跳舞。」這句話表示妹妹做了幾件事？',
    options: ['1 件', '2 件', '3 件', '4 件'],
    answerIndex: 1,
    explanation: '唱歌和跳舞是兩件事，並且同時進行。',
  },
  {
    id: 'g5b-math-001',
    grade: 'grade5b',
    subject: '數學',
    prompt: '3/4 + 1/8 等於多少？',
    options: ['4/12', '5/8', '7/8', '1'],
    answerIndex: 2,
    explanation: '3/4 = 6/8，6/8 + 1/8 = 7/8。',
  },
  {
    id: 'g5b-math-002',
    grade: 'grade5b',
    subject: '數學',
    prompt: '一個長方形長 12 公分、寬 5 公分，面積是多少？',
    options: ['17 平方公分', '34 平方公分', '60 平方公分', '120 平方公分'],
    answerIndex: 2,
    explanation: '長方形面積 = 長 × 寬 = 12 × 5 = 60。',
  },
  {
    id: 'g5b-math-003',
    grade: 'grade5b',
    subject: '數學',
    prompt: '0.6 × 0.5 等於多少？',
    options: ['0.03', '0.3', '1.1', '3'],
    answerIndex: 1,
    explanation: '6 × 5 = 30，小數共有兩位，所以是 0.30，也就是 0.3。',
  },
  {
    id: 'g5b-math-004',
    grade: 'grade5b',
    subject: '數學',
    prompt: '18 和 24 的最大公因數是多少？',
    options: ['3', '4', '6', '12'],
    answerIndex: 2,
    explanation: '18 的因數有 1、2、3、6、9、18；24 的因數有 1、2、3、4、6、8、12、24，最大共同因數是 6。',
  },
  {
    id: 'g5b-chinese-001',
    grade: 'grade5b',
    subject: '國語',
    prompt: '「鍥而不捨」最接近哪一種意思？',
    options: ['半途而廢', '持續努力', '隨便應付', '害怕嘗試'],
    answerIndex: 1,
    explanation: '鍥而不捨表示一直努力，遇到困難也不放棄。',
  },
  {
    id: 'g5b-chinese-002',
    grade: 'grade5b',
    subject: '國語',
    prompt: '下列哪一句比較適合作為作文結尾？',
    options: ['昨天我吃了早餐。', '這次經驗讓我學會珍惜合作的力量。', '鉛筆盒是藍色的。', '操場旁邊有樹。'],
    answerIndex: 1,
    explanation: '結尾常用來收束全文，寫出感想或收穫。',
  },
  {
    id: 'g5b-natural-001',
    grade: 'grade5b',
    subject: '自然',
    prompt: '植物行光合作用時，主要需要陽光、水和哪一種氣體？',
    options: ['氧氣', '二氧化碳', '氮氣', '氫氣'],
    answerIndex: 1,
    explanation: '植物利用陽光、水和二氧化碳製造養分，並釋放氧氣。',
  },
  {
    id: 'g5b-natural-002',
    grade: 'grade5b',
    subject: '自然',
    prompt: '聲音在下列哪一種情況下比較不容易傳播？',
    options: ['空氣中', '水中', '真空中', '金屬中'],
    answerIndex: 2,
    explanation: '聲音需要介質傳播，真空中沒有介質。',
  },
  {
    id: 'g5b-social-001',
    grade: 'grade5b',
    subject: '社會',
    prompt: '台灣的中央山脈大致呈現哪一種走向？',
    options: ['南北走向', '東西走向', '圓形分布', '放射狀分布'],
    answerIndex: 0,
    explanation: '中央山脈大致由北向南延伸，是台灣重要的山脈。',
  },
  {
    id: 'g5b-social-002',
    grade: 'grade5b',
    subject: '社會',
    prompt: '如果想了解一個地方的道路與河流分布，最適合使用哪一種資料？',
    options: ['地圖', '日記', '菜單', '童話書'],
    answerIndex: 0,
    explanation: '地圖可以呈現道路、河流、行政區與地形位置。',
  },
  {
    id: 'g5b-english-001',
    grade: 'grade5b',
    subject: '英語',
    prompt: 'Which sentence is correct?',
    options: ['He are my friend.', 'She is my sister.', 'They is students.', 'I am a books.'],
    answerIndex: 1,
    explanation: 'She 搭配 is，所以「She is my sister.」是正確句子。',
  },
  {
    id: 'g5b-english-002',
    grade: 'grade5b',
    subject: '英語',
    prompt: '「我喜歡蘋果。」的英文最接近哪一句？',
    options: ['I like apples.', 'I am apples.', 'I go apples.', 'I see apple red.'],
    answerIndex: 0,
    explanation: '「喜歡」可以用 like，蘋果複數常寫 apples。',
  },
];

export const QUESTION_BANK: QuizQuestion[] = [
  ...BASE_QUESTION_BANK,
  ...GENERATED_QUESTION_BANK,
  ...GRADE4B_QUESTION_BANK,
];

export function getQuestionGradeInfo(grade: QuestionGrade): QuestionGradeInfo {
  return QUESTION_GRADES.find((g) => g.id === grade) ?? QUESTION_GRADES[0];
}

export function isQuestionGrade(value: string): value is QuestionGrade {
  return QUESTION_GRADES.some((g) => g.id === value);
}

const RECENT_QUESTION_LIMIT = 10;
const RECENT_SUBJECT_LIMIT = 2;
const recentQuestionIds = new Map<QuestionGrade, string[]>();
const recentSubjects = new Map<QuestionGrade, string[]>();

export function rollQuestion(grade: QuestionGrade): QuizQuestion {
  const pool = QUESTION_BANK.filter((q) => q.grade === grade);
  const usable = pool.length > 0 ? pool : QUESTION_BANK;
  const recentIds = recentQuestionIds.get(grade) ?? [];
  const subjects = recentSubjects.get(grade) ?? [];
  let candidates = usable.filter((q) => !recentIds.includes(q.id));
  if (candidates.length === 0) candidates = usable;

  const variedSubjects = candidates.filter((q) => !subjects.includes(q.subject));
  if (variedSubjects.length >= 4 || (variedSubjects.length > 0 && candidates.length < 4)) {
    candidates = variedSubjects;
  }

  const question = candidates[Math.floor(Math.random() * candidates.length)];
  rememberQuestion(grade, question);
  return shuffleQuestionOptions(question);
}

function rememberQuestion(grade: QuestionGrade, question: QuizQuestion) {
  const ids = [question.id, ...(recentQuestionIds.get(grade) ?? [])].slice(0, RECENT_QUESTION_LIMIT);
  recentQuestionIds.set(grade, ids);

  const subjects = [question.subject, ...(recentSubjects.get(grade) ?? [])].slice(0, RECENT_SUBJECT_LIMIT);
  recentSubjects.set(grade, subjects);
}

function shuffleQuestionOptions(question: QuizQuestion): QuizQuestion {
  const order = [0, 1, 2, 3];
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  const options = order.map((index) => question.options[index]) as [string, string, string, string];
  return {
    ...question,
    options,
    answerIndex: order.indexOf(question.answerIndex),
  };
}
