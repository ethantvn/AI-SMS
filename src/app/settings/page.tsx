"use client";

import { AppShell, PageHeader } from "@/components/app-shell";
import { getCurrentSupabaseUserId, saveProfileRemote } from "@/lib/supabase-data";
import { readProfile, saveProfile } from "@/lib/storage";
import { useStudyStateSync } from "@/lib/use-study-state-sync";
import { FormEvent, useState } from "react";

export default function SettingsPage() {
  const { ready, syncStatus } = useStudyStateSync();
  const [saved, setSaved] = useState(false);
  const [seedStatus, setSeedStatus] = useState("");
  if (!ready) return null;

  const profile = readProfile();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const profile = saveProfile({
      targetScore: Number(form.get("targetScore")),
      currentScore: Number(form.get("currentScore")) || undefined,
      testDate: String(form.get("testDate")),
      studyHoursPerWeek: Number(form.get("studyHoursPerWeek")),
    });

    const userId = await getCurrentSupabaseUserId();
    if (userId) {
      try {
        await saveProfileRemote({ ...profile, userId });
      } catch {
        // Keep the local settings update even if remote sync is unavailable.
      }
    }

    setSaved(true);
  }

  async function seedQuestions() {
    setSeedStatus("Seeding questions...");
    const response = await fetch("/api/seed-questions", { method: "POST" });
    const data = (await response.json().catch(() => ({}))) as { inserted?: number; error?: string };
    setSeedStatus(response.ok ? `Seeded ${data.inserted ?? 0} questions.` : data.error ?? "Could not seed questions.");
  }

  return (
    <AppShell>
      <PageHeader eyebrow="Settings" title="ACT profile settings" description="Update the profile fields used by your study dashboard." />
      {syncStatus === "remote" ? <p className="mb-4 text-sm text-foreground/60">Synced with your account.</p> : null}
      {syncStatus === "error" ? <p className="mb-4 text-sm text-warn">Using local settings. Remote sync is unavailable.</p> : null}
      <form onSubmit={submit} className="grid max-w-2xl gap-5 rounded-lg border border-border bg-surface p-5">
        <label className="text-sm font-medium">
          Exam
          <input className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2" value="ACT" disabled />
        </label>
        <label className="text-sm font-medium">
          Target score
          <input name="targetScore" type="number" min="1" max="36" required defaultValue={profile?.targetScore ?? 30} className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2" />
        </label>
        <label className="text-sm font-medium">
          Current score
          <input name="currentScore" type="number" min="1" max="36" defaultValue={profile?.currentScore ?? ""} className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2" />
        </label>
        <label className="text-sm font-medium">
          Test date
          <input name="testDate" type="date" required defaultValue={profile?.testDate ?? "2026-09-12"} className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2" />
        </label>
        <label className="text-sm font-medium">
          Study hours per week
          <input name="studyHoursPerWeek" type="number" min="1" required defaultValue={profile?.studyHoursPerWeek ?? 6} className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2" />
        </label>
        <button className="min-h-11 rounded-md bg-accent px-5 py-2.5 font-medium text-accent-foreground hover:bg-accent/90">Save settings</button>
        {saved ? <p className="text-sm font-medium text-success">Settings saved.</p> : null}
      </form>
      <section className="mt-6 max-w-2xl rounded-lg border border-border bg-surface p-5">
        <h2 className="text-xl font-semibold">Question bank setup</h2>
        <p className="mt-2 text-sm leading-6 text-foreground/65">
          Seed the original ACT-style question bank into Supabase after applying the schema and configuring server credentials.
        </p>
        <button
          className="mt-4 min-h-11 rounded-md border border-border px-5 py-2.5 font-medium hover:border-accent hover:text-accent"
          onClick={seedQuestions}
          type="button"
        >
          Seed ACT questions
        </button>
        {seedStatus ? <p className="mt-3 text-sm text-foreground/70">{seedStatus}</p> : null}
      </section>
    </AppShell>
  );
}
