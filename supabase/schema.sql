create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  name text,
  created_at timestamptz not null default now()
);

create table if not exists public.user_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  exam text not null check (exam = 'ACT'),
  target_score integer not null check (target_score between 1 and 36),
  current_score integer check (current_score between 1 and 36),
  test_date date not null,
  study_hours_per_week integer not null check (study_hours_per_week > 0),
  created_at timestamptz not null default now()
);

create table if not exists public.questions (
  id text primary key,
  exam text not null check (exam = 'ACT'),
  section text not null check (section in ('Math', 'English', 'Reading', 'Science')),
  topic text not null,
  subtopic text not null,
  difficulty text not null check (difficulty in ('easy', 'medium', 'hard')),
  question_text text not null,
  choice_a text not null,
  choice_b text not null,
  choice_c text not null,
  choice_d text not null,
  correct_answer text not null check (correct_answer in ('A', 'B', 'C', 'D')),
  explanation text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  question_id text not null references public.questions(id) on delete cascade,
  selected_answer text not null check (selected_answer in ('A', 'B', 'C', 'D')),
  is_correct boolean not null,
  time_spent_seconds integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.mistakes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  question_id text not null references public.questions(id) on delete cascade,
  attempt_id uuid not null references public.attempts(id) on delete cascade,
  mistake_type text not null check (
    mistake_type in ('concept gap', 'careless mistake', 'timing issue', 'misread question', 'guessed', 'strategy issue')
  ),
  ai_explanation text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.study_recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  topic text not null,
  subtopic text not null,
  reason text not null,
  priority integer not null default 1,
  created_at timestamptz not null default now()
);

create index if not exists attempts_user_created_idx on public.attempts(user_id, created_at desc);
create index if not exists mistakes_user_created_idx on public.mistakes(user_id, created_at desc);
create index if not exists questions_exam_topic_idx on public.questions(exam, section, topic, subtopic, difficulty);

alter table public.users enable row level security;
alter table public.user_profiles enable row level security;
alter table public.questions enable row level security;
alter table public.attempts enable row level security;
alter table public.mistakes enable row level security;
alter table public.study_recommendations enable row level security;

drop policy if exists "Users can read own user row" on public.users;
create policy "Users can read own user row"
on public.users for select
using (auth.uid() = id);

drop policy if exists "Users can update own user row" on public.users;
create policy "Users can update own user row"
on public.users for update
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "Authenticated users can read ACT questions" on public.questions;
create policy "Authenticated users can read ACT questions"
on public.questions for select
to authenticated
using (exam = 'ACT');

drop policy if exists "Users can manage own profiles" on public.user_profiles;
create policy "Users can manage own profiles"
on public.user_profiles for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can manage own attempts" on public.attempts;
create policy "Users can manage own attempts"
on public.attempts for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can manage own mistakes" on public.mistakes;
create policy "Users can manage own mistakes"
on public.mistakes for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can manage own recommendations" on public.study_recommendations;
create policy "Users can manage own recommendations"
on public.study_recommendations for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  )
  on conflict (id) do update
    set email = excluded.email,
        name = excluded.name;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
