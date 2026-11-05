-- ========================================================
-- AgentCraft · 智能体真实造物展馆 (Supabase 数据库建表脚本)
-- 策展人：谢东 (@xiedongznq)
-- ========================================================

-- 1. 创建造物展品表
create table if not exists public.creations (
  id text primary key,
  title text not null,
  tagline text not null default '',
  description text not null default '',
  category text not null default 'tools',
  agent_tool text not null default 'Claude Code',
  author jsonb not null default '{}'::jsonb,
  media jsonb not null default '{}'::jsonb,
  recipe jsonb not null default '{}'::jsonb,
  open_source jsonb not null default '{}'::jsonb,
  stats jsonb not null default '{}'::jsonb,
  is_approved boolean not null default true,
  created_at timestamptz not null default now()
);

-- 2. 开启行级安全策略 (RLS)
alter table public.creations enable row level security;

-- 3. 允许公开只读（所有访客可查看已审核的作品）
create policy "Public can read approved creations"
  on public.creations
  for select
  using (is_approved = true);

-- 4. 允许访客在线提交作品（向全网展馆投稿）
create policy "Public can submit creations"
  on public.creations
  for insert
  with check (true);

-- 5. 允许访客为喜欢的作品点赞（更新赞赏数）
create policy "Public can like creations"
  on public.creations
  for update
  using (true)
  with check (true);

-- 6. 创建查询优化索引
create index if not exists idx_creations_created_at on public.creations (created_at desc);
create index if not exists idx_creations_category on public.creations (category);
create index if not exists idx_creations_agent_tool on public.creations (agent_tool);
