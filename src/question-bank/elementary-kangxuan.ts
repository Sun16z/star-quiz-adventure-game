import rawDataset from './elementary-kangxuan.json';
import type { ElementaryBankDataset } from './schema';

export const ELEMENTARY_KANGXUAN_DATASET = rawDataset as unknown as ElementaryBankDataset;
export const ELEMENTARY_KANGXUAN_QUESTIONS = ELEMENTARY_KANGXUAN_DATASET.questions;

export type {
  ElementaryBankDataset,
  ElementaryQuestion,
  QuestionExam,
  QuestionGrade,
  QuestionSemester,
  QuestionSubject,
  QuizSelection,
} from './schema';
