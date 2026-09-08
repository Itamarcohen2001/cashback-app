-- CashyCash – שדות אינטגרציה לרשתות שותפים (Affiliate)
-- הריצו ב-Supabase לאחר 0001_init.sql.

-- מזהי הרשת עבור חנות (מאיזו רשת הגיעה ומה מזהה המפרסם שם)
alter table public.stores
  add column if not exists network text,
  add column if not exists network_offer_id text;

-- מאפשר upsert לפי (network, network_offer_id) בסנכרון החנויות
create unique index if not exists stores_network_offer_uidx
  on public.stores (network, network_offer_id);

-- מזהה המרה ייחודי מהרשת — למניעת עסקאות כפולות מ-postback חוזר
create unique index if not exists txn_network_txn_uidx
  on public.cashback_transactions (network_txn_id);

-- אינדקס לחיפוש קליק לפי טוקן ב-postback (אם לא נוצר קודם)
create index if not exists clicks_token_lookup_idx
  on public.clicks (token);
