-- Rode este SQL no Supabase: Dashboard > SQL Editor > New query > Run

create table if not exists crm_data (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table crm_data enable row level security;

-- ATENÇÃO: estas políticas liberam leitura e escrita para quem tiver a URL + chave anon
-- do projeto (ainda assim, ninguém de fora consegue adivinhar essas credenciais).
-- Isso é suficiente para testar com o time. Antes de usar com dados sensíveis de verdade,
-- troque por autenticação real (Supabase Auth) — posso te ajudar com isso depois.
create policy "Permitir leitura" on crm_data for select using (true);
create policy "Permitir escrita" on crm_data for insert with check (true);
create policy "Permitir atualização" on crm_data for update using (true);

-- habilita o realtime (sincronização ao vivo entre quem estiver usando o CRM)
alter publication supabase_realtime add table crm_data;
