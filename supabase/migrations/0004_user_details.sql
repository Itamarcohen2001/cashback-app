-- CashyCash – פרטי משתמש (טלפון/אימייל) לצורך תשלום קאשבק (ביט)
-- הריצו ב-Supabase לאחר 0003_admin.sql.

alter table public.profiles
  add column if not exists email text,
  add column if not exists phone text;

-- עדכון טריגר יצירת הפרופיל: לשמור גם אימייל וטלפון מההרשמה
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, phone)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.email,
    new.raw_user_meta_data ->> 'phone'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- מילוי לאחור עבור המשתמשים הקיימים
update public.profiles p
set email = u.email,
    phone = coalesce(p.phone, u.raw_user_meta_data ->> 'phone'),
    full_name = coalesce(p.full_name, u.raw_user_meta_data ->> 'full_name')
from auth.users u
where u.id = p.id;

-- מנהל יכול לקרוא את כל הפרופילים (להצגת פרטי המשתמש בפאנל הניהול)
drop policy if exists "profiles_admin_select" on public.profiles;
create policy "profiles_admin_select" on public.profiles
  for select using (public.is_admin());
