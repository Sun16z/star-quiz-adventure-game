import { GENERATED_QUESTION_BANK } from './generated-question-bank';
import { GRADE4B_QUESTION_BANK } from './grade4b-question-bank';
import { ELEMENTARY_KANGXUAN_DATASET, ELEMENTARY_KANGXUAN_QUESTIONS } from '../question-bank/elementary-kangxuan';
import type { QuestionExam, QuestionGrade, QuestionSubject, QuizSelection, QuizSubject } from '../question-bank/schema';

export type { QuestionExam, QuestionGrade, QuestionSubject, QuizSelection, QuizSubject } from '../question-bank/schema';

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
  exam?: QuestionExam;
  examLabel?: string;
  publisher?: string;
  skill?: string;
  difficulty?: number;
  prompt: string;
  options: readonly [string, string, string, string];
  answerIndex: number;
  explanation: string;
}

export const CORE_QUESTION_SUBJECTS: readonly QuestionSubject[] = ['國語', '英語', '數學'];

export const QUESTION_SUBJECTS: Array<{ id: QuizSubject; label: string; desc: string; icon: string }> = [
  { id: '綜合', label: '綜合版', desc: '國語、英語、數學混合出題', icon: '🌈' },
  { id: '國語', label: '國語', desc: '字詞、句型、閱讀、寫作', icon: '📖' },
  { id: '英語', label: '英語', desc: '單字、句型、閱讀理解', icon: '🔤' },
  { id: '數學', label: '數學', desc: '計算、圖形、應用題', icon: '➗' },
];

export const QUESTION_EXAMS: Array<{ id: QuestionExam; label: string; desc: string; icon: string }> = [
  { id: 'midterm', label: '期中考', desc: '前半學期重點', icon: '📝' },
  { id: 'final', label: '期末考', desc: '後半學期與總複習', icon: '🏁' },
];

export const QUESTION_GRADES: QuestionGradeInfo[] = ELEMENTARY_KANGXUAN_DATASET.grades.map((grade) => ({
  id: grade.id,
  shortLabel: `${toChineseNumber(grade.grade)}${grade.semester === 'a' ? '上' : '下'}`,
  label: `康軒${toChineseNumber(grade.grade)}年級${grade.semester === 'a' ? '上學期' : '下學期'}`,
  desc: '國語、英語、數學｜期中/期末',
  subjects: ['國語', '英語', '數學'],
}));

export const DEFAULT_QUESTION_GRADE: QuestionGrade = 'grade2b';
export const DEFAULT_QUIZ_SELECTION: QuizSelection = {
  grade: DEFAULT_QUESTION_GRADE,
  subject: '綜合',
  exam: 'final',
};

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
  ...ELEMENTARY_KANGXUAN_QUESTIONS,
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

export function isQuestionSubject(value: string): value is QuizSubject {
  return QUESTION_SUBJECTS.some((subject) => subject.id === value);
}

export function isQuestionExam(value: string): value is QuestionExam {
  return QUESTION_EXAMS.some((exam) => exam.id === value);
}

export function getQuestionExamInfo(exam: QuestionExam) {
  return QUESTION_EXAMS.find((item) => item.id === exam) ?? QUESTION_EXAMS[0];
}

export function getQuestionSubjectInfo(subject: QuizSubject) {
  return QUESTION_SUBJECTS.find((item) => item.id === subject) ?? QUESTION_SUBJECTS[0];
}

export function normalizeQuizSelection(selection?: Partial<QuizSelection>): QuizSelection {
  return {
    grade: selection?.grade && isQuestionGrade(selection.grade) ? selection.grade : DEFAULT_QUIZ_SELECTION.grade,
    subject: selection?.subject && isQuestionSubject(selection.subject) ? selection.subject : DEFAULT_QUIZ_SELECTION.subject,
    exam: selection?.exam && isQuestionExam(selection.exam) ? selection.exam : DEFAULT_QUIZ_SELECTION.exam,
  };
}

export function getQuizSelectionLabel(selection: QuizSelection): string {
  const normalized = normalizeQuizSelection(selection);
  const gradeInfo = getQuestionGradeInfo(normalized.grade);
  const subjectInfo = getQuestionSubjectInfo(normalized.subject);
  const examInfo = getQuestionExamInfo(normalized.exam);
  return `${gradeInfo.shortLabel}・${subjectInfo.label}・${examInfo.label}`;
}

const RECENT_QUESTION_LIMIT = 30;
const RECENT_SUBJECT_LIMIT = 2;
const RECENT_SKILL_LIMIT = 4;
const recentQuestionIds = new Map<string, string[]>();
const recentSubjects = new Map<string, string[]>();
const recentSkills = new Map<string, string[]>();

export function rollQuestion(selectionOrGrade: QuizSelection | QuestionGrade): QuizQuestion {
  const selection = typeof selectionOrGrade === 'string'
    ? normalizeQuizSelection({ grade: selectionOrGrade })
    : normalizeQuizSelection(selectionOrGrade);
  const selectionKey = `${selection.grade}:${selection.subject}:${selection.exam}`;
  const selectedSubjects = selection.subject === '綜合' ? CORE_QUESTION_SUBJECTS : [selection.subject];
  const strictPool = QUESTION_BANK.filter(
    (q) => q.grade === selection.grade && selectedSubjects.includes(q.subject as QuestionSubject) && q.exam === selection.exam,
  );
  const subjectPool = QUESTION_BANK.filter((q) => q.grade === selection.grade && selectedSubjects.includes(q.subject as QuestionSubject));
  const gradePool = QUESTION_BANK.filter((q) => q.grade === selection.grade);
  const usable = strictPool.length > 0 ? strictPool : subjectPool.length > 0 ? subjectPool : gradePool.length > 0 ? gradePool : QUESTION_BANK;
  const recentIds = recentQuestionIds.get(selectionKey) ?? [];
  const subjectHistory = recentSubjects.get(selectionKey) ?? [];
  const skillHistory = recentSkills.get(selectionKey) ?? [];
  let candidates = usable.filter((q) => !recentIds.includes(q.id));
  if (candidates.length === 0) candidates = usable;

  if (selection.subject === '綜合') {
    const variedSubjects = candidates.filter((q) => !subjectHistory.includes(q.subject));
    if (variedSubjects.length >= 6) candidates = variedSubjects;
  }

  const variedSkills = candidates.filter((q) => !skillHistory.includes(q.skill ?? ''));
  if (variedSkills.length >= 6) candidates = variedSkills;

  const question = candidates[Math.floor(Math.random() * candidates.length)];
  rememberQuestion(selectionKey, question);
  return shuffleQuestionOptions(question);
}

function rememberQuestion(selectionKey: string, question: QuizQuestion) {
  const ids = [question.id, ...(recentQuestionIds.get(selectionKey) ?? [])].slice(0, RECENT_QUESTION_LIMIT);
  recentQuestionIds.set(selectionKey, ids);

  const subjects = [question.subject, ...(recentSubjects.get(selectionKey) ?? [])].slice(0, RECENT_SUBJECT_LIMIT);
  recentSubjects.set(selectionKey, subjects);

  const skill = question.skill ?? '';
  if (skill) {
    const skills = [skill, ...(recentSkills.get(selectionKey) ?? [])].slice(0, RECENT_SKILL_LIMIT);
    recentSkills.set(selectionKey, skills);
  }
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

function toChineseNumber(value: number): string {
  return ['零', '一', '二', '三', '四', '五', '六'][value] ?? String(value);
}
