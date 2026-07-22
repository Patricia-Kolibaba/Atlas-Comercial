# Vendaflow CRM

CRM simples estilo Pipedrive: pipeline de negócios em Kanban, atividades com alerta de atraso, importação de planilha de vendedoras/clientes, distribuição de carteira e visão restrita por vendedora.

Os dados ficam salvos num banco Supabase (Postgres) compartilhado — todo o time vê a mesma base em tempo real.

## 1. Criar o banco de dados (Supabase)

1. Crie uma conta grátis em https://supabase.com e crie um novo projeto.
2. No painel do projeto, vá em **SQL Editor > New query**, cole o conteúdo do arquivo `supabase-setup.sql` deste projeto e clique em **Run**.
3. Vá em **Project Settings > API** e copie:
   - **Project URL**
   - **anon public key**

## 2. Configurar o projeto localmente (opcional, só se quiser testar antes de publicar)

```bash
npm install
cp .env.example .env.local
# edite .env.local e cole a URL e a chave do passo 1
npm run dev
```

## 3. Publicar no Vercel (deixa o link no ar)

1. Crie um repositório no GitHub e suba esta pasta para ele.
2. Crie uma conta em https://vercel.com (dá pra entrar direto com o GitHub).
3. No Vercel, clique em **Add New > Project**, escolha o repositório.
4. Em **Environment Variables**, adicione:
   - `VITE_SUPABASE_URL` = a Project URL do Supabase
   - `VITE_SUPABASE_ANON_KEY` = a anon public key do Supabase
5. Clique em **Deploy**. Em ~1 minuto o Vercel te dá o link (algo como `vendaflow-crm.vercel.app`) — é esse link que você compartilha com o time.

## Como usar com o time comercial

- Todo mundo acessa o mesmo link.
- No canto superior direito, cada pessoa escolhe "Entrar como" e seleciona seu próprio nome (ou Administrador).
- **Importante (limitação atual):** essa troca de usuário ainda não tem senha — qualquer pessoa com o link pode entrar como qualquer vendedora ou como Admin. Está ótimo para testar com o time. Se depois vocês quiserem login de verdade com senha por vendedora, é um passo a mais que posso te ajudar a montar (usando Supabase Auth).

## Estrutura do projeto

- `src/App.jsx` — todo o CRM (pipeline, atividades, clientes, importação, distribuição).
- `src/supabaseClient.js` — conexão com o banco.
- `supabase-setup.sql` — cria a tabela `crm_data` que guarda todos os dados do CRM.
