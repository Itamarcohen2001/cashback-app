-- CashyCash – הרשאות ניהול (admin) מאובטחות
-- הריצו ב-Supabase לאחר 0002_affiliate.sql.

-- דגל מנהל בפרופיל
alter table public.profiles
  add column if not exists is_admin boolean not null default false;

-- פונקציית עזר: האם המשתמש המחובר הוא מנהל.
-- security definer -> עוקפת RLS בקריאת profiles ומונעת רקורסיה במדיניות.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select p.is_admin from public.profiles p where p.id = auth.uid()),
    false
  );
$$;

-- =========================================================
-- מדיניות RLS למנהל (בנוסף למדיניות "רק את שלי" הקיימת)
-- =========================================================

-- עסקאות: מנהל רואה ומעדכן הכול
drop policy if exists "txn_admin_select" on public.cashback_transactions;
create policy "txn_admin_select" on public.cashback_transactions
  for select using (public.is_admin());

drop policy if exists "txn_admin_update" on public.cashback_transactions;
create policy "txn_admin_update" on public.cashback_transactions
  for update using (public.is_admin()) with check (public.is_admin());

-- משיכות: מנהל רואה ומעדכן הכול
drop policy if exists "payout_admin_select" on public.payout_requests;
create policy "payout_admin_select" on public.payout_requests
  for select using (public.is_admin());

drop policy if exists "payout_admin_update" on public.payout_requests;
create policy "payout_admin_update" on public.payout_requests
  for update using (public.is_admin()) with check (public.is_admin());

-- =========================================================
-- סימון משיכה כשולמה — עכשיו עם בדיקת הרשאת מנהל
-- =========================================================
create or replace function public.mark_payout_paid(payout_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  target_user uuid;
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;

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
-- כדי להפוך משתמש למנהל, הריצו (החליפו את האימייל):
--   update public.profiles set is_admin = true
--   where id = (select id from auth.users where email = 'you@example.com');
-- =========================================================
