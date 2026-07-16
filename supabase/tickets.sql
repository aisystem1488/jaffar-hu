-- Support triage tickets (Fázis: support demo)
-- Futtasd a Supabase SQL Editorban a meglévő séma után

create table if not exists tickets (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references conversations(id) on delete set null,
  category text,
  urgency text,
  sentiment text,
  customer_name text,
  customer_email text,
  subject text,
  draft_reply text,
  suggested_action text,
  fields jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_tickets_conversation on tickets(conversation_id);
create index if not exists idx_tickets_created on tickets(created_at desc);

alter table tickets enable row level security;
