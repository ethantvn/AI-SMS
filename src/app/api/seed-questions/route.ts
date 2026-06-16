import { questions } from "@/lib/questions";
import { getSupabaseServerClient } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const seedToken = process.env.SEED_TOKEN;
  if (seedToken && request.headers.get("x-seed-token") !== seedToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase server credentials are not configured." }, { status: 400 });
  }

  const rows = questions.map((question) => ({
    id: question.id,
    exam: question.exam,
    section: question.section,
    topic: question.topic,
    subtopic: question.subtopic,
    difficulty: question.difficulty,
    question_text: question.questionText,
    choice_a: question.choices.A,
    choice_b: question.choices.B,
    choice_c: question.choices.C,
    choice_d: question.choices.D,
    correct_answer: question.correctAnswer,
    explanation: question.explanation,
    created_at: question.createdAt,
  }));

  const { error } = await supabase.from("questions").upsert(rows, { onConflict: "id" });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ inserted: rows.length });
}
