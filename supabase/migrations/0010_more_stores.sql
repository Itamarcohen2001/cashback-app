-- CashyCash – הרחבת קטלוג החנויות (בהשראת cashback.co.il)
-- הריצו ב-Supabase לאחר 0009_coupons_unique_fix.sql.
-- idempotent: מוסיף רק חנויות שעדיין לא קיימות (לפי שם).

insert into public.stores
  (name, category, base_url, cashback_type, cashback_value, user_share_percent, variable, active)
select v.name, v.category, v.base_url, v.cashback_type, v.cashback_value,
       v.user_share_percent, v.variable, v.active
from (values
  -- בינלאומיות
  ('ZARA', 'אופנה', 'https://www.zara.com/il', 'percent', 5, 60, false, true),
  ('MANGO', 'אופנה', 'https://shop.mango.com', 'percent', 6, 60, false, true),
  ('ASOS', 'אופנה', 'https://www.asos.com', 'percent', 6, 55, false, true),
  ('iHerb', 'בריאות וטבע', 'https://www.iherb.com', 'fixed', 20, 50, false, true),
  ('Booking.com', 'טיסות ומלונות', 'https://www.booking.com', 'percent', 4, 70, false, true),
  ('American Eagle', 'אופנה', 'https://www.americaneagle.co.il', 'percent', 6, 60, false, true),
  ('Crocs', 'אופנה', 'https://www.crocs.co.il', 'percent', 6, 60, false, true),
  ('Nespresso', 'מזון ומשלוחים', 'https://www.nespresso.com/il', 'percent', 4, 60, false, true),
  ('MAC', 'יופי וטיפוח', 'https://www.maccosmetics.co.il', 'percent', 5, 60, false, true),
  -- ישראליות
  ('KSP', 'אלקטרוניקה', 'https://ksp.co.il', 'percent', 3, 50, false, true),
  ('Terminal X', 'אופנה', 'https://www.terminalx.com', 'percent', 5, 60, false, true),
  ('Castro', 'אופנה', 'https://www.castro.com', 'percent', 5, 60, false, true),
  ('Wolt', 'מזון ומשלוחים', 'https://wolt.com/he', 'percent', 4, 60, false, true),
  ('Ivory', 'אלקטרוניקה', 'https://www.ivory.co.il', 'percent', 3, 50, false, true),
  ('ADIKA', 'אופנה', 'https://www.adika.com', 'percent', 6, 60, false, true),
  ('Factory 54', 'אופנה', 'https://www.factory54.co.il', 'percent', 5, 60, false, true),
  ('TwentyFourSeven', 'אופנה', 'https://www.24-7.co.il', 'percent', 5, 60, false, true),
  ('Super-Pharm', 'יופי וטיפוח', 'https://shop.super-pharm.co.il', 'percent', 3, 55, false, true),
  ('Laline', 'יופי וטיפוח', 'https://www.laline.co.il', 'percent', 5, 60, false, true),
  ('BUG', 'אלקטרוניקה', 'https://www.bug.co.il', 'percent', 3, 50, false, true),
  ('Payngo', 'אלקטרוניקה', 'https://www.payngo.co.il', 'percent', 3, 50, false, true),
  ('ACE', 'בית וריהוט', 'https://www.ace.co.il', 'percent', 4, 60, false, true),
  ('Max Stock', 'קניות כלליות', 'https://www.maxstock.co.il', 'percent', 4, 55, false, true)
) as v(name, category, base_url, cashback_type, cashback_value, user_share_percent, variable, active)
where not exists (select 1 from public.stores s where s.name = v.name);
