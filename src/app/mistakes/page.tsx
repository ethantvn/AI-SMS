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
        eyebrow="Mistake journal"
        title="Review every missed question"
        description="Track selected answers, correct answers, topics, mistake types, AI explanations, and dates missed."
      />
      {syncStatus === "remote" ? <p className="mb-4 text-sm text-foreground/60">Synced with your account.</p> : null}
      {syncStatus === "error" ? <p className="mb-4 text-sm text-warn">Using local mistake data. Remote sync is unavailable.</p> : null}
      <div className="grid gap-4">
        {mistakes.length ? mistakes.map((mistake) => {
          const question = getQuestion(mistake.questionId);
          const attempt = attempts.find((item) => item.id === mistake.attemptId);
          if (!question) return null;
          const similarQuestions = getSimilarQuestions(question.id, 3);
          return (
            <article key={mistake.id} className="rounded-lg border border-border bg-surface p-5">
              <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-accent">
                <span>{question.section}</span>
                <span>{question.topic}</span>
                <span>{mistake.mistakeType}</span>
                <span>{new Date(mistake.createdAt).toLocaleDateString()}</span>
              </div>
              <h2 className="mt-3 font-semibold">{question.questionText}</h2>
              <p className="mt-2 text-sm text-foreground/65">
                Selected answer: {attempt?.selectedAnswer ?? "unknown"} / Correct answer: {question.correctAnswer}
              </p>
              <pre className="mt-4 whitespace-pre-wrap rounded-md border border-border bg-background p-4 font-sans text-sm leading-6 text-foreground/75">
                {mistake.aiExplanation}
              </pre>
              <div className="mt-4">
                <SecondaryLink href={`/practice/${question.id}`}>Retry similar question</SecondaryLink>
              </div>
              {similarQuestions.length ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {similarQuestions.map((similarQuestion) => (
                    <SecondaryLink key={similarQuestion.id} href={`/practice/${similarQuestion.id}`}>
                      {practiceQuestionLabel(similarQuestion)}
                    </SecondaryLink>
                  ))}
                </div>
              ) : null}
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
