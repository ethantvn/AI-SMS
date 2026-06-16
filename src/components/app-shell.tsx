import Link from "next/link";
import { AuthStatus } from "./auth-status";

const nav = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/diagnostic", label: "Diagnostic" },
  { href: "/practice", label: "Practice" },
  { href: "/mistakes", label: "Mistakes" },
  { href: "/topics", label: "Topics" },
  { href: "/settings", label: "Settings" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-4 md:flex-row md:items-center md:justify-between">
          <Link href="/" className="text-lg font-semibold">
            MistakeLab ACT
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <nav className="flex flex-wrap gap-2 text-sm">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-md border border-border px-3 py-2 hover:border-accent hover:text-accent"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <AuthStatus />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl px-5 py-8">{children}</main>
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-8 max-w-3xl">
      {eyebrow ? <p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-accent">{eyebrow}</p> : null}
      <h1 className="text-3xl font-semibold text-foreground md:text-4xl">{title}</h1>
      {description ? <p className="mt-3 text-base leading-7 text-foreground/70">{description}</p> : null}
    </div>
  );
}

export function MetricCard({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-5">
      <p className="text-sm text-foreground/60">{label}</p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
      {detail ? <p className="mt-2 text-sm text-foreground/60">{detail}</p> : null}
    </div>
  );
}

export function PrimaryLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-11 items-center justify-center rounded-md bg-accent px-5 py-2.5 font-medium text-accent-foreground hover:bg-accent/90"
    >
      {children}
    </Link>
  );
}

export function SecondaryLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-11 items-center justify-center rounded-md border border-border bg-surface px-5 py-2.5 font-medium hover:border-accent hover:text-accent"
    >
      {children}
    </Link>
  );
}
