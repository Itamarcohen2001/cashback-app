-- CashyCash – תזמון יומי אוטומטי לסנכרון דילים (וחנויות) מרשת השותפים.
-- ⚠️ הריצו ידנית ב-Supabase SQL Editor (לא אוטומטי) — יש להחליף <SYNC_SECRET> בערך האמיתי.
--    אין לשמור את הסוד בקובץ שנשמר ב-git; לכן הוא מופיע כ-placeholder בלבד.
--
-- דרישות: הפעילו את התוספים pg_cron ו-pg_net (Dashboard > Database > Extensions).

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- סנכרון דילים יומי — כל יום ב-03:00 UTC.
select cron.schedule(
  'daily-sync-coupons',
  '0 3 * * *',
  $$
  select net.http_post(
    url := 'https://lixpidmnjznnocrpydbr.supabase.co/functions/v1/sync-coupons',
    headers := jsonb_build_object(
      'x-sync-secret', '<SYNC_SECRET>',
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- (אופציונלי) סנכרון קטלוג חנויות שבועי — כל יום ראשון ב-02:30 UTC.
select cron.schedule(
  'weekly-sync-stores',
  '30 2 * * 0',
  $$
  select net.http_post(
    url := 'https://lixpidmnjznnocrpydbr.supabase.co/functions/v1/sync-stores',
    headers := jsonb_build_object(
      'x-sync-secret', '<SYNC_SECRET>',
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- לבדיקת התזמונים:            select * from cron.job;
-- להסרת תזמון (אם צריך):       select cron.unschedule('daily-sync-coupons');
