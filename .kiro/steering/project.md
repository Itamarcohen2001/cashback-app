# CashyCash — סקירת פרויקט למען Kiro

מסמך steering זה נטען אוטומטית בכל שיחה. מטרתו שאכיר את הפרויקט בלי הסבר חוזר.
עדכנו אותו כשהארכיטקטורה או הקונבנציות משתנות.

## מה זה

אפליקציית **קאשבק** בעברית (RTL, מטבע ₪). משתמש גולש לחנות דרך קישור שותפים
אישי, קונה כרגיל, ורשת השותפים מחזירה עמלה — חלק ממנה חוזר למשתמש כקאשבק.
שם המוצר: CashyCash. שם החבילה ב-package.json: `cashycash`.

## מחסנית טכנולוגית

- **Frontend:** Expo (React Native) 54, React 19, expo-router 6. רץ על iOS/Android/Web
  מאותו קוד. web מיוצא דרך metro (`expo export --platform web`), נפרס ל-Netlify.
- **Backend:** Supabase — Postgres + Auth + Edge Functions (Deno/TypeScript).
- **State:** React Context (`AuthContext`, `ThemeContext`). אין ספריית state חיצונית.
- **אחסון מקומי:** AsyncStorage (session במצב mock, נושא theme, מועדפים, נצפו-לאחרונה).
- TypeScript קפדני. אימות טיפוסים: `npm run typecheck` (tsc --noEmit).

## מבנה תיקיות

- `app/` — מסכים לפי expo-router (file-based routing). קבוצות: `(auth)`, `(tabs)`.
  מסכים דינמיים: `store/[id].tsx`, `collection/[id].tsx`. כלים תחת `app/tools/`.
- `src/lib/` — **שכבת הנתונים המרכזית**. כל הלוגיקה העסקית כאן.
- `src/context/` — providers (Auth, Theme).
- `src/ui/index.tsx` — רכיבי UI משותפים (Button, Card, CouponCard, StoreLogo וכו').
- `src/theme.ts` — צבעים, spacing, radius, RTL helpers, gradients.
- `supabase/functions/` — Edge Functions (Deno). `_shared/` = עזרים משותפים.
- `supabase/migrations/` — סכימת DB מצטברת (0001→0014).
- `scripts/` — כלי build/ניתוח node (`.mjs`).

## דפוס הליבה: Mock מול Supabase (הכי חשוב להבנה)

כל פונקציה ב-`src/lib` בודקת `isSupabaseConfigured` (מ-`supabase.ts`) ומנתבת:

- **אין מפתחות ב-.env** → `USE_MOCK = true` → הכול דרך `src/lib/mock/mockBackend.ts`
  (נתונים ב-AsyncStorage, משתמשי דמו מוכנים מראש).
- **יש מפתחות** → קוד עובר אוטומטית ל-Supabase.

משתמשי דמו: `demo@cashy.app`/`123456`, `admin@cashy.app`/`admin123`.
**כל תוספת פונקציונליות ב-lib חייבת לתמוך בשני המסלולים** (mock + supabase).

## מודל נתונים (טבלאות = טיפוסים ב-src/lib/types.ts)

- `profiles` — פרופיל משתמש, נוצר אוטומטית בהרשמה.
- `stores` — חנויות + שיעור קאשבק + `affiliate_url_template` (עם `{SUBID}`) +
  `network`/`network_offer_id`. חנות "עוקבת" רק אם יש לה תבנית קישור.
- `clicks` — קליק אישי עם `token` (מוזרק כ-subid בקישור).
- `coupons` — קופונים/דילים, מקושרים לחנות, upsert לפי `network`+`network_coupon_id`.
- `cashback_transactions` — סטטוסים: pending → confirmed → paid / rejected.
- `payout_requests` — בקשות משיכה: requested → paid / rejected.

## חישוב קאשבק (עקבי בלקוח ובשרת)

`cashback ללקוח = עמלת_הרשת × (user_share_percent / 100)`

- לקוח: `computeUserCashback` ב-`src/lib/cashback.ts`.
- שרת: `computeCashback` ב-`supabase/functions/postback/index.ts`.
- משלמים למשתמש רק על `confirmed` (לא pending — רכישות עלולות להתבטל).

## חיבור אתרים / רשתות שותפים (השלב הפעיל כרגע)

- הפשטה: interface `AffiliateNetwork` ב-`supabase/functions/_shared/networks.ts`.
  מימושים אמיתיים: `AdmitadNetwork`, `AwinNetwork`. הוספת רשת = מימוש הממשק + רישום
  ב-`getNetwork()`/`getNetworks()`.
- **Admitad:** מזכה דרך `postback` (webhook עם secret ו-subid).
- **Awin:** מזכה דרך `sync-awin` שמושך transactions ב-API (מומלץ cron יומי).
- `sync-stores` מושך תוכניות מחוברות → ממלא `affiliate_url_template` ושיעור.
  יש מצב דו"ח כיסוי: `?coverage=1` (לא כותב ל-DB).
- `sync-coupons` מושך קופונים ומקשר לחנות לפי network_offer_id או דומיין.
- `pickBestPerDomain` (ב-sync-stores) משאיר פעילה חנות אחת לכל דומיין — זו עם
  הקאשבק האפקטיבי הגבוה ביותר, ומשבית כפילויות.
- סודות מוגדרים ב-Supabase Functions Secrets (ראה `supabase/functions/.env.example`).
  **לעולם לא לשמור סודות אמיתיים ב-git** — לכן ב-0013_daily_cron.sql הסוד הוא placeholder.

## קונבנציות קוד

- ממשק בעברית, RTL. `_layout.tsx` כופה `I18nManager.forceRTL`.
- טקסטים למשתמש ותגובות — בעברית. הערות קוד — בעברית.
- סגנון: פונקציות עם JSDoc קצר בעברית; פונקציונלי, ללא classes בצד הלקוח.
- עיצוב דרך `src/theme.ts` (colors/spacing/radius/rtl) — לא ערכים קשיחים.
- רכיבי UI משותפים מ-`src/ui` — לא ליצור כפילויות.
- imports עם alias `@/` (למשל `@/lib/cashback`, `@/context/AuthContext`).

## הרצה ואימות

- `npm run start` — רץ מיד במצב דמו, בלי הגדרות.
- `npm run typecheck` — אימות טיפוסים. הריצו לאחר שינויי קוד.
- `npm run build:web` — ייצוא web + inject-head.
- שרתי dev (expo start) הם ארוכי-ריצה — שהמשתמש יריץ ידנית, לא דרך פקודה חוסמת.

## מצב בשלות ופערים ידועים

- בשל: כל זרימת MVP במצב demo, אינטגרציית Admitad+Awin, פאנל ניהול, משיכות,
  מחיקת חשבון, פריסת Netlify, cron.
- פתוח: סנכרון סטטוס תקופתי מ-Admitad Statistics API, התראות push,
  סימולציית רכישה זמינה רק ב-mock (בכוונה — דורש service role).

## מיפוי מסכים (app/ — expo-router)

ניתוב מבוסס-קבצים. `_layout.tsx` הראשי כופה RTL + עוטף ב-Theme/Auth providers,
ומכיל `AuthGate` שמנתב: אורח → `(auth)/sign-in`, מחובר בתוך `(auth)` → `(tabs)`.

### `(auth)` — אורחים בלבד

- `sign-in.tsx` — התחברות (אימייל+סיסמה, Google OAuth). מציג באנר "מצב דמו" כש-`!isSupabaseConfigured`.
- `sign-up.tsx` — הרשמה (שם, טלפון, אימייל, סיסמה).

### `(tabs)` — 4 טאבים תחתונים (bottom tab bar צף)

- `index.tsx` — **חנויות** (מסך הבית). גריד 3-טורים, חיפוש, קטגוריות, מיון
  (פופולריות/קאשבק/א-ב), מועדפים, קרוסלות "דילים חמים" ו"נצפו לאחרונה", כלים.
- `deals.tsx` — **דילים** (קופונים). חיפוש + סינון לפי קטגוריה. לחיצה → מסך החנות.
- `wallet.tsx` — **ארנק**. סיכום (זמין/ממתין/שולם), progress ל-`MIN_PAYOUT=20`,
  בקשת משיכה, היסטוריית עסקאות עם סינון סטטוס. משיכה זמינה רק על confirmed.
- `profile.tsx` — **פרופיל**. פרטי משתמש, היסטוריית משיכות, toggle מצב לילה,
  קישורים (כלים/חנויות/קולקציות/תוסף), תמיכה/פרטיות/תנאים, וניהול חשבון
  (פאנל ניהול מוצג רק ל-`is_admin`, עריכת פרופיל, מחיקת חשבון, יציאה).

### מסכים ברמת השורש (app/)

- `store/[id].tsx` — מסך חנות. הפעלת קאשבק, קופונים, ובמצב mock — "סימולציית רכישה".
  משתמש ב-`isStoreTrackable` להצגת שיעור אמיתי מול "בקרוב".
- `collection/[id].tsx` + `collections.tsx` — קולקציות חנויות אצורות.
- `admin.tsx` — פאנל ניהול (חוסם לא-מנהלים ב-UI). אישור/דחיית עסקאות ממתינות,
  סימון משיכות כשולמו. מציג פרטי משתמש (טלפון/אימייל) לתשלום ידני בביט.
- `all-shops.tsx`, `search.tsx`, `browser-extension.tsx`, `edit-profile.tsx`,
  `support.tsx`, `privacy.tsx`, `terms.tsx`.
- `tools/` — כלים: `calculator`, `currency`, `tax`, `tracking`, `guide`, `index`.

### הערות UI חשובות

- `Alert` לא עובד ב-web → לאישורים משתמשים ב-`window.confirm`/`window.alert`
  (ראה `confirmAction` ב-profile.tsx). לשמר את הדפוס הזה בקוד חוצה-פלטפורמות.
- כל מסך מרענן ב-`useFocusEffect` (טעינה מחדש בכל כניסה לטאב).

## מדיניות RLS ואבטחת DB (מהמיגרציות)

RLS מופעל על כל הטבלאות. עקרונות:

- **profiles** — כל משתמש קורא/מעדכן רק את עצמו (`auth.uid() = id`).
- **stores** — קריאה ציבורית לחנויות פעילות (`active = true`), גם ללא התחברות.
- **clicks** — המשתמש יוצר/קורא רק את שלו.
- **cashback_transactions** — המשתמש **רק קורא** את שלו. אין insert/update למשתמשים
  רגילים — יצירה/עדכון נעשים ע"י השרת (service role) דרך postback/sync-awin.
- **payout_requests** — המשתמש יוצר/קורא רק את שלו. אישור תשלום ע"י service role.
- **admin** (0003) — `is_admin()` (security definer, מונע רקורסיה) מוסיף מדיניות
  select/update למנהלים על עסקאות ומשיכות. `mark_payout_paid` בודק `is_admin()`.
- יצירת פרופיל אוטומטית: trigger `on_auth_user_created` → `handle_new_user()`.
- להפוך משתמש למנהל: `update profiles set is_admin=true where id=(...)` (ידני ב-SQL).

### כללי עבודה נגזרים

- אין ליצור/לעדכן עסקאות קאשבק או לאשר משיכות מקוד הלקוח מול Supabase — זה שבור
  בכוונה ב-RLS. פעולות כאלה חייבות לעבור דרך Edge Function עם service role.
- הוספת שדה לטבלה = מיגרציה חדשה ממוספרת (`00NN_description.sql`) + עדכון
  הטיפוס ב-`src/lib/types.ts` + תמיכה מקבילה ב-`mockBackend.ts`.
