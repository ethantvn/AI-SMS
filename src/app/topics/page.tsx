import { AppShell, PageHeader, SecondaryLink } from "@/components/app-shell";
import { questions } from "@/lib/questions";

export default function TopicsPage() {
  const groups = questions.reduce(
    (items, question) => {
      const key = `${question.section}|${question.topic}|${question.subtopic}`;
      items[key] = [...(items[key] ?? []), question];
      return items;
    },
    {} as Record<string, typeof questions>,
  );

  return (
    <AppShell>
      <PageHeader eyebrow="Topics" title="ACT topic map" description="Browse the tagged question bank by section, topic, subtopic, and difficulty." />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Object.entries(groups).map(([key, items]) => {
          const [section, topic, subtopic] = key.split("|");
          const difficulties = [...new Set(items.map((item) => item.difficulty))].join(", ");
          return (
            <article key={key} className="rounded-lg border border-border bg-surface p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-accent">{section}</p>
              <h2 className="mt-2 text-lg font-semibold">{topic}</h2>
              <p className="mt-1 text-foreground/70">{subtopic}</p>
              <p className="mt-3 text-sm text-foreground/60">{items.length} questions / {difficulties}</p>
              <div className="mt-4"><SecondaryLink href="/practice">Practice topic</SecondaryLink></div>
            </article>
          );
        })}
      </div>
    </AppShell>
  );
}
