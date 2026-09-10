-- CashyCash – הרחבת קטלוג נוספת (תיירות, בית, פנאי ובינלאומיות)
-- הריצו ב-Supabase לאחר 0010_more_stores.sql.
-- idempotent: מוסיף רק חנויות שעדיין לא קיימות (לפי שם).

insert into public.stores
  (name, category, base_url, cashback_type, cashback_value, user_share_percent, variable, active)
select v.name, v.category, v.base_url, v.cashback_type, v.cashback_value,
       v.user_share_percent, v.variable, v.active
from (values
  ('Fattal', 'טיסות ומלונות', 'https://www.fattal.co.il', 'percent', 5, 60, false, true),
  ('Gulliver', 'טיסות ומלונות', 'https://www.gulliver.co.il', 'percent', 4, 60, false, true),
  ('Cinema City', 'פנאי ובידור', 'https://www.cinema-city.co.il', 'percent', 4, 55, false, true),
  ('Keter', 'בית וריהוט', 'https://www.keter.com', 'percent', 4, 60, false, true),
  ('Vardinon', 'בית וריהוט', 'https://www.vardinon.co.il', 'percent', 5, 60, false, true),
  ('Opticana', 'יופי וטיפוח', 'https://www.opticana.co.il', 'percent', 4, 55, false, true),
  ('GOLF&CO', 'בית וריהוט', 'https://www.golfand.co.il', 'percent', 5, 60, false, true),
  ('Intima', 'אופנה', 'https://www.intima.co.il', 'percent', 5, 60, false, true),
  ('Look Fantastic', 'יופי וטיפוח', 'https://www.lookfantastic.com', 'percent', 7, 60, false, true),
  ('Victoria''s Secret', 'אופנה', 'https://www.victoriassecret.com', 'percent', 6, 60, false, true),
  ('Reserved', 'אופנה', 'https://www.reserved.com', 'percent', 6, 60, false, true),
  ('Anker', 'אלקטרוניקה', 'https://www.anker.com', 'percent', 5, 55, false, true)
) as v(name, category, base_url, cashback_type, cashback_value, user_share_percent, variable, active)
where not exists (select 1 from public.stores s where s.name = v.name);
