-- CashyCash – תיקון: אינדקס ייחודי מלא לקופונים מהרשת (לצורך ON CONFLICT ב-upsert)
-- אינדקס חלקי (WHERE network is not null) לא תואם ל-ON CONFLICT שמייצר supabase-js,
-- לכן מחליפים באינדקס מלא. שורות ידניות (network/network_coupon_id = null) עדיין מותרות
-- בריבוי כי Postgres מתייחס ל-NULL כערכים שונים באינדקס ייחודי.
drop index if exists public.coupons_network_uidx;

create unique index if not exists coupons_network_uidx
  on public.coupons(network, network_coupon_id);
