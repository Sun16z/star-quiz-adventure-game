import rawDataset from './elementary-publishers.json';
import type { ElementaryBankDataset } from './schema';

export const ELEMENTARY_PUBLISHERS_DATASET = rawDataset as unknown as ElementaryBankDataset;
export const ELEMENTARY_PUBLISHERS_QUESTIONS = ELEMENTARY_PUBLISHERS_DATASET.questions;

export type {
  ElementaryBankDataset,
  ElementaryQuestion,
  QuestionExam,
  QuestionGrade,
  QuestionPublisher,
  QuestionSemester,
  QuestionSubject,
  QuizSelection,
  QuizSubject,
} from './schema';
