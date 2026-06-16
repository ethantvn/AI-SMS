import { getQuestion, getSimilarQuestions, questions } from "@/lib/questions";
import { NextResponse } from "next/server";

type ExplainRequest = {
  questionText: string;
  questionId?: string;
  choices: Record<string, string>;
  correctAnswer: string;
  selectedAnswer: string;
  topic: string;
  subtopic: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as ExplainRequest;
  const similarQuestionIds = getSimilarQuestionIds(body);

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({
      explanation: buildFallbackExplanation(body, similarQuestionIds),
      similarQuestionIds,
      source: "fallback",
    });
  }

  const prompt = `You are an ACT tutor.

The student answered a question incorrectly.

Question:
${body.questionText}

Choices:
A. ${body.choices.A}
B. ${body.choices.B}
C. ${body.choices.C}
D. ${body.choices.D}

Correct Answer:
${body.correctAnswer}

Student Answer:
${body.selectedAnswer}

Topic:
${body.topic}

Subtopic:
${body.subtopic}

Explain:
1. Why the correct answer is right.
2. Why the student's answer is wrong.
3. What concept the student should review.
4. One short tip for next time.
5. Recommend 2-3 similar practice questions by saying "Similar practice:" followed by short labels, not full new questions.

Keep the explanation short, clear, and encouraging.`;

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL ?? "gpt-5.4-mini",
        input: prompt,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI request failed with ${response.status}`);
    }

    const data = (await response.json()) as { output_text?: string; output?: Array<{ content?: Array<{ text?: string }> }> };
    const explanation =
      data.output_text ??
      data.output?.flatMap((item) => item.content?.map((content) => content.text).filter(Boolean) ?? []).join("\n") ??
      "";

    return NextResponse.json({ explanation, similarQuestionIds, source: "openai" });
  } catch {
    return NextResponse.json({
      explanation: buildFallbackExplanation(body, similarQuestionIds),
      similarQuestionIds,
      source: "fallback",
    });
  }
}

function getSimilarQuestionIds(body: ExplainRequest) {
  if (body.questionId && getQuestion(body.questionId)) {
    return getSimilarQuestions(body.questionId, 3).map((question) => question.id);
  }

  const matchingQuestion = questions.find(
    (question) => question.topic === body.topic && question.subtopic === body.subtopic,
  );

  if (!matchingQuestion) return [];
  return getSimilarQuestions(matchingQuestion.id, 3).map((question) => question.id);
}

function buildFallbackExplanation(body: ExplainRequest, similarQuestionIds: string[]) {
  const similarLabels = similarQuestionIds
    .map((id) => getQuestion(id))
    .filter(Boolean)
    .map((question) => `${question!.topic}: ${question!.subtopic}`);

  return [
    `The correct answer is ${body.correctAnswer}; review the setup carefully before choosing.`,
    `Your answer, ${body.selectedAnswer}, does not match the key concept for ${body.subtopic}.`,
    `Concept to review: ${body.topic} / ${body.subtopic}.`,
    "Tip: underline the exact task, eliminate mismatches, then calculate or infer.",
    similarLabels.length ? `Similar practice: ${similarLabels.join("; ")}.` : "Similar practice: try another question from this topic.",
  ].join("\n");
}
