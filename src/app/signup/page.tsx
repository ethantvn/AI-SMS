"use client";

import { PageHeader, SecondaryLink } from "@/components/app-shell";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { setCurrentUserId } from "@/lib/storage";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function SignupPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setStatus("");

    const form = new FormData(event.currentTarget);
    const name = String(form.get("name"));
    const email = String(form.get("email"));
    const password = String(form.get("password"));
    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      setCurrentUserId("00000000-0000-4000-8000-000000000000");
      router.push("/onboarding");
      return;
    }

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    if (data.user) setCurrentUserId(data.user.id);

    if (!data.session) {
      setStatus("Account created. Check your email if confirmation is enabled, then log in.");
      return;
    }

    router.push("/onboarding");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-5">
      <PageHeader title="Create your ACT prep account" description="Start with ACT, then personalize your target score and study plan." />
      <form onSubmit={submit} className="rounded-lg border border-border bg-surface p-5">
        <label className="block text-sm font-medium" htmlFor="name">
          Name
        </label>
        <input
          id="name"
          name="name"
          className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2"
          placeholder="Alex Student"
          required
        />
        <label className="mt-4 block text-sm font-medium" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          name="email"
          className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2"
          placeholder="student@example.com"
          type="email"
          required
        />
        <label className="mt-4 block text-sm font-medium" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          name="password"
          className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2"
          placeholder="Create a password"
          minLength={6}
          type="password"
          required
        />
        {error ? <p className="mt-4 rounded-md border border-warn bg-background p-3 text-sm text-warn">{error}</p> : null}
        {status ? <p className="mt-4 rounded-md border border-border bg-background p-3 text-sm text-foreground/70">{status}</p> : null}
        <div className="mt-5 flex flex-wrap gap-3">
          <button className="inline-flex min-h-11 items-center justify-center rounded-md bg-accent px-5 py-2.5 font-medium text-accent-foreground hover:bg-accent/90">
            Create account
          </button>
          <SecondaryLink href="/login">Log in instead</SecondaryLink>
        </div>
      </form>
    </main>
  );
}
