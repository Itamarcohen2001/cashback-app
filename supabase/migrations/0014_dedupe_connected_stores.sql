-- CashyCash – מיזוג כפילויות שנוצרו אחרי sync-stores.
-- (1) ניקוי שמות החנויות המחוברות (הסרת סיומות רשת: WW / Many GEOs / [CPS] / US ...).
-- (2) השבתת הרשומה הידנית (network=null) כשקיימת גרסה מחוברת (עם קישור מעקב) לאותו דומיין.
-- הריצו ב-Supabase SQL Editor. אחרי כן הריצו שוב sync-coupons כדי לקשר קופונים לחנות המחוברת.

-- (1a) הסרת התגית [CPS] מכל מקום בשם.
update public.stores
set name = btrim(regexp_replace(name, '\s*\[CPS\]\s*', ' ', 'gi'))
where network is not null and name ~* '\[CPS\]';

-- (1b) הסרת סיומות אזור בסוף השם (יכולות להופיע כמה ברצף).
update public.stores
set name = btrim(
  regexp_replace(
    name,
    '(\s+(WW|US|UK|EU|Global|Many\s+GEO''?s|Many\s+Geos))+\s*$',
    '',
    'i'
  )
)
where network is not null;

-- (2) השבתת כפילות ידנית כשיש גרסה מחוברת לאותו דומיין.
with dom as (
  select
    id,
    affiliate_url_template,
    split_part(
      regexp_replace(regexp_replace(lower(base_url), '^https?://', ''), '^www\.', ''),
      '/', 1
    ) as domain
  from public.stores
  where active = true
),
connected_domains as (
  select distinct domain from dom where affiliate_url_template is not null
)
update public.stores s
set active = false
from dom
where dom.id = s.id
  and s.affiliate_url_template is null
  and dom.domain in (select domain from connected_domains);
