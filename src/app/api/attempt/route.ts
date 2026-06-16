import { getSupabaseServerClient } from "@/lib/supabase";
import { NextResponse } from "next/server";

type AttemptPayload = {
  attempt: {
    id: string;
    userId: string;
    questionId: string;
    selectedAnswer: "A" | "B" | "C" | "D";
    isCorrect: boolean;
    timeSpentSeconds: number;
    createdAt: string;
  };
  mistake?: {
    id: string;
    userId: string;
    questionId: string;
    attemptId: string;
    mistakeType: string;
    aiExplanation: string;
    createdAt: string;
  };
};

export async function POST(request: Request) {
  const payload = (await request.json()) as AttemptPayload;
  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return NextResponse.json({ error: "Supabase server credentials are not configured." }, { status: 400 });
  }

  const { error: userError } = await supabase.from("users").upsert(
    {
      id: payload.attempt.userId,
      email: `${payload.attempt.userId}@local.user`,
      name: null,
    },
    { onConflict: "id" },
  );

  if (userError) {
    return NextResponse.json({ error: userError.message }, { status: 500 });
  }

  const { error: attemptError } = await supabase.from("attempts").upsert(
    {
      id: payload.attempt.id,
      user_id: payload.attempt.userId,
      question_id: payload.attempt.questionId,
      selected_answer: payload.attempt.selectedAnswer,
      is_correct: payload.attempt.isCorrect,
      time_spent_seconds: payload.attempt.timeSpentSeconds,
      created_at: payload.attempt.createdAt,
    },
    { onConflict: "id" },
  );

  if (attemptError) {
    return NextResponse.json({ error: attemptError.message }, { status: 500 });
  }

  if (payload.mistake) {
    const { error: mistakeError } = await supabase.from("mistakes").upsert(
      {
        id: payload.mistake.id,
        user_id: payload.mistake.userId,
        question_id: payload.mistake.questionId,
        attempt_id: payload.mistake.attemptId,
        mistake_type: payload.mistake.mistakeType,
        ai_explanation: payload.mistake.aiExplanation,
        created_at: payload.mistake.createdAt,
      },
      { onConflict: "id" },
    );

    if (mistakeError) {
      return NextResponse.json({ error: mistakeError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
