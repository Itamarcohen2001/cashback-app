-- CashyCash – קופונים/דילים + סימון חנויות פופולריות
-- הריצו ב-Supabase לאחר 0005_stores_catalog.sql.

-- דגל "פופולרי" לחנויות (למיון "פופולריות" באפליקציה)
alter table public.stores
  add column if not exists popular boolean not null default false;

-- טבלת קופונים/דילים
create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  title text not null,
  code text,
  description text,
  expires_at timestamptz,
  featured boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists coupons_store_id_idx on public.coupons(store_id);
create index if not exists coupons_active_idx on public.coupons(active);

alter table public.coupons enable row level security;

-- כולם (כולל אנונימי) יכולים לקרוא קופונים פעילים
drop policy if exists "coupons_public_select" on public.coupons;
create policy "coupons_public_select" on public.coupons
  for select using (active = true or public.is_admin());

-- ניהול קופונים – מנהלים בלבד
drop policy if exists "coupons_admin_insert" on public.coupons;
create policy "coupons_admin_insert" on public.coupons
  for insert with check (public.is_admin());

drop policy if exists "coupons_admin_update" on public.coupons;
create policy "coupons_admin_update" on public.coupons
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "coupons_admin_delete" on public.coupons;
create policy "coupons_admin_delete" on public.coupons
  for delete using (public.is_admin());

-- =========================================================
-- סימון חנויות פופולריות לדוגמה (התאימו לפי הצורך)
-- =========================================================
update public.stores set popular = true
  where name in (
    'AliExpress', 'Shein', 'Temu', 'Booking.com', 'ASOS',
    'Terminal X', 'iHerb', 'Nike', 'KSP', 'FOX'
  );

-- =========================================================
-- דילים לדוגמה (מקושרים לחנויות קיימות לפי שם)
-- =========================================================
insert into public.coupons (store_id, title, code, description, featured, active)
select s.id, v.title, v.code, v.description, v.featured, true
from (values
  ('AliExpress', 'קופון ₪12 הנחה בקנייה מעל $20', 'CASHY12', 'תקף למשתמשים חדשים באפליקציה.', true),
  ('Shein', '15% הנחה על כל האתר', 'CASHY15', 'ללא מינימום קנייה.', true),
  ('Temu', 'משלוח חינם + ₪40 הנחה', null, 'הדיל מוחל אוטומטית בעגלה.', true),
  ('Booking.com', 'עד 10% הנחה על מלונות נבחרים', null, 'ההנחה מוצגת בעמוד המלון.', true),
  ('ASOS', '20% הנחה על קולקציית העונה', 'STYLE20', 'לא כולל מותגים נבחרים.', false),
  ('Terminal X', '50 ₪ הנחה בקנייה מעל 300 ₪', 'TX50', 'מבצע לזמן מוגבל.', false),
  ('iHerb', '5% הנחה נוספת על כל הסל', 'IHERB5', 'מצטבר עם מבצעי האתר.', false),
  ('Nike', '25% הנחה על נבחרת פריטים', null, 'ההנחה מוחלת אוטומטית.', false)
) as v(store_name, title, code, description, featured)
join public.stores s on s.name = v.store_name
where not exists (
  select 1 from public.coupons c where c.store_id = s.id and c.title = v.title
);
