"use client";

import { useEffect, useState } from "react";
import { getCurrentSupabaseUserId, loadStudyStateRemote } from "./supabase-data";
import { getQuestion } from "./questions";
import {
  buildTutorExplanation,
  readAttempts,
  readMistakes,
  readProfile,
  setCurrentUserId,
  writeAttempts,
  writeMistakes,
  writeProfile,
} from "./storage";
import type { Attempt, Mistake } from "./types";

export function useStudyStateSync() {
  const [ready, setReady] = useState(false);
  const [syncStatus, setSyncStatus] = useState<"local" | "remote" | "error">("local");

  useEffect(() => {
    let active = true;

    async function sync() {
      try {
        const userId = await getCurrentSupabaseUserId();
        if (!active) return;

        if (!userId) {
          setReady(true);
          setSyncStatus("local");
          return;
        }

        setCurrentUserId(userId);
        const state = await loadStudyStateRemote(userId);
        if (!active) return;

        const attempts = mergeById(state.attempts, readAttempts());
        const mistakes = rebuildMissingMistakes(attempts, mergeById(state.mistakes, readMistakes()));

        writeProfile(state.profile ?? readProfile());
        writeAttempts(attempts);
        writeMistakes(mistakes);
        setSyncStatus("remote");
      } catch {
        if (active) setSyncStatus("error");
      } finally {
        if (active) setReady(true);
      }
    }

    sync();

    return () => {
      active = false;
    };
  }, []);

  return { ready, syncStatus };
}

function mergeById<T extends Attempt | Mistake>(remoteItems: T[], localItems: T[]) {
  const merged = new Map<string, T>();

  for (const item of localItems) merged.set(item.id, item);
  for (const item of remoteItems) merged.set(item.id, item);

  return [...merged.values()].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

function rebuildMissingMistakes(attempts: Attempt[], mistakes: Mistake[]) {
  const existingAttemptIds = new Set(mistakes.map((mistake) => mistake.attemptId));
  const rebuilt = [...mistakes];

  for (const attempt of attempts) {
    if (attempt.isCorrect || existingAttemptIds.has(attempt.id)) continue;

    const question = getQuestion(attempt.questionId);
    if (!question) continue;

    rebuilt.push({
      id: crypto.randomUUID(),
      userId: attempt.userId,
      questionId: attempt.questionId,
      attemptId: attempt.id,
      mistakeType: "concept gap",
      aiExplanation: buildTutorExplanation(question, attempt.selectedAnswer),
      createdAt: attempt.createdAt,
    });
  }

  return rebuilt.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
