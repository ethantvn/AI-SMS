"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase";
import Link from "next/link";
import { useEffect, useState } from "react";

export function AuthStatus() {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user.email ?? null);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  async function signOut() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    await supabase.auth.signOut();
    setEmail(null);
  }

  if (!email) {
    return (
      <Link className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-foreground" href="/login">
        Log in
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="max-w-48 truncate text-foreground/65">{email}</span>
      <button className="rounded-md border border-border px-3 py-2 hover:border-accent hover:text-accent" onClick={signOut}>
        Sign out
      </button>
    </div>
  );
}
