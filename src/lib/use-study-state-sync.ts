"use client";

import { useEffect, useState } from "react";
import { getCurrentSupabaseUserId, loadStudyStateRemote } from "./supabase-data";
import {
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

        writeProfile(state.profile ?? readProfile());
        writeAttempts(mergeById(state.attempts, readAttempts()));
        writeMistakes(mergeById(state.mistakes, readMistakes()));
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
