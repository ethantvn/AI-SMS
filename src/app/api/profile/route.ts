import { getSupabaseServerClient } from "@/lib/supabase";
import { NextResponse } from "next/server";

type ProfilePayload = {
  id: string;
  userId: string;
  email?: string;
  name?: string;
  targetScore: number;
  currentScore?: number;
  testDate: string;
  studyHoursPerWeek: number;
};

export async function POST(request: Request) {
  const profile = (await request.json()) as ProfilePayload;
  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return NextResponse.json({ error: "Supabase server credentials are not configured." }, { status: 400 });
  }

  const { error: userError } = await supabase.from("users").upsert(
    {
      id: profile.userId,
      email: profile.email ?? `${profile.userId}@local.user`,
      name: profile.name ?? null,
    },
    { onConflict: "id" },
  );

  if (userError) {
    return NextResponse.json({ error: userError.message }, { status: 500 });
  }

  const { error: profileError } = await supabase.from("user_profiles").upsert(
    {
      id: profile.id,
      user_id: profile.userId,
      exam: "ACT",
      target_score: profile.targetScore,
      current_score: profile.currentScore ?? null,
      test_date: profile.testDate,
      study_hours_per_week: profile.studyHoursPerWeek,
    },
    { onConflict: "id" },
  );

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
