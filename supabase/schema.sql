-- 院長コンパス専用スキーマ
-- 既存の社長カルテ／leaders-gapのテーブルには一切触れません。
-- このSQLは院長コンパス用のSupabaseプロジェクトで実行してください。

create extension if not exists pgcrypto;

-- 設問セット（院長・事務長、将来の改訂版を含む）
create table if not exists public.clinic_assessment_question_sets (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  participant_type text not null check (participant_type in ('director', 'office_manager')),
  version integer not null default 1 check (version > 0),
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (participant_type, version)
);

-- 小テーマ
create table if not exists public.clinic_assessment_themes (
  id uuid primary key default gen_random_uuid(),
  question_set_id uuid not null references public.clinic_assessment_question_sets(id) on delete cascade,
  code text not null,
  name text not null,
  description text,
  display_order integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (question_set_id, code),
  unique (question_set_id, display_order)
);

-- 設問マスタ。回答済みデータの表示は回答テーブル側のスナップショットを使用するため、後日の文言改訂にも対応します。
create table if not exists public.clinic_assessment_questions (
  id uuid primary key default gen_random_uuid(),
  question_set_id uuid not null references public.clinic_assessment_question_sets(id) on delete cascade,
  theme_id uuid not null references public.clinic_assessment_themes(id) on delete restrict,
  question_number integer not null check (question_number > 0),
  question_code text not null,
  text text not null,
  display_order integer not null,
  is_required boolean not null default true,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (question_set_id, question_number),
  unique (question_set_id, question_code),
  unique (question_set_id, display_order)
);

-- 受検者ごとの結果。回答者区分により院長／事務長を区別します。
create table if not exists public.clinic_assessment_responses (
  id uuid primary key default gen_random_uuid(),
  result_token uuid not null default gen_random_uuid() unique,
  result_expires_at timestamptz not null default (now() + interval '7 days'),
  question_set_id uuid references public.clinic_assessment_question_sets(id) on delete set null,
  question_set_code text not null,
  question_set_version integer not null,
  participant_type text not null check (participant_type in ('director', 'office_manager')),
  name text not null,
  email text not null,
  clinic_name text not null,
  basic_info jsonb not null default '{}'::jsonb,
  total_score numeric(4,2) not null check (total_score >= 1 and total_score <= 5),
  theme_scores jsonb not null default '{}'::jsonb,
  priority_themes jsonb not null default '[]'::jsonb,
  result_comment text,
  cta jsonb not null default '{}'::jsonb,
  respondent_email_sent_at timestamptz,
  respondent_email_error text,
  client_email_sent_at timestamptz,
  client_email_error text,
  submitted_at timestamptz not null default now(),
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 各回答の明細。設問・テーマ文言を保存して、設問マスタ改訂後も過去レポートを保持します。
create table if not exists public.clinic_assessment_response_answers (
  id uuid primary key default gen_random_uuid(),
  response_id uuid not null references public.clinic_assessment_responses(id) on delete cascade,
  question_id uuid references public.clinic_assessment_questions(id) on delete set null,
  question_number integer not null,
  question_code text not null,
  question_text_snapshot text not null,
  theme_code text not null,
  theme_name_snapshot text not null,
  score smallint not null check (score between 1 and 5),
  created_at timestamptz not null default now(),
  unique (response_id, question_number)
);

-- 管理画面で入力するフィードバック／レポートコメント
create table if not exists public.clinic_assessment_reports (
  id uuid primary key default gen_random_uuid(),
  response_id uuid not null unique references public.clinic_assessment_responses(id) on delete cascade,
  overall_comment text,
  strengths_comment text,
  priority_comment text,
  next_actions text,
  internal_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.clinic_assessment_reports
  add column if not exists strengths_comment text;

-- 12タイプ診断結果。36問の回答から算出したタイプ判定を、既存結果とは分けて保存します。
create table if not exists public.clinic_assessment_type_results (
  id uuid primary key default gen_random_uuid(),
  response_id uuid not null unique references public.clinic_assessment_responses(id) on delete cascade,
  respondent_type text not null check (respondent_type in ('doctor', 'manager')),
  feature_scores jsonb not null default '{}'::jsonb,
  auxiliary_scores jsonb not null default '{}'::jsonb,
  main_type_key text not null,
  main_type_label text not null,
  sub_type_key text,
  sub_type_label text,
  main_type_distance numeric(8,3),
  sub_type_distance numeric(8,3),
  type_distances jsonb not null default '[]'::jsonb,
  excluded_candidate_reasons jsonb not null default '[]'::jsonb,
  maturity_key text,
  maturity_label text,
  type_judgement_status text not null default 'standard',
  type_logic_version text not null,
  calculated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 途中保存。回答完了時はprofile/answersを空にして、管理用メタ情報だけ残します。
create table if not exists public.clinic_assessment_drafts (
  id uuid primary key default gen_random_uuid(),
  draft_id uuid not null unique,
  participant_type text check (participant_type in ('director', 'office_manager')),
  name text,
  email text,
  clinic_name text,
  profile jsonb not null default '{}'::jsonb,
  answers jsonb not null default '{}'::jsonb,
  answered_count integer not null default 0,
  total_questions integer not null default 36,
  status text not null default 'draft' check (status in ('draft', 'ready', 'completed')),
  last_accessed_at timestamptz not null default now(),
  completed_response_id uuid references public.clinic_assessment_responses(id) on delete set null,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists clinic_assessment_responses_submitted_at_idx
  on public.clinic_assessment_responses (submitted_at desc);
create index if not exists clinic_assessment_responses_participant_type_idx
  on public.clinic_assessment_responses (participant_type);
create index if not exists clinic_assessment_responses_email_idx
  on public.clinic_assessment_responses (email);
create index if not exists clinic_assessment_responses_active_idx
  on public.clinic_assessment_responses (submitted_at desc)
  where deleted_at is null;
create index if not exists clinic_assessment_response_answers_response_id_idx
  on public.clinic_assessment_response_answers (response_id);
create index if not exists clinic_assessment_questions_question_set_id_idx
  on public.clinic_assessment_questions (question_set_id, display_order);
create index if not exists clinic_assessment_type_results_response_id_idx
  on public.clinic_assessment_type_results (response_id);
create index if not exists clinic_assessment_type_results_type_idx
  on public.clinic_assessment_type_results (respondent_type, main_type_key);
create index if not exists clinic_assessment_drafts_last_accessed_idx
  on public.clinic_assessment_drafts (last_accessed_at desc);
create index if not exists clinic_assessment_drafts_status_idx
  on public.clinic_assessment_drafts (status, updated_at desc);

-- updated_at を保つ共通トリガー
create or replace function public.set_clinic_assessment_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists clinic_assessment_question_sets_updated_at on public.clinic_assessment_question_sets;
create trigger clinic_assessment_question_sets_updated_at
before update on public.clinic_assessment_question_sets
for each row execute function public.set_clinic_assessment_updated_at();

drop trigger if exists clinic_assessment_themes_updated_at on public.clinic_assessment_themes;
create trigger clinic_assessment_themes_updated_at
before update on public.clinic_assessment_themes
for each row execute function public.set_clinic_assessment_updated_at();

drop trigger if exists clinic_assessment_questions_updated_at on public.clinic_assessment_questions;
create trigger clinic_assessment_questions_updated_at
before update on public.clinic_assessment_questions
for each row execute function public.set_clinic_assessment_updated_at();

drop trigger if exists clinic_assessment_responses_updated_at on public.clinic_assessment_responses;
create trigger clinic_assessment_responses_updated_at
before update on public.clinic_assessment_responses
for each row execute function public.set_clinic_assessment_updated_at();

drop trigger if exists clinic_assessment_reports_updated_at on public.clinic_assessment_reports;
create trigger clinic_assessment_reports_updated_at
before update on public.clinic_assessment_reports
for each row execute function public.set_clinic_assessment_updated_at();

drop trigger if exists clinic_assessment_type_results_updated_at on public.clinic_assessment_type_results;
create trigger clinic_assessment_type_results_updated_at
before update on public.clinic_assessment_type_results
for each row execute function public.set_clinic_assessment_updated_at();

drop trigger if exists clinic_assessment_drafts_updated_at on public.clinic_assessment_drafts;
create trigger clinic_assessment_drafts_updated_at
before update on public.clinic_assessment_drafts
for each row execute function public.set_clinic_assessment_updated_at();

-- RLS: 受検者の個人情報・結果をブラウザから直接読ませない設計です。
-- 以後のアプリ実装では、サーバー側のRoute Handlerから service role key を使って操作します。
-- service role はRLSをバイパスし、anon/authenticatedにはポリシーを作成しません。
alter table public.clinic_assessment_question_sets enable row level security;
alter table public.clinic_assessment_themes enable row level security;
alter table public.clinic_assessment_questions enable row level security;
alter table public.clinic_assessment_responses enable row level security;
alter table public.clinic_assessment_response_answers enable row level security;
alter table public.clinic_assessment_reports enable row level security;
alter table public.clinic_assessment_type_results enable row level security;
alter table public.clinic_assessment_drafts enable row level security;

-- 初期設問セット（設問／テーマのINSERTは、lib/questions.ts の72問をDB化する段階で追加）
insert into public.clinic_assessment_question_sets (code, participant_type, version, name)
values
  ('director-v1', 'director', 1, '院長コンパス 院長用 設問セット v1'),
  ('office-manager-v1', 'office_manager', 1, '院長コンパス 事務長用 設問セット v1')
on conflict (code) do nothing;

alter table public.clinic_assessment_responses
  add column if not exists result_expires_at timestamptz not null default (now() + interval '7 days');
