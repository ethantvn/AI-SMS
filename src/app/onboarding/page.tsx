"use client";

import { AppShell, PageHeader } from "@/components/app-shell";
import { getCurrentSupabaseUserId, saveProfileRemote } from "@/lib/supabase-data";
import { saveProfile, setCurrentUserId } from "@/lib/storage";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function OnboardingPage() {
  const router = useRouter();
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    try {
      const form = new FormData(event.currentTarget);
      const remoteUserId = await getCurrentSupabaseUserId();
      if (remoteUserId) setCurrentUserId(remoteUserId);

      const profile = saveProfile({
        targetScore: Number(form.get("targetScore")),
        currentScore: Number(form.get("currentScore")) || undefined,
        testDate: String(form.get("testDate")),
        studyHoursPerWeek: Number(form.get("studyHoursPerWeek")),
      });

      if (remoteUserId) {
        await saveProfileRemote(profile);
      }

      router.push("/diagnostic");
    } catch (profileError) {
      setError(profileError instanceof Error ? profileError.message : "Could not save profile.");
    }
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Onboarding"
        title="Set your ACT target"
        description="Your profile keeps recommendations focused on the score you want and the time you have."
      />
      <form onSubmit={submit} className="grid max-w-2xl gap-5 rounded-lg border border-border bg-surface p-5">
        <div>
          <label className="text-sm font-medium" htmlFor="exam">
            Exam
          </label>
          <select id="exam" className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2" disabled>
            <option>ACT</option>
          </select>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <Field name="targetScore" label="Target score" type="number" defaultValue="30" min="1" max="36" required />
          <Field name="currentScore" label="Current score, optional" type="number" defaultValue="24" min="1" max="36" />
          <Field name="testDate" label="Test date" type="date" defaultValue="2026-09-12" required />
          <Field name="studyHoursPerWeek" label="Study hours per week" type="number" defaultValue="6" min="1" required />
        </div>
        <button type="submit" className="min-h-11 rounded-md bg-accent px-5 py-2.5 font-medium text-accent-foreground hover:bg-accent/90">
          Save profile and start diagnostic
        </button>
        {error ? <p className="rounded-md border border-warn bg-background p-3 text-sm text-warn">{error}</p> : null}
      </form>
    </AppShell>
  );
}

function Field(props: React.InputHTMLAttributes<HTMLInputElement> & { label: string; name: string }) {
  const { label, name, ...inputProps } = props;
  return (
    <div>
      <label className="text-sm font-medium" htmlFor={name}>
        {label}
      </label>
      <input id={name} name={name} className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2" {...inputProps} />
    </div>
  );
}
