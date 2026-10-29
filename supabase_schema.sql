create table if not exists public.affiliate_products(id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,name text not null,product_url text,price numeric(14,2) default 0,commission_rate numeric(5,2) default 0,promo_angle text,created_at timestamptz default now());
create table if not exists public.content_drafts(id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,product_name text not null,platform text default 'TikTok',script text default '',status text default 'draft',created_at timestamptz default now());
create table if not exists public.publish_schedule(id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,title text not null,platform text not null,publish_at timestamptz not null,status text default 'queued',created_at timestamptz default now());
create table if not exists public.performance_metrics(id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,content_name text not null,views bigint default 0,clicks bigint default 0,commission numeric(14,2) default 0,recorded_at timestamptz default now());

-- Workspace sync for the static mobile dashboard. Anonymous Auth must be enabled.
create table if not exists public.agent_workspaces (
  user_id uuid primary key references auth.users(id) on delete cascade,
  workspace jsonb not null default '{"p":[],"c":[],"q":[],"m":[]}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.agent_workspaces enable row level security;
revoke all on public.agent_workspaces from anon;
revoke all on public.agent_workspaces from authenticated;
grant select, insert, update on public.agent_workspaces to authenticated;
drop policy if exists "Users can read own workspace" on public.agent_workspaces;
drop policy if exists "Users can create own workspace" on public.agent_workspaces;
drop policy if exists "Users can update own workspace" on public.agent_workspaces;
create policy "Users can read own workspace" on public.agent_workspaces for select to authenticated using (auth.uid() = user_id);
create policy "Users can create own workspace" on public.agent_workspaces for insert to authenticated with check (auth.uid() = user_id);
create policy "Users can update own workspace" on public.agent_workspaces for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
