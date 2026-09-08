-- CashyCash – סכימת בסיס נתונים ראשונית
-- הריצו קובץ זה ב-Supabase: SQL Editor > New query > הדביקו והריצו.

-- =========================================================
-- טבלת פרופילים (מקושרת ל-auth.users)
-- =========================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  created_at timestamptz not null default now()
);

-- יצירת פרופיל אוטומטית בעת הרשמה
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =========================================================
-- חנויות
-- =========================================================
create table if not exists public.stores (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text,
  description text,
  logo_url text,
  base_url text not null,
  affiliate_url_template text,
  cashback_type text not null default 'percent' check (cashback_type in ('percent', 'fixed')),
  cashback_value numeric not null default 0,
  user_share_percent numeric not null default 50 check (user_share_percent between 0 and 100),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- =========================================================
-- קליקים (יצירת קישור אישי / מעקב)
-- =========================================================
create table if not exists public.clicks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  store_id uuid not null references public.stores (id) on delete cascade,
  token text not null unique,
  redirect_url text not null,
  created_at timestamptz not null default now()
);
create index if not exists clicks_user_idx on public.clicks (user_id);
create index if not exists clicks_token_idx on public.clicks (token);

-- =========================================================
-- עסקאות קאשבק
-- =========================================================
create table if not exists public.cashback_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  store_id uuid not null references public.stores (id) on delete cascade,
  click_id uuid references public.clicks (id) on delete set null,
  order_amount numeric,
  cashback_amount numeric not null default 0,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'paid', 'rejected')),
  network_txn_id text,
  created_at timestamptz not null default now(),
  confirmed_at timestamptz
);
create index if not exists txn_user_idx on public.cashback_transactions (user_id);

-- =========================================================
-- בקשות משיכה (payouts)
-- =========================================================
create table if not exists public.payout_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  amount numeric not null check (amount > 0),
  status text not null default 'requested' check (status in ('requested', 'paid', 'rejected')),
  created_at timestamptz not null default now(),
  paid_at timestamptz
);
create index if not exists payout_user_idx on public.payout_requests (user_id);

-- =========================================================
-- Row Level Security
-- =========================================================
alter table public.profiles enable row level security;
alter table public.stores enable row level security;
alter table public.clicks enable row level security;
alter table public.cashback_transactions enable row level security;
alter table public.payout_requests enable row level security;

-- פרופילים: כל משתמש רואה ומעדכן רק את עצמו
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- חנויות: קריאה ציבורית לחנויות פעילות (גם ללא התחברות)
drop policy if exists "stores_select_active" on public.stores;
create policy "stores_select_active" on public.stores
  for select using (active = true);

-- קליקים: המשתמש יוצר וקורא רק את שלו
drop policy if exists "clicks_insert_own" on public.clicks;
create policy "clicks_insert_own" on public.clicks
  for insert with check (auth.uid() = user_id);

drop policy if exists "clicks_select_own" on public.clicks;
create policy "clicks_select_own" on public.clicks
  for select using (auth.uid() = user_id);

-- עסקאות: המשתמש רק קורא את שלו.
-- יצירה/עדכון נעשים ע"י השרת (service role) בעקבות אישור מרשת השותפים,
-- לכן אין policy ל-insert/update למשתמשים רגילים.
drop policy if exists "txn_select_own" on public.cashback_transactions;
create policy "txn_select_own" on public.cashback_transactions
  for select using (auth.uid() = user_id);

-- משיכות: המשתמש יוצר וקורא רק את שלו. אישור התשלום נעשה ע"י השרת (service role).
drop policy if exists "payout_insert_own" on public.payout_requests;
create policy "payout_insert_own" on public.payout_requests
  for insert with check (auth.uid() = user_id);

drop policy if exists "payout_select_own" on public.payout_requests;
create policy "payout_select_own" on public.payout_requests
  for select using (auth.uid() = user_id);

-- =========================================================
-- סימון משיכה כשולמה (service role): מסמן paid ומעביר את הקאשבק המאושר ל-paid
-- =========================================================
create or replace function public.mark_payout_paid(payout_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  target_user uuid;
begin
  update public.payout_requests
    set status = 'paid', paid_at = now()
    where id = payout_id
    returning user_id into target_user;

  update public.cashback_transactions
    set status = 'paid'
    where user_id = target_user and status = 'confirmed';
end;
$$;

-- =========================================================
-- נתוני דוגמה (חנויות)
-- =========================================================
insert into public.stores (name, category, description, base_url, cashback_type, cashback_value, user_share_percent)
values
  ('AliExpress', 'קניות כלליות', 'מגוון עצום של מוצרים במחירים משתלמים.', 'https://www.aliexpress.com', 'percent', 8, 60),
  ('Booking.com', 'טיסות ומלונות', 'הזמנת מלונות ולינה ברחבי העולם.', 'https://www.booking.com', 'percent', 4, 70),
  ('ASOS', 'אופנה', 'אופנה ואקססוריז לגברים ולנשים.', 'https://www.asos.com', 'percent', 6, 55),
  ('KSP', 'אלקטרוניקה', 'מחשבים, גאדג''טים ומוצרי חשמל.', 'https://ksp.co.il', 'percent', 3, 50),
  ('Terminal X', 'אופנה', 'מותגי אופנה מובילים בישראל.', 'https://www.terminalx.com', 'percent', 5, 60),
  ('iHerb', 'בריאות וטבע', 'תוספי תזונה ומוצרים אורגניים.', 'https://www.iherb.com', 'fixed', 20, 50)
on conflict do nothing;
