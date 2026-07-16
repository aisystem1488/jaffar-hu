-- Jaffar.hu AI Sales Agent Demo — Fázis 1 séma
-- Futtasd a Supabase SQL Editorban (jaffar-demo projekt)

create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  vertical text not null default 'saas',
  status text not null default 'active',
  phase text not null default 'discovery',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references conversations(id) on delete set null,
  name text,
  email text,
  company text,
  qualification jsonb default '{}'::jsonb,
  recommended_product text,
  score int,
  summary text,
  next_step text,
  created_at timestamptz not null default now()
);

create index if not exists idx_conversations_session on conversations(session_id);
create index if not exists idx_messages_conversation on messages(conversation_id);
create index if not exists idx_leads_conversation on leads(conversation_id);

-- RLS: service role has full access via API; anon blocked by default
alter table conversations enable row level security;
alter table messages enable row level security;
alter table leads enable row level security;
