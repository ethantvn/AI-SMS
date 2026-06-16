"use client";

import { questions, topicKey } from "./questions";
import type { Attempt, Mistake, MistakeType, Question, StudyRecommendation, UserProfile } from "./types";

const profileKey = "mistakelab.profile";
const attemptsKey = "mistakelab.attempts";
const mistakesKey = "mistakelab.mistakes";
const userIdKey = "mistakelab.userId";

const demoUserId = "00000000-0000-4000-8000-000000000000";

export function getUserId() {
  if (typeof window === "undefined") return demoUserId;
  return localStorage.getItem(userIdKey) ?? demoUserId;
}

export function setCurrentUserId(userId: string) {
  localStorage.setItem(userIdKey, userId);
}

export function readProfile(): UserProfile | null {
  return readJson<UserProfile | null>(profileKey, null);
}

export function writeProfile(profile: UserProfile | null) {
  if (!profile) {
    localStorage.removeItem(profileKey);
    return;
  }

  localStorage.setItem(profileKey, JSON.stringify(profile));
}

export function saveProfile(profile: Omit<UserProfile, "id" | "userId" | "exam">) {
  const existing = readProfile();
  const next: UserProfile = {
    ...profile,
    id: existing?.id && isUuid(existing.id) ? existing.id : crypto.randomUUID(),
    userId: getUserId(),
    exam: "ACT",
  };
  localStorage.setItem(profileKey, JSON.stringify(next));
  return next;
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export function readAttempts() {
  return readJson<Attempt[]>(attemptsKey, []);
}

export function readMistakes() {
  return readJson<Mistake[]>(mistakesKey, []);
}

export function writeAttempts(attempts: Attempt[]) {
  localStorage.setItem(attemptsKey, JSON.stringify(attempts));
}

export function writeMistakes(mistakes: Mistake[]) {
  localStorage.setItem(mistakesKey, JSON.stringify(mistakes));
}

export function updateMistakeExplanation(attemptId: string, aiExplanation: string) {
  const mistakes = readMistakes();
  const next = mistakes.map((mistake) =>
    mistake.attemptId === attemptId ? { ...mistake, aiExplanation } : mistake,
  );
  localStorage.setItem(mistakesKey, JSON.stringify(next));
}

export function saveAttempt(
  question: Question,
  selectedAnswer: Attempt["selectedAnswer"],
  timeSpentSeconds: number,
  mistakeType: MistakeType = "concept gap",
) {
  const attempts = readAttempts();
  const attempt: Attempt = {
    id: crypto.randomUUID(),
    userId: getUserId(),
    questionId: question.id,
    selectedAnswer,
    isCorrect: selectedAnswer === question.correctAnswer,
    timeSpentSeconds,
    createdAt: new Date().toISOString(),
  };
  localStorage.setItem(attemptsKey, JSON.stringify([attempt, ...attempts]));

  if (!attempt.isCorrect) {
    const mistakes = readMistakes();
    const aiExplanation = buildTutorExplanation(question, selectedAnswer);
    const mistake: Mistake = {
      id: crypto.randomUUID(),
      userId: getUserId(),
      questionId: question.id,
      attemptId: attempt.id,
      mistakeType,
      aiExplanation,
      createdAt: attempt.createdAt,
    };
    localStorage.setItem(mistakesKey, JSON.stringify([mistake, ...mistakes]));
  }

  return attempt;
}

export function buildTutorExplanation(question: Question, selectedAnswer: Attempt["selectedAnswer"]) {
  return [
    `The correct answer is ${question.correctAnswer} because ${question.explanation}`,
    `Your answer, ${selectedAnswer}, misses the key idea in ${question.subtopic}.`,
    `Review: ${question.topic} / ${question.subtopic}.`,
    "Tip: slow down, name what the question is asking, and eliminate choices that do not match that target.",
  ].join("\n");
}

export function getPerformanceSummary() {
  return buildPerformanceSummary(readAttempts(), readMistakes());
}

export function buildPerformanceSummary(attempts: Attempt[], mistakes: Mistake[] = []) {
  const completed = attempts.length;
  const correct = attempts.filter((attempt) => attempt.isCorrect).length;
  const accuracy = completed ? Math.round((correct / completed) * 100) : 0;

  const topicStats = new Map<string, { question: Question; total: number; correct: number; misses: number }>();
  attempts.forEach((attempt) => {
    const question = questions.find((item) => item.id === attempt.questionId);
    if (!question) return;
    const key = topicKey(question);
    const stat = topicStats.get(key) ?? { question, total: 0, correct: 0, misses: 0 };
    stat.total += 1;
    stat.correct += attempt.isCorrect ? 1 : 0;
    stat.misses += attempt.isCorrect ? 0 : 1;
    topicStats.set(key, stat);
  });

  const weakest = [...topicStats.values()]
    .map((stat) => ({
      topic: stat.question.topic,
      subtopic: stat.question.subtopic,
      accuracy: Math.round((stat.correct / stat.total) * 100),
      misses: stat.misses,
      total: stat.total,
    }))
    .sort((a, b) => a.accuracy - b.accuracy || b.misses - a.misses)
    .slice(0, 5);

  const mistakeCounts = mistakes.reduce<Record<string, number>>((counts, mistake) => {
    counts[mistake.mistakeType] = (counts[mistake.mistakeType] ?? 0) + 1;
    return counts;
  }, {});
  const commonMistakeType =
    Object.entries(mistakeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "none yet";

  return { attempts, mistakes, completed, accuracy, weakest, commonMistakeType };
}

export function buildRecommendations(): StudyRecommendation[] {
  const summary = getPerformanceSummary();
  const now = new Date().toISOString();
  const weakRecommendations = summary.weakest
    .filter((item) => item.accuracy < 70 || item.misses > 0)
    .map((item, index) => ({
      id: `rec-${item.topic}-${item.subtopic}`,
      userId: getUserId(),
      topic: item.topic,
      subtopic: item.subtopic,
      reason: `${item.accuracy}% accuracy across ${item.total} attempt${item.total === 1 ? "" : "s"}`,
      priority: index + 1,
      createdAt: now,
    }));

  if (weakRecommendations.length > 0) return weakRecommendations;

  return [
    {
      id: "rec-diagnostic",
      userId: getUserId(),
      topic: "Diagnostic",
      subtopic: "Baseline",
      reason: "Take the ACT diagnostic so recommendations can adapt to your misses.",
      priority: 1,
      createdAt: now,
    },
  ];
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  const value = localStorage.getItem(key);
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}
