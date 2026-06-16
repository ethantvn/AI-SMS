import type { Difficulty, Question, Section } from "./types";

const createdAt = "2026-06-15T00:00:00.000Z";

const bank: Array<{
  section: Section;
  topic: string;
  subtopic: string;
  difficulty: Difficulty;
  questionText: string;
  choices: Question["choices"];
  correctAnswer: Question["correctAnswer"];
  explanation: string;
}> = [
  {
    section: "Math",
    topic: "Algebra",
    subtopic: "Linear equations",
    difficulty: "easy",
    questionText: "If 3x + 7 = 22, what is the value of x?",
    choices: { A: "3", B: "5", C: "7", D: "15" },
    correctAnswer: "B",
    explanation: "Subtract 7 to get 3x = 15, then divide by 3. x = 5.",
  },
  {
    section: "Math",
    topic: "Algebra",
    subtopic: "Systems of equations",
    difficulty: "medium",
    questionText: "A pair of numbers has a sum of 18 and a difference of 4. What is the larger number?",
    choices: { A: "7", B: "9", C: "11", D: "14" },
    correctAnswer: "C",
    explanation: "Let the numbers be x and y. x + y = 18 and x - y = 4, so 2x = 22 and x = 11.",
  },
  {
    section: "Math",
    topic: "Geometry",
    subtopic: "Triangles",
    difficulty: "medium",
    questionText: "A right triangle has legs of length 6 and 8. What is the length of the hypotenuse?",
    choices: { A: "10", B: "12", C: "14", D: "48" },
    correctAnswer: "A",
    explanation: "Use the Pythagorean theorem: 6^2 + 8^2 = 100, so the hypotenuse is 10.",
  },
  {
    section: "Math",
    topic: "Functions",
    subtopic: "Function notation",
    difficulty: "easy",
    questionText: "If f(x) = 2x^2 - 1, what is f(3)?",
    choices: { A: "11", B: "17", C: "18", D: "35" },
    correctAnswer: "B",
    explanation: "Substitute 3 for x: 2(3^2) - 1 = 18 - 1 = 17.",
  },
  {
    section: "English",
    topic: "Conventions",
    subtopic: "Punctuation",
    difficulty: "easy",
    questionText: "Choose the best version: The experiment was simple ___ the results were surprising.",
    choices: { A: "simple, the", B: "simple; the", C: "simple the", D: "simple: and the" },
    correctAnswer: "B",
    explanation: "A semicolon can join two closely related independent clauses.",
  },
  {
    section: "English",
    topic: "Conventions",
    subtopic: "Subject-verb agreement",
    difficulty: "medium",
    questionText: "Choose the best version: The list of recommended books ___ on the desk.",
    choices: { A: "are", B: "were", C: "is", D: "have been" },
    correctAnswer: "C",
    explanation: "The subject is list, which is singular, so the verb should be is.",
  },
  {
    section: "English",
    topic: "Rhetorical Skills",
    subtopic: "Conciseness",
    difficulty: "easy",
    questionText: "Which choice is most concise? Maria returned back to the library after lunch.",
    choices: { A: "returned back", B: "went and returned back", C: "returned", D: "made a return back" },
    correctAnswer: "C",
    explanation: "Returned already means went back, so back is redundant.",
  },
  {
    section: "Reading",
    topic: "Key Ideas",
    subtopic: "Main idea",
    difficulty: "medium",
    questionText: "A passage describes a scientist's failed experiments before explaining her later discovery. What is the most likely main purpose?",
    choices: {
      A: "To show that persistence can lead to insight",
      B: "To argue that experiments are usually pointless",
      C: "To list every result from a laboratory",
      D: "To compare two unrelated scientists",
    },
    correctAnswer: "A",
    explanation: "The structure connects setbacks to a later discovery, emphasizing persistence.",
  },
  {
    section: "Reading",
    topic: "Craft and Structure",
    subtopic: "Inference",
    difficulty: "hard",
    questionText: "A narrator says a town square was 'too polished to feel lived in.' What can be inferred?",
    choices: {
      A: "The town square is dirty",
      B: "The narrator finds the square artificial",
      C: "The narrator wants to move there",
      D: "The square is crowded",
    },
    correctAnswer: "B",
    explanation: "Too polished suggests the place feels staged or artificial.",
  },
  {
    section: "Science",
    topic: "Data Interpretation",
    subtopic: "Tables",
    difficulty: "easy",
    questionText: "In a table, plant height rises from 4 cm to 12 cm as light exposure rises from 2 hours to 6 hours. Which conclusion is best supported?",
    choices: {
      A: "More light is associated with greater height",
      B: "Light has no effect on height",
      C: "Plants shrink with more light",
      D: "The table proves soil type caused growth",
    },
    correctAnswer: "A",
    explanation: "The data show height increasing as light exposure increases.",
  },
  {
    section: "Science",
    topic: "Research Summaries",
    subtopic: "Experimental design",
    difficulty: "medium",
    questionText: "Which change would best test whether fertilizer affects bean growth?",
    choices: {
      A: "Change fertilizer and water at the same time",
      B: "Use one plant only",
      C: "Compare fertilized and unfertilized plants with the same water and light",
      D: "Measure the plants before planting them",
    },
    correctAnswer: "C",
    explanation: "A fair test changes fertilizer while keeping other variables controlled.",
  },
  {
    section: "Science",
    topic: "Conflicting Viewpoints",
    subtopic: "Hypotheses",
    difficulty: "hard",
    questionText: "Scientist 1 says a crater formed by impact; Scientist 2 says it formed by volcanic collapse. Which evidence would most directly support Scientist 1?",
    choices: {
      A: "Rounded lava fragments inside the crater",
      B: "Shocked quartz found near the crater",
      C: "Several nearby hot springs",
      D: "A recent rise in local temperatures",
    },
    correctAnswer: "B",
    explanation: "Shocked quartz is commonly associated with impact events.",
  },
];

export const questions: Question[] = Array.from({ length: 10 }).flatMap((_, round) =>
  bank.map((question, index) => ({
    ...question,
    id: `act-${round + 1}-${index + 1}`,
    exam: "ACT" as const,
    questionText:
      round === 0
        ? question.questionText
        : `${question.questionText} (Practice variant ${round + 1})`,
    createdAt,
  })),
);

export const diagnosticQuestions = questions.slice(0, 24);

export function getQuestion(id: string) {
  return questions.find((question) => question.id === id);
}

export function getSimilarQuestions(questionId: string, limit = 3) {
  const question = getQuestion(questionId);
  if (!question) return [];
  const originalPrompt = normalizePrompt(question.questionText);

  return questions
    .filter((candidate) => candidate.id !== question.id && normalizePrompt(candidate.questionText) !== originalPrompt)
    .map((candidate) => {
      const score =
        (candidate.subtopic === question.subtopic ? 4 : 0) +
        (candidate.topic === question.topic ? 2 : 0) +
        (candidate.section === question.section ? 1 : 0) +
        (candidate.difficulty === question.difficulty ? 1 : 0);

      return { candidate, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.candidate.id.localeCompare(b.candidate.id))
    .slice(0, limit)
    .map((item) => item.candidate);
}

function normalizePrompt(prompt: string) {
  return prompt.replace(/\s+\(Practice variant \d+\)$/i, "").trim().toLowerCase();
}

export function practiceQuestionLabel(question: Pick<Question, "id" | "section" | "subtopic" | "difficulty">) {
  const [round] = question.id.replace("act-", "").split("-");
  const variant = Number(round);
  const suffix = Number.isFinite(variant) && variant > 1 ? `Variant ${variant}` : question.difficulty;

  return `${question.section}: ${question.subtopic} (${suffix})`;
}

export function topicKey(question: Pick<Question, "topic" | "subtopic">) {
  return `${question.topic}: ${question.subtopic}`;
}
