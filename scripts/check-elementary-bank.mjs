import dataset from '../public/question-bank/elementary-kangxuan.json' with { type: 'json' };

const expectedGrades = [
  'grade1a', 'grade1b',
  'grade2a', 'grade2b',
  'grade3a', 'grade3b',
  'grade4a', 'grade4b',
  'grade5a', 'grade5b',
  'grade6a', 'grade6b',
];
const expectedSubjects = ['國語', '英語', '數學'];
const expectedExams = ['midterm', 'final'];
const expectedPerCombo = 30;
const errors = [];
const ids = new Set();
const comboCounts = new Map();
const comboPrompts = new Map();

for (const question of dataset.questions) {
  if (ids.has(question.id)) errors.push(`duplicate id: ${question.id}`);
  ids.add(question.id);

  if (!expectedGrades.includes(question.grade)) errors.push(`invalid grade: ${question.id}`);
  if (!expectedSubjects.includes(question.subject)) errors.push(`invalid subject: ${question.id}`);
  if (!expectedExams.includes(question.exam)) errors.push(`invalid exam: ${question.id}`);
  if (!Array.isArray(question.options) || question.options.length !== 4) errors.push(`invalid options: ${question.id}`);
  if (!Number.isInteger(question.answerIndex) || question.answerIndex < 0 || question.answerIndex > 3) {
    errors.push(`invalid answerIndex: ${question.id}`);
  }
  if (!question.prompt || !question.explanation || !question.skill) errors.push(`missing text field: ${question.id}`);

  const combo = `${question.grade}|${question.subject}|${question.exam}`;
  comboCounts.set(combo, (comboCounts.get(combo) ?? 0) + 1);
  const promptKey = `${combo}|${question.prompt}`;
  if (comboPrompts.has(promptKey)) errors.push(`duplicate prompt in combo: ${combo} / ${question.prompt}`);
  comboPrompts.set(promptKey, question.id);
}

for (const grade of expectedGrades) {
  for (const subject of expectedSubjects) {
    for (const exam of expectedExams) {
      const combo = `${grade}|${subject}|${exam}`;
      const count = comboCounts.get(combo) ?? 0;
      if (count !== expectedPerCombo) errors.push(`combo should have ${expectedPerCombo} questions: ${combo} (${count})`);
    }
  }
}

if (errors.length > 0) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log(`elementary bank ok: ${dataset.questions.length} questions, ${comboCounts.size} combos`);
