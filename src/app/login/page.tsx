"use client";

import { PageHeader, SecondaryLink } from "@/components/app-shell";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { setCurrentUserId } from "@/lib/storage";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email"));
    const password = String(form.get("password"));
    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      setCurrentUserId("00000000-0000-4000-8000-000000000000");
      router.push("/dashboard");
      return;
    }

    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      setError(signInError.message);
      return;
    }

    if (data.user) setCurrentUserId(data.user.id);
    router.push("/dashboard");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-5">
      <PageHeader title="Welcome back" description="Log in to continue your ACT diagnostic, practice, and mistake journal." />
      <form onSubmit={submit} className="rounded-lg border border-border bg-surface p-5">
        <label className="block text-sm font-medium" htmlFor="email">
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
          placeholder="Enter your password"
          type="password"
          required
        />
        {error ? <p className="mt-4 rounded-md border border-warn bg-background p-3 text-sm text-warn">{error}</p> : null}
        <div className="mt-5 flex flex-wrap gap-3">
          <button className="inline-flex min-h-11 items-center justify-center rounded-md bg-accent px-5 py-2.5 font-medium text-accent-foreground hover:bg-accent/90">
            Log in
          </button>
          <SecondaryLink href="/signup">Create account</SecondaryLink>
        </div>
      </form>
    </main>
  );
}
