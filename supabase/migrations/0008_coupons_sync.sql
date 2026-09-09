-- CashyCash – תמיכה בסנכרון קופונים אוטומטי מרשת השותפים
-- הריצו ב-Supabase לאחר 0006_coupons.sql.

-- מקור הקופון: מזהה הרשת + מזהה הקופון ברשת (לצורך upsert ומניעת כפילויות)
alter table public.coupons
  add column if not exists network text,
  add column if not exists network_coupon_id text;

-- מפתח ייחודי לקופונים שמקורם ברשת (קופונים ידניים נשארים עם network = null)
create unique index if not exists coupons_network_uidx
  on public.coupons(network, network_coupon_id)
  where network is not null;
