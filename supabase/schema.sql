-- ============================================================
-- Lumen — Supabase Schema
-- Run this in the Supabase SQL editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Query history table
create table if not exists public.query_history (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz default now() not null,

  user_id uuid references auth.users(id) on delete cascade,
  query text not null,
  selected_models text[] not null default '{}',

  -- Full response objects stored as JSONB
  responses jsonb not null default '[]',
  synthesis text not null default '',
  agreement_score jsonb not null default '{}'
);

-- Indexes
create index if not exists query_history_user_id_idx
  on public.query_history (user_id, created_at desc);

-- Row Level Security
alter table public.query_history enable row level security;

-- Users can only read their own history
create policy "Users can read own history"
  on public.query_history
  for select
  using (auth.uid() = user_id);

-- Service role can insert (API route uses service key)
create policy "Service role can insert"
  on public.query_history
  for insert
  with check (true);

-- Allow anonymous queries (user_id is null)
create policy "Anonymous inserts allowed"
  on public.query_history
  for insert
  with check (user_id is null);
