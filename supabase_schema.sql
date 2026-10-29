-- Affiliate Agent OS Supabase schema (idempotent baseline)
-- Run in Supabase SQL Editor. Never put service-role keys in the browser.

create extension if not exists pgcrypto;

create table if not exists public.agent_workspaces (
  user_id uuid primary key references auth.users(id) on delete cascade,
  workspace jsonb not null default '{"p":[],"c":[],"q":[],"m":[]}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.affiliate_products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  niche text,
  product_url text,
  affiliate_url text,
  price numeric(14,2),
  commission_rate numeric(5,2),
  source_url text,
  verification_status text not null default 'unverified'
    check (verification_status in ('unverified','verified','rejected')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.content_drafts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid references public.affiliate_products(id) on delete set null,
  platform text not null default 'TikTok',
  title text,
  hook text,
  script text,
  caption text,
  hashtags text[] not null default '{}',
  storyboard jsonb not null default '[]'::jsonb,
  status text not null default 'draft'
    check (status in ('draft','approved','published','archived')),
  published_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.agent_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mode text not null check (mode in ('research','plan','video')),
  niche text,
  audience text,
  platform text,
  product text,
  request_json jsonb not null default '{}'::jsonb,
  result_text text,
  sources jsonb not null default '[]'::jsonb,
  status text not null default 'queued'
    check (status in ('queued','running','completed','failed')),
  error_message text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.publish_schedule (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  platform text not null,
  publish_at timestamptz not null,
  status text not null default 'queued',
  created_at timestamptz not null default now()
);

create table if not exists public.performance_metrics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  content_name text not null,
  views bigint not null default 0,
  clicks bigint not null default 0,
  commission numeric(14,2) not null default 0,
  recorded_at timestamptz not null default now()
);

alter table public.agent_workspaces enable row level security;
alter table public.affiliate_products enable row level security;
alter table public.content_drafts enable row level security;
alter table public.agent_runs enable row level security;
alter table public.publish_schedule enable row level security;
alter table public.performance_metrics enable row level security;

revoke all on public.agent_workspaces from anon;
revoke all on public.affiliate_products from anon;
revoke all on public.content_drafts from anon;
revoke all on public.agent_runs from anon;
revoke all on public.publish_schedule from anon;
revoke all on public.performance_metrics from anon;

grant select, insert, update, delete on public.agent_workspaces to authenticated;
grant select, insert, update, delete on public.affiliate_products to authenticated;
grant select, insert, update, delete on public.content_drafts to authenticated;
grant select, insert, update on public.agent_runs to authenticated;
grant select, insert, update, delete on public.publish_schedule to authenticated;
grant select, insert, update, delete on public.performance_metrics to authenticated;

drop policy if exists "Users can read own workspace" on public.agent_workspaces;
drop policy if exists "Users can create own workspace" on public.agent_workspaces;
drop policy if exists "Users can update own workspace" on public.agent_workspaces;
create policy "Users can read own workspace" on public.agent_workspaces for select to authenticated using (auth.uid() = user_id);
create policy "Users can create own workspace" on public.agent_workspaces for insert to authenticated with check (auth.uid() = user_id);
create policy "Users can update own workspace" on public.agent_workspaces for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users manage own affiliate products" on public.affiliate_products;
create policy "Users manage own affiliate products" on public.affiliate_products for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users manage own content drafts" on public.content_drafts;
create policy "Users manage own content drafts" on public.content_drafts for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users create own agent runs" on public.agent_runs;
drop policy if exists "Users read own agent runs" on public.agent_runs;
drop policy if exists "Users update own agent runs" on public.agent_runs;
create policy "Users create own agent runs" on public.agent_runs for insert to authenticated with check (auth.uid() = user_id);
create policy "Users read own agent runs" on public.agent_runs for select to authenticated using (auth.uid() = user_id);
create policy "Users update own agent runs" on public.agent_runs for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users manage own publish schedule" on public.publish_schedule;
create policy "Users manage own publish schedule" on public.publish_schedule for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users manage own performance metrics" on public.performance_metrics;
create policy "Users manage own performance metrics" on public.performance_metrics for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
