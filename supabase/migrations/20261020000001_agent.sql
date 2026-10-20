-- Agente de atención: conversaciones, mensajes y traspasos a una persona
--
-- RLS activo y sin políticas, igual que product_costs: los mensajes de las clientas
-- traen datos personales, así que solo el service role (rutas /api/agent y
-- /api/admin) puede leerlos. Nada de esto debe quedar expuesto con la anon key.

create table if not exists agent_conversations (
  id            uuid primary key default gen_random_uuid(),
  channel       text not null default 'admin_test',   -- 'admin_test' | 'whatsapp' | 'web'
  external_id   text,                                  -- teléfono/ID en el canal (fase 3)
  customer_name text,
  status        text not null default 'open' check (status in ('open', 'handoff', 'closed')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_agent_conversations_status on agent_conversations(status, updated_at desc);
create index if not exists idx_agent_conversations_external on agent_conversations(channel, external_id);

create table if not exists agent_messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references agent_conversations(id) on delete cascade,
  role            text not null check (role in ('user', 'assistant', 'tool')),
  content         text not null,
  tool_name       text,
  tokens_in       integer,
  tokens_out      integer,
  created_at      timestamptz not null default now()
);

create index if not exists idx_agent_messages_conversation on agent_messages(conversation_id, created_at);

create table if not exists agent_handoffs (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references agent_conversations(id) on delete cascade,
  reason          text not null,
  summary         text,
  resolved_at     timestamptz,
  created_at      timestamptz not null default now()
);

create index if not exists idx_agent_handoffs_open on agent_handoffs(created_at desc) where resolved_at is null;

alter table agent_conversations enable row level security;
alter table agent_messages      enable row level security;
alter table agent_handoffs      enable row level security;

revoke all on agent_conversations, agent_messages, agent_handoffs from anon, authenticated;
