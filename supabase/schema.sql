-- Chạy file này trong Supabase → SQL Editor → New query → Run

create table if not exists public.matches (
  id          uuid primary key default gen_random_uuid(),
  date        date not null,
  opponent    text not null check (opponent in ('dad', 'mom')),
  activity_id text not null,
  winner      text not null check (winner in ('son', 'dad', 'mom', 'draw')),
  note        text,
  created_at  timestamptz not null default now()
);
create index if not exists matches_date_idx on public.matches (date);

create table if not exists public.app_settings (
  id         int primary key default 1 check (id = 1),
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Web dùng publishable key (chạy với vai trò "anon" của Postgres) nên cần cho phép đọc/ghi.
-- Lưu ý: ai có link web + publishable key đều đọc/ghi được. Giai đoạn sau
-- có thể thêm đăng nhập (Supabase Auth) để khoá chặt hơn.
alter table public.matches enable row level security;
alter table public.app_settings enable row level security;

drop policy if exists "family all" on public.matches;
create policy "family all" on public.matches for all to anon, authenticated using (true) with check (true);

drop policy if exists "family all" on public.app_settings;
create policy "family all" on public.app_settings for all to anon, authenticated using (true) with check (true);
