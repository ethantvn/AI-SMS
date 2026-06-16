"use client";

import { questions } from "./questions";
import { getSupabaseBrowserClient } from "./supabase";
import type { Attempt, Mistake, MistakeType, Question, UserProfile } from "./types";

type ProfileRow = {
  id: string;
  user_id: string;
  exam: "ACT";
  target_score: number;
  current_score: number | null;
  test_date: string;
  study_hours_per_week: number;
};

type AttemptRow = {
  id: string;
  user_id: string;
  question_id: string;
  selected_answer: Attempt["selectedAnswer"];
  is_correct: boolean;
  time_spent_seconds: number;
  created_at: string;
};

type MistakeRow = {
  id: string;
  user_id: string;
  question_id: string;
  attempt_id: string;
  mistake_type: MistakeType;
  ai_explanation: string;
  created_at: string;
};

export async function getCurrentSupabaseUserId() {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;
  const result = await Promise.race([
    supabase.auth.getUser(),
    new Promise<null>((resolve) => window.setTimeout(() => resolve(null), 1500)),
  ]);

  if (!result) return null;
  return result.data.user?.id ?? null;
}

export async function saveProfileRemote(profile: UserProfile) {
  const supabase = getSupabaseBrowserClient();
  const { data } = supabase ? await supabase.auth.getUser() : { data: { user: null } };

  const response = await fetch("/api/profile", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: profile.id,
      userId: profile.userId,
      email: data.user?.email,
      name: data.user?.user_metadata?.name,
      targetScore: profile.targetScore,
      currentScore: profile.currentScore,
      testDate: profile.testDate,
      studyHoursPerWeek: profile.studyHoursPerWeek,
    }),
  });

  const result = (await response.json().catch(() => ({}))) as { error?: string };
  if (!response.ok) throw new Error(result.error ?? "Could not save profile.");
}

export async function loadProfileRemote(userId: string) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("user_profiles")
    .select("id,user_id,exam,target_score,current_score,test_date,study_hours_per_week")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const row = data as ProfileRow;
  return {
    id: row.id,
    userId: row.user_id,
    exam: row.exam,
    targetScore: row.target_score,
    currentScore: row.current_score ?? undefined,
    testDate: row.test_date,
    studyHoursPerWeek: row.study_hours_per_week,
  } satisfies UserProfile;
}

export async function saveQuestionRemote(question: Question) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return;

  const { error } = await supabase.from("questions").upsert(
    {
      id: question.id,
      exam: question.exam,
      section: question.section,
      topic: question.topic,
      subtopic: question.subtopic,
      difficulty: question.difficulty,
      question_text: question.questionText,
      choice_a: question.choices.A,
      choice_b: question.choices.B,
      choice_c: question.choices.C,
      choice_d: question.choices.D,
      correct_answer: question.correctAnswer,
      explanation: question.explanation,
      created_at: question.createdAt,
    },
    { onConflict: "id" },
  );

  if (error) throw error;
}

export async function saveAttemptRemote(attempt: Attempt, question: Question, mistake?: Mistake) {
  const response = await fetch("/api/attempt", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ attempt, questionId: question.id, mistake }),
  });

  const result = (await response.json().catch(() => ({}))) as { error?: string };
  if (!response.ok) throw new Error(result.error ?? "Could not save attempt.");
}

export async function loadAttemptsRemote(userId: string) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("attempts")
    .select("id,user_id,question_id,selected_answer,is_correct,time_spent_seconds,created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return ((data ?? []) as AttemptRow[]).map((row) => ({
    id: row.id,
    userId: row.user_id,
    questionId: row.question_id,
    selectedAnswer: row.selected_answer,
    isCorrect: row.is_correct,
    timeSpentSeconds: row.time_spent_seconds,
    createdAt: row.created_at,
  }));
}

export async function loadMistakesRemote(userId: string) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("mistakes")
    .select("id,user_id,question_id,attempt_id,mistake_type,ai_explanation,created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return ((data ?? []) as MistakeRow[]).map((row) => ({
    id: row.id,
    userId: row.user_id,
    questionId: row.question_id,
    attemptId: row.attempt_id,
    mistakeType: row.mistake_type,
    aiExplanation: row.ai_explanation,
    createdAt: row.created_at,
  }));
}

export async function loadStudyStateRemote(userId: string) {
  const [profile, attempts, mistakes] = await Promise.all([
    loadProfileRemote(userId),
    loadAttemptsRemote(userId),
    loadMistakesRemote(userId),
  ]);

  return { profile, attempts, mistakes };
}

export async function seedQuestionsRemote(limit = questions.length) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { inserted: 0, skipped: true };

  const rows = questions.slice(0, limit).map((question) => ({
    id: question.id,
    exam: question.exam,
    section: question.section,
    topic: question.topic,
    subtopic: question.subtopic,
    difficulty: question.difficulty,
    question_text: question.questionText,
    choice_a: question.choices.A,
    choice_b: question.choices.B,
    choice_c: question.choices.C,
    choice_d: question.choices.D,
    correct_answer: question.correctAnswer,
    explanation: question.explanation,
    created_at: question.createdAt,
  }));

  const { error } = await supabase.from("questions").upsert(rows, { onConflict: "id" });
  if (error) throw error;

  return { inserted: rows.length, skipped: false };
}
