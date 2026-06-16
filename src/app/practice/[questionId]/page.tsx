"use client";

import { AppShell, PageHeader, PrimaryLink, SecondaryLink } from "@/components/app-shell";
import { getQuestion } from "@/lib/questions";
import { getCurrentSupabaseUserId, saveAttemptRemote } from "@/lib/supabase-data";
import { buildTutorExplanation, readMistakes, saveAttempt, setCurrentUserId, updateMistakeExplanation } from "@/lib/storage";
import type { Attempt, MistakeType, TutorExplanation } from "@/lib/types";
import { notFound, useParams } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";

export default function QuestionPage() {
  const params = useParams<{ questionId: string }>();
  const question = getQuestion(params.questionId);
  const startedAt = useRef(0);
  const [result, setResult] = useState<{
    selected: Attempt["selectedAnswer"];
    isCorrect: boolean;
    explanation: string;
    similarQuestionIds: string[];
  } | null>(null);

  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  if (!question) notFound();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!question) return;
    const form = new FormData(event.currentTarget);
    const selected = form.get("answer") as Attempt["selectedAnswer"];
    const mistakeType = "concept gap" as MistakeType;
    const remoteUserId = await getCurrentSupabaseUserId();
    if (remoteUserId) setCurrentUserId(remoteUserId);

    const elapsed = startedAt.current ? Date.now() - startedAt.current : 0;
    const attempt = saveAttempt(question, selected, Math.round(elapsed / 1000), mistakeType);
    const mistake = readMistakes().find((item) => item.attemptId === attempt.id);
    let explanation = attempt.isCorrect ? question.explanation : buildTutorExplanation(question, selected);
    let similarQuestionIds: string[] = [];

    if (!attempt.isCorrect) {
      const response = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionText: question.questionText,
          questionId: question.id,
          choices: question.choices,
          correctAnswer: question.correctAnswer,
          selectedAnswer: selected,
          topic: question.topic,
          subtopic: question.subtopic,
        }),
      });
      const data = (await response.json()) as Partial<TutorExplanation>;
      explanation = data.explanation || explanation;
      similarQuestionIds = data.similarQuestionIds ?? [];
      updateMistakeExplanation(attempt.id, explanation);
    }

    if (remoteUserId) {
      try {
        const updatedMistake = readMistakes().find((item) => item.attemptId === attempt.id);
        await saveAttemptRemote(attempt, question, updatedMistake ?? mistake);
      } catch {
        // Local persistence already captured the attempt; remote sync can be retried later.
      }
    }

    setResult({
      selected,
      isCorrect: attempt.isCorrect,
      explanation,
      similarQuestionIds,
    });
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Correction practice"
        title={`${question.topic}: ${question.subtopic}`}
        description={`Work the weak topic first. This is a ${question.difficulty} ${question.section} question.`}
      />
      <form onSubmit={submit} className="rounded-lg border border-border bg-surface p-5">
        <div className="mb-4 rounded-md border border-border bg-background p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">Topic to work on</p>
          <p className="mt-1 font-semibold">{question.topic}: {question.subtopic}</p>
        </div>
        <p className="text-xl font-medium leading-8">{question.questionText}</p>
        <div className="mt-5 grid gap-3">
          {Object.entries(question.choices).map(([letter, choice]) => (
            <label key={letter} className="flex gap-3 rounded-md border border-border bg-background p-3">
              <input type="radio" name="answer" value={letter} required disabled={Boolean(result)} />
              <span><span className="font-semibold">{letter}.</span> {choice}</span>
            </label>
          ))}
        </div>
        {!result ? (
          <button className="mt-5 min-h-11 rounded-md bg-accent px-5 py-2.5 font-medium text-accent-foreground hover:bg-accent/90">
            Check answer
          </button>
        ) : null}
      </form>
      {result ? (
        <section className="mt-6 rounded-lg border border-border bg-surface p-5">
          <p className={`text-lg font-semibold ${result.isCorrect ? "text-success" : "text-warn"}`}>
            {result.isCorrect ? "Correct. That topic is getting stronger." : `Not quite. Correct answer: ${question.correctAnswer}`}
          </p>
          {!result.isCorrect ? (
            <div className="mt-3 rounded-md border border-border bg-background p-4">
              <p className="text-sm font-medium">Focus topic</p>
              <p className="mt-1 text-sm text-foreground/70">{question.topic}: {question.subtopic}</p>
            </div>
          ) : null}
          <pre className="mt-4 whitespace-pre-wrap rounded-md border border-border bg-background p-4 font-sans text-sm leading-6 text-foreground/75">
            {result.explanation}
          </pre>
          <div className="mt-5 flex flex-wrap gap-3">
            <PrimaryLink href="/mistakes">Back to correction queue</PrimaryLink>
            <SecondaryLink href="/practice">Browse practice</SecondaryLink>
          </div>
        </section>
      ) : null}
    </AppShell>
  );
}
