"use client";

import { AppShell, PageHeader, SecondaryLink } from "@/components/app-shell";
import { questions } from "@/lib/questions";
import { buildRecommendations } from "@/lib/storage";
import { Difficulty, Section } from "@/lib/types";
import { useMemo, useState } from "react";

const allSections = ["All", "Math", "English", "Reading", "Science"] as const;
const allDifficulties = ["All", "easy", "medium", "hard"] as const;

export default function PracticePage() {
  const [section, setSection] = useState<(typeof allSections)[number]>("All");
  const [difficulty, setDifficulty] = useState<(typeof allDifficulties)[number]>("All");
  const recommendations = buildRecommendations();
  const recommendedKeys = new Set(recommendations.map((rec) => `${rec.topic}-${rec.subtopic}`));

  const filtered = useMemo(
    () =>
      questions.filter((question) => {
        const sectionMatch = section === "All" || question.section === section;
        const difficultyMatch = difficulty === "All" || question.difficulty === difficulty;
        return sectionMatch && difficultyMatch;
      }),
    [section, difficulty],
  );

  const sorted = [...filtered].sort((a, b) => {
    const aRec = recommendedKeys.has(`${a.topic}-${a.subtopic}`) ? 0 : 1;
    const bRec = recommendedKeys.has(`${b.topic}-${b.subtopic}`) ? 0 : 1;
    const difficultyOrder = { easy: 1, medium: 0, hard: 2 };
    return aRec - bRec || difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
  });

  return (
    <AppShell>
      <PageHeader
        eyebrow="Practice"
        title="Choose targeted ACT questions"
        description="Practice by recommendation, topic, and difficulty. Medium questions surface before hard ones."
      />
      <div className="mb-6 flex flex-wrap gap-3 rounded-lg border border-border bg-surface p-4">
        <Select label="Section" value={section} options={allSections} onChange={(value) => setSection(value as Section | "All")} />
        <Select label="Difficulty" value={difficulty} options={allDifficulties} onChange={(value) => setDifficulty(value as Difficulty | "All")} />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {sorted.map((question) => {
          const recommended = recommendedKeys.has(`${question.topic}-${question.subtopic}`);
          return (
            <article key={question.id} className="rounded-lg border border-border bg-surface p-5">
              <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-accent">
                <span>{question.section}</span>
                <span>{question.difficulty}</span>
                {recommended ? <span>Recommended</span> : null}
              </div>
              <h2 className="mt-3 font-semibold">{question.topic}: {question.subtopic}</h2>
              <p className="mt-2 line-clamp-3 text-sm leading-6 text-foreground/70">{question.questionText}</p>
              <div className="mt-4">
                <SecondaryLink href={`/practice/${question.id}`}>Answer question</SecondaryLink>
              </div>
            </article>
          );
        })}
      </div>
    </AppShell>
  );
}

function Select<T extends readonly string[]>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: T;
  onChange: (value: T[number]) => void;
}) {
  return (
    <label className="text-sm font-medium">
      {label}
      <select className="ml-2 rounded-md border border-border bg-background px-3 py-2" value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => <option key={option}>{option}</option>)}
      </select>
    </label>
  );
}
