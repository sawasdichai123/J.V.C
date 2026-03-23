-- =============================================================
-- J.V.C (Jeetar Vault Core) — Initial Database Schema
-- Run this in Supabase SQL Editor to set up all tables + RLS
-- =============================================================

-- 0) Extensions
create extension if not exists "pgcrypto";

-- 1) Profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data ->> 'display_name');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2) Categories
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (owner_id, name)
);

alter table public.categories enable row level security;

create policy "Users can manage own categories"
  on public.categories for all using (auth.uid() = owner_id);

-- 3) Tags
create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (owner_id, name)
);

alter table public.tags enable row level security;

create policy "Users can manage own tags"
  on public.tags for all using (auth.uid() = owner_id);

-- 4) Works
create table if not exists public.works (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  category_id uuid references public.categories(id) on delete set null,
  cover_asset_id uuid,
  is_deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.works enable row level security;

create policy "Users can manage own works"
  on public.works for all using (auth.uid() = owner_id);

create index idx_works_owner_created on public.works (owner_id, created_at desc);
create index idx_works_owner_title on public.works (owner_id, title);

-- Full-text search on title
alter table public.works
  add column if not exists title_tsv tsvector
  generated always as (to_tsvector('simple', coalesce(title, ''))) stored;

create index idx_works_title_tsv on public.works using gin (title_tsv);

-- 5) Work Tags (junction)
create table if not exists public.work_tags (
  work_id uuid not null references public.works(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  primary key (work_id, tag_id)
);

alter table public.work_tags enable row level security;

create policy "Users can manage own work_tags"
  on public.work_tags for all
  using (
    exists (
      select 1 from public.works w where w.id = work_id and w.owner_id = auth.uid()
    )
  );

-- 6) Assets
create table if not exists public.assets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  work_id uuid not null references public.works(id) on delete cascade,
  kind text not null default 'original',
  bucket text not null,
  path text not null,
  mime_type text,
  bytes bigint,
  width int,
  height int,
  sha256 text,
  created_at timestamptz not null default now()
);

alter table public.assets enable row level security;

create policy "Users can manage own assets"
  on public.assets for all using (auth.uid() = owner_id);

create index idx_assets_owner_work on public.assets (owner_id, work_id, created_at desc);
create index idx_assets_sha256 on public.assets (owner_id, sha256);

-- 7) Add foreign key for cover_asset_id (deferred because assets table must exist first)
alter table public.works
  add constraint fk_works_cover_asset
  foreign key (cover_asset_id) references public.assets(id) on delete set null;

-- =============================================================
-- Storage: Create bucket 'jvc' (private)
-- Run this separately in Supabase Dashboard > Storage or via API:
--
--   insert into storage.buckets (id, name, public)
--   values ('jvc', 'jvc', false);
--
-- Then add a storage policy to allow authenticated uploads:
--
--   create policy "Auth users can upload to jvc"
--     on storage.objects for insert
--     to authenticated
--     with check (bucket_id = 'jvc');
--
--   create policy "Auth users can read own objects in jvc"
--     on storage.objects for select
--     to authenticated
--     using (bucket_id = 'jvc');
--
--   create policy "Auth users can delete own objects in jvc"
--     on storage.objects for delete
--     to authenticated
--     using (bucket_id = 'jvc');
-- =============================================================
