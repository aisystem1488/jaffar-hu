-- Meeting summaries (opcionális napló)
-- Futtasd a Supabase SQL Editorban

create table if not exists meeting_summaries (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references conversations(id) on delete set null,
  title text,
  summary text,
  decisions jsonb default '[]'::jsonb,
  action_items jsonb default '[]'::jsonb,
  open_questions jsonb default '[]'::jsonb,
  follow_up_email text,
  participants jsonb default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_meeting_summaries_conversation on meeting_summaries(conversation_id);

alter table meeting_summaries enable row level security;
