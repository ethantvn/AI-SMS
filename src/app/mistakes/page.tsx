"use client";

import { AppShell, PageHeader, SecondaryLink } from "@/components/app-shell";
import { getQuestion, getSimilarQuestions, practiceQuestionLabel } from "@/lib/questions";
import { readAttempts, readMistakes } from "@/lib/storage";
import { useStudyStateSync } from "@/lib/use-study-state-sync";

export default function MistakesPage() {
  const { ready, syncStatus } = useStudyStateSync();
  if (!ready) return null;

  const mistakes = readMistakes();
  const attempts = readAttempts();

  return (
    <AppShell>
      <PageHeader
        eyebrow="Correction queue"
        title="Fix one weak spot at a time"
        description="See the topic, review the miss, then answer a fresh similar question."
      />
      {syncStatus === "remote" ? <p className="mb-4 text-sm text-foreground/60">Synced with your account.</p> : null}
      {syncStatus === "error" ? <p className="mb-4 text-sm text-warn">Using local mistake data. Remote sync is unavailable.</p> : null}
      <div className="grid gap-4">
        {mistakes.length ? mistakes.map((mistake) => {
          const question = getQuestion(mistake.questionId);
          const attempt = attempts.find((item) => item.id === mistake.attemptId);
          if (!question) return null;
          const similarQuestion = getSimilarQuestions(question.id, 1)[0];
          const correctionHref = similarQuestion ? `/practice/${similarQuestion.id}` : `/practice/${question.id}`;
          return (
            <article key={mistake.id} className="rounded-lg border border-border bg-surface p-5">
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-accent">
                <span>{question.section}</span>
                <span>{question.topic}</span>
                <span>{question.subtopic}</span>
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-[1fr_auto] md:items-start">
                <div>
                  <p className="text-sm font-medium text-foreground/65">Topic to correct</p>
                  <h2 className="mt-1 text-xl font-semibold">{question.topic}: {question.subtopic}</h2>
                </div>
                <div className="rounded-md border border-border bg-background px-4 py-3 text-sm">
                  <p className="text-foreground/60">Your answer</p>
                  <p className="mt-1 font-semibold">
                    {attempt?.selectedAnswer ?? "unknown"} <span className="text-foreground/40">→</span> {question.correctAnswer}
                  </p>
                </div>
              </div>
              <details className="mt-4 rounded-md border border-border bg-background p-4">
                <summary className="cursor-pointer font-medium">See the missed question</summary>
                <p className="mt-3 text-sm leading-6 text-foreground/70">{question.questionText}</p>
              </details>
              <pre className="mt-4 whitespace-pre-wrap rounded-md border border-border bg-background p-4 font-sans text-sm leading-6 text-foreground/75">
                {mistake.aiExplanation}
              </pre>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <SecondaryLink href={correctionHref}>Correct this topic</SecondaryLink>
                {similarQuestion ? (
                  <p className="text-sm text-foreground/60">Next question: {practiceQuestionLabel(similarQuestion)}</p>
                ) : (
                  <p className="text-sm text-foreground/60">No fresh variant available, so this reopens the original.</p>
                )}
              </div>
            </article>
          );
        }) : (
          <div className="rounded-lg border border-border bg-surface p-5">
            <p className="text-foreground/70">No missed questions yet. Take the diagnostic or answer practice questions to start your journal.</p>
            <div className="mt-4"><SecondaryLink href="/diagnostic">Take diagnostic</SecondaryLink></div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
