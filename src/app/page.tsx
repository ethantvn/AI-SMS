import { PrimaryLink, SecondaryLink } from "@/components/app-shell";

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <section className="mx-auto grid min-h-[88vh] max-w-7xl items-center gap-10 px-5 py-12 lg:grid-cols-[1fr_0.9fr]">
        <div>
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-accent">ACT prep MVP</p>
          <h1 className="max-w-4xl text-5xl font-semibold leading-[1.02] text-foreground md:text-7xl">
            AI test prep built around your mistakes.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-foreground/70">
            Take a diagnostic, see your weak areas, practice targeted questions, and get AI explanations for every
            mistake.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <PrimaryLink href="/signup">Start ACT Diagnostic</PrimaryLink>
            <SecondaryLink href="/login">Log in</SecondaryLink>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-surface p-5 shadow-sm">
          <div className="grid gap-3">
            {[
              ["Diagnostic", "24 ACT-style questions"],
              ["Weakness map", "Topics ranked by missed patterns"],
              ["AI tutor", "Short explanations after every miss"],
              ["Mistake journal", "Review repeated error types"],
            ].map(([title, detail]) => (
              <div key={title} className="rounded-md border border-border bg-background p-4">
                <p className="font-semibold">{title}</p>
                <p className="mt-1 text-sm text-foreground/65">{detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
