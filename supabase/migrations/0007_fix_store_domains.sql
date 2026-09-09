-- CashyCash – תיקון דומיינים שגויים של חנויות (התגלו בבדיקה ידנית)
-- הריצו ב-Supabase לאחר 0006_coupons.sql.

-- GOLF: הדומיין golf.co.il שייך לחנות ציוד גולף אמריקאית לא קשורה.
-- הדומיין הרשמי של רשת האופנה הישראלית GOLF הוא golf-fashion.co.il.
update public.stores set base_url = 'https://www.golf-fashion.co.il'
  where name = 'GOLF' and base_url = 'https://www.golf.co.il';

-- Urbanica: urbanica-wh.com הוא דומיין סיטונאי לא פעיל; האתר הצרכני הוא urbanica.co.il.
update public.stores set base_url = 'https://www.urbanica.co.il'
  where name = 'Urbanica' and base_url = 'https://www.urbanica-wh.com';

-- נעמן: naamanp.co.il מפנה לפרסומת; הדומיין הנכון הוא naaman.co.il.
update public.stores set base_url = 'https://www.naaman.co.il'
  where name = 'נעמן' and base_url = 'https://www.naamanp.co.il';
