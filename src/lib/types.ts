export type Exam = "ACT";

export type Section = "Math" | "English" | "Reading" | "Science";

export type Difficulty = "easy" | "medium" | "hard";

export type MistakeType =
  | "concept gap"
  | "careless mistake"
  | "timing issue"
  | "misread question"
  | "guessed"
  | "strategy issue";

export type Question = {
  id: string;
  exam: Exam;
  section: Section;
  topic: string;
  subtopic: string;
  difficulty: Difficulty;
  questionText: string;
  choices: Record<"A" | "B" | "C" | "D", string>;
  correctAnswer: "A" | "B" | "C" | "D";
  explanation: string;
  createdAt: string;
};

export type UserProfile = {
  id: string;
  userId: string;
  exam: Exam;
  targetScore: number;
  currentScore?: number;
  testDate: string;
  studyHoursPerWeek: number;
};

export type Attempt = {
  id: string;
  userId: string;
  questionId: string;
  selectedAnswer: "A" | "B" | "C" | "D";
  isCorrect: boolean;
  timeSpentSeconds: number;
  createdAt: string;
};

export type Mistake = {
  id: string;
  userId: string;
  questionId: string;
  attemptId: string;
  mistakeType: MistakeType;
  aiExplanation: string;
  createdAt: string;
};

export type StudyRecommendation = {
  id: string;
  userId: string;
  topic: string;
  subtopic: string;
  reason: string;
  priority: number;
  createdAt: string;
};

export type TutorExplanation = {
  explanation: string;
  similarQuestionIds: string[];
  source: "fallback" | "openai";
};
