-- CashyCash – שיעור קאשבק משתנה + חנויות פופולריות נוספות
-- הריצו ב-Supabase לאחר 0004_user_details.sql.

alter table public.stores
  add column if not exists variable boolean not null default false;

-- AliExpress: שיעור משתנה בין פריטים -> מציגים "עד"
update public.stores set variable = true where name ilike 'aliexpress%';

-- קטלוג חנויות פופולריות (בישראל). לחיבור קאשבק אמיתי:
-- מחברים את התוכנית ב-Admitad ומריצים sync-stores (יעדכן את הקישור והשיעור).
insert into public.stores
  (name, category, base_url, cashback_type, cashback_value, user_share_percent, variable, active)
select v.name, v.category, v.base_url, v.cashback_type, v.cashback_value,
       v.user_share_percent, v.variable, v.active
from (values
  ('Shein', 'אופנה', 'https://www.shein.com', 'percent', 10, 60, true, true),
  ('eBay', 'קניות כלליות', 'https://www.ebay.com', 'percent', 3, 60, true, true),
  ('Temu', 'קניות כלליות', 'https://www.temu.com', 'percent', 10, 60, true, true),
  ('Banggood', 'קניות כלליות', 'https://www.banggood.com', 'percent', 8, 60, true, true),
  ('Trivago', 'טיסות ומלונות', 'https://www.trivago.com', 'percent', 4, 60, false, true),
  ('Agoda', 'טיסות ומלונות', 'https://www.agoda.com', 'percent', 5, 60, false, true),
  ('Hotels.com', 'טיסות ומלונות', 'https://www.hotels.com', 'percent', 5, 60, false, true),
  ('Expedia', 'טיסות ומלונות', 'https://www.expedia.com', 'percent', 4, 60, false, true),
  ('Nike', 'ספורט', 'https://www.nike.com', 'percent', 6, 60, false, true),
  ('Adidas', 'ספורט', 'https://www.adidas.com', 'percent', 6, 60, false, true),
  ('Puma', 'ספורט', 'https://www.puma.com', 'percent', 6, 60, false, true),
  ('Foot Locker', 'ספורט', 'https://www.footlocker.com', 'percent', 6, 60, false, true),
  ('Namshi', 'אופנה', 'https://www.namshi.com', 'percent', 8, 60, false, true),
  ('Farfetch', 'אופנה', 'https://www.farfetch.com', 'percent', 7, 60, false, true),
  ('H&M', 'אופנה', 'https://www2.hm.com', 'percent', 5, 60, false, true),
  ('Sephora', 'בריאות וטבע', 'https://www.sephora.com', 'percent', 6, 60, false, true),
  ('Samsung', 'אלקטרוניקה', 'https://www.samsung.com', 'percent', 3, 60, false, true),
  ('Lenovo', 'אלקטרוניקה', 'https://www.lenovo.com', 'percent', 4, 60, false, true)
) as v(name, category, base_url, cashback_type, cashback_value, user_share_percent, variable, active)
where not exists (select 1 from public.stores s where s.name = v.name);
