"use client";

import { AppShell, MetricCard, PageHeader, PrimaryLink, SecondaryLink } from "@/components/app-shell";
import { questions } from "@/lib/questions";
import { buildRecommendations, getPerformanceSummary, readProfile } from "@/lib/storage";
import { useStudyStateSync } from "@/lib/use-study-state-sync";

export default function DashboardPage() {
  const { ready, syncStatus } = useStudyStateSync();
  if (!ready) return null;

  const profile = readProfile();
  const summary = getPerformanceSummary();
  const recommendations = buildRecommendations();
  const estimatedScore = summary.completed ? Math.max(1, Math.min(36, Math.round(summary.accuracy / 3.2))) : profile?.currentScore;

  return (
    <AppShell>
      <PageHeader
        eyebrow="Dashboard"
        title="Today’s ACT study plan"
        description="Recommendations prioritize low accuracy, repeated misses, older practice gaps, and medium questions before hard ones."
      />
      {syncStatus === "remote" ? <p className="mb-4 text-sm text-foreground/60">Synced with your account.</p> : null}
      {syncStatus === "error" ? <p className="mb-4 text-sm text-warn">Using local study data. Remote sync is unavailable.</p> : null}
      {!profile ? (
        <div className="mb-6 rounded-lg border border-warn bg-surface p-5">
          <p className="font-medium">Finish onboarding to personalize your dashboard.</p>
          <div className="mt-4"><PrimaryLink href="/onboarding">Set ACT profile</PrimaryLink></div>
        </div>
      ) : null}
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Target score" value={profile?.targetScore ? String(profile.targetScore) : "-"} />
        <MetricCard label="Estimated current" value={estimatedScore ? String(estimatedScore) : "-"} />
        <MetricCard label="Questions completed" value={String(summary.completed)} />
        <MetricCard label="Accuracy" value={`${summary.accuracy}%`} />
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_0.8fr]">
        <section className="rounded-lg border border-border bg-surface p-5">
          <h2 className="text-xl font-semibold">Recommended practice for today</h2>
          <div className="mt-4 grid gap-3">
            {recommendations.slice(0, 5).map((rec) => (
              <div key={rec.id} className="rounded-md border border-border bg-background p-4">
                <p className="font-medium">
                  ACT {rec.topic}: {rec.subtopic}
                </p>
                <p className="mt-1 text-sm text-foreground/65">{rec.reason}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <PrimaryLink href="/practice">Start practice</PrimaryLink>
            <SecondaryLink href="/mistakes">Review missed questions</SecondaryLink>
          </div>
        </section>
        <section className="rounded-lg border border-border bg-surface p-5">
          <h2 className="text-xl font-semibold">Weakest topics</h2>
          <div className="mt-4 grid gap-3">
            {summary.weakest.length ? summary.weakest.map((topic) => (
              <div key={`${topic.topic}-${topic.subtopic}`} className="rounded-md border border-border bg-background p-4">
                <p className="font-medium">{topic.topic}: {topic.subtopic}</p>
                <p className="mt-1 text-sm text-foreground/65">{topic.accuracy}% accuracy</p>
              </div>
            )) : (
              <p className="text-foreground/65">Take the diagnostic or answer practice questions to find weak areas across {questions.length} ACT-style questions.</p>
            )}
          </div>
          <p className="mt-5 text-sm text-foreground/65">Most common mistake type: <span className="font-medium text-foreground">{summary.commonMistakeType}</span></p>
        </section>
      </div>
    </AppShell>
  );
}
