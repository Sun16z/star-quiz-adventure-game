export type QuestionGrade =
  | 'grade1a'
  | 'grade1b'
  | 'grade2a'
  | 'grade2b'
  | 'grade3a'
  | 'grade3b'
  | 'grade4a'
  | 'grade4b'
  | 'grade5a'
  | 'grade5b'
  | 'grade6a'
  | 'grade6b';

export type QuestionSemester = 'a' | 'b';
export type QuestionSubject = '國語' | '英語' | '數學';
export type QuizSubject = '綜合' | QuestionSubject;
export type QuestionExam = 'midterm' | 'final';
export type QuestionPublisher = '康軒' | '翰林' | '南一';

export interface QuizSelection {
  publisher: QuestionPublisher;
  grade: QuestionGrade;
  subject: QuizSubject;
  exam: QuestionExam;
}

export interface QuestionSource {
  type: 'original';
  referenceUrl: string;
}

export interface ElementaryQuestion {
  id: string;
  publisher: QuestionPublisher;
  grade: QuestionGrade;
  gradeNumber: number;
  gradeLabel: string;
  semester: QuestionSemester;
  semesterLabel: string;
  subject: QuestionSubject;
  exam: QuestionExam;
  examLabel: string;
  unit: string;
  skill: string;
  difficulty: number;
  prompt: string;
  options: readonly [string, string, string, string];
  answerIndex: number;
  explanation: string;
  source: QuestionSource;
}

export interface ElementaryBankDataset {
  schemaVersion: number;
  title: string;
  description: string;
  publisher?: QuestionPublisher;
  publishers?: QuestionPublisher[];
  licenseNote: string;
  sourceReference: {
    title: string;
    url: string;
    usedFor: string;
  };
  sourceReferences?: Array<{
    title: string;
    url: string;
    usedFor: string;
  }>;
  targetPerCombo?: number;
  grades: Array<{
    id: QuestionGrade;
    grade: number;
    semester: QuestionSemester;
    label: string;
  }>;
  subjects: QuestionSubject[];
  exams: Array<{ id: QuestionExam; label: string }>;
  questions: ElementaryQuestion[];
}
