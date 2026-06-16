"use client";

import { AppShell, MetricCard, PageHeader, PrimaryLink } from "@/components/app-shell";
import { diagnosticQuestions } from "@/lib/questions";
import { getCurrentSupabaseUserId, saveAttemptRemote } from "@/lib/supabase-data";
import { buildPerformanceSummary, readMistakes, saveAttempt, setCurrentUserId } from "@/lib/storage";
import type { Attempt, Mistake } from "@/lib/types";
import { FormEvent, useEffect, useRef, useState } from "react";

export default function DiagnosticPage() {
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: diagnosticQuestions.length });
  const [diagnosticAttempts, setDiagnosticAttempts] = useState<Attempt[]>([]);
  const [diagnosticMistakes, setDiagnosticMistakes] = useState<Mistake[]>([]);
  const startedAt = useRef(0);
  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const remoteUserId = await getCurrentSupabaseUserId();
    if (remoteUserId) setCurrentUserId(remoteUserId);

    let correct = 0;
    const currentAttempts: Attempt[] = [];
    const currentMistakes: Mistake[] = [];
    for (const question of diagnosticQuestions) {
      const selected = form.get(question.id) as Attempt["selectedAnswer"] | null;
      if (!selected) continue;
      const elapsed = startedAt.current ? Date.now() - startedAt.current : 0;
      const attempt = saveAttempt(question, selected, Math.round(elapsed / 1000 / diagnosticQuestions.length));
      currentAttempts.push(attempt);
      correct += attempt.isCorrect ? 1 : 0;
      const mistake = readMistakes().find((item) => item.attemptId === attempt.id);
      if (mistake) currentMistakes.push(mistake);

      if (remoteUserId) {
        try {
          await saveAttemptRemote(attempt, question, mistake);
        } catch {
          // Local results remain available if remote persistence is not ready yet.
        }
      }
    }
    setScore({ correct, total: diagnosticQuestions.length });
    setDiagnosticAttempts(currentAttempts);
    setDiagnosticMistakes(currentMistakes);
    setSubmitted(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (submitted) {
    const summary = buildPerformanceSummary(diagnosticAttempts, diagnosticMistakes);
    const percent = Math.round((score.correct / score.total) * 100);
    const estimatedLow = Math.max(1, Math.round(percent / 3.2) - 2);
    const estimatedHigh = Math.min(36, estimatedLow + 4);

    return (
      <AppShell>
        <PageHeader eyebrow="Results" title="Your diagnostic is complete" description="Use this baseline to start targeted practice." />
        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard label="Estimated ACT range" value={`${estimatedLow}-${estimatedHigh}`} detail={`${score.correct}/${score.total} correct`} />
          <MetricCard label="Diagnostic accuracy" value={`${percent}%`} />
          <MetricCard label="Most common mistake" value={summary.commonMistakeType} />
        </div>
        <section className="mt-8 rounded-lg border border-border bg-surface p-5">
          <h2 className="text-xl font-semibold">Recommended next study focus</h2>
          <p className="mt-2 text-sm text-foreground/65">
            Based only on the {score.total} questions from this diagnostic.
          </p>
          <div className="mt-4 grid gap-3">
            {summary.weakest.slice(0, 4).map((item) => (
              <div key={`${item.topic}-${item.subtopic}`} className="rounded-md border border-border bg-background p-4">
                <p className="font-medium">
                  ACT {item.topic}: {item.subtopic}
                </p>
                <p className="mt-1 text-sm text-foreground/65">
                  {item.accuracy}% accuracy on this diagnostic, {item.misses}/{item.total} missed
                </p>
              </div>
            ))}
          </div>
          <div className="mt-5">
            <PrimaryLink href="/practice">Practice recommended questions</PrimaryLink>
          </div>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="ACT diagnostic"
        title="Answer 24 short questions"
        description="This MVP diagnostic is untimed by default and tags every answer by section, topic, subtopic, and difficulty."
      />
      <form onSubmit={submit} className="grid gap-5">
        {diagnosticQuestions.map((question, index) => (
          <fieldset key={question.id} className="rounded-lg border border-border bg-surface p-5">
            <legend className="text-sm font-semibold text-accent">
              {index + 1}. {question.section} / {question.subtopic} / {question.difficulty}
            </legend>
            <p className="mt-3 text-lg font-medium">{question.questionText}</p>
            <div className="mt-4 grid gap-2">
              {Object.entries(question.choices).map(([letter, choice]) => (
                <label key={letter} className="flex gap-3 rounded-md border border-border bg-background p-3">
                  <input type="radio" name={question.id} value={letter} required />
                  <span>
                    <span className="font-semibold">{letter}.</span> {choice}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        ))}
        <button className="min-h-12 rounded-md bg-accent px-5 py-3 font-semibold text-accent-foreground hover:bg-accent/90">
          Submit diagnostic
        </button>
      </form>
    </AppShell>
  );
}
