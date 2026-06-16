# MistakeLab ACT

AI test prep built around student mistakes. This MVP focuses on ACT diagnostic testing, targeted practice, short AI explanations, a mistake journal, and adaptive dashboard recommendations.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase Auth and Postgres
- OpenAI Responses API through `/api/explain`

## Local Development

```bash
npm install
npm run dev
```

Open http://localhost:3000.

The app works without environment variables using local demo persistence. Supabase and OpenAI activate when the matching env vars are configured.

## Environment

Create `.env.local` from `.env.example`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-jwt
SUPABASE_SECRET_KEY=your-server-only-secret-key
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-5.4-mini
SEED_TOKEN=change-me-for-production
```

Keep `SUPABASE_SECRET_KEY`, `OPENAI_API_KEY`, and `SEED_TOKEN` server-only.

## Supabase Setup

1. Open the Supabase SQL editor.
2. Run [supabase/schema.sql](supabase/schema.sql).
3. Start the dev server with `.env.local` configured.
4. Seed questions from the app Settings page or with:

```bash
npm run seed:questions
```

The seed command posts to `http://localhost:3000/api/seed-questions`. Set `SEED_BASE_URL` to target another deployment.

## MVP Flow

- `/signup` and `/login`: account flow through Supabase when configured, demo fallback otherwise.
- `/onboarding`: saves ACT profile fields.
- `/diagnostic`: records a 24-question baseline and returns weak-topic guidance.
- `/practice`: filters questions by recommendation, topic, and difficulty.
- `/practice/[questionId]`: records attempts, captures mistake type, and requests an AI explanation.
- `/mistakes`: shows missed questions, selected/correct answers, topics, mistake types, explanations, and dates.
- `/dashboard`: summarizes target score, estimated score, attempts, accuracy, weak topics, mistake patterns, and next practice.

## Verification

```bash
npm run lint
npm run build
```
