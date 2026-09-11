# CashyCash — תהליכי עבודה (Workflows) ל-Kiro

מסמך זה מתעד איך מבצעים כל פעולה תפעולית בפרויקט. Kiro אמור לדעת לבצע אותן.
פקודות מותאמות ל-Windows PowerShell (מפריד פקודות: `;` — לא `&&`).

## עובדות סביבה (נבדקו)
- **Git remote:** `origin` = https://github.com/Itamarcohen2001/cashback-app
- **ענף ראשי:** `main`
- **פרויקט Supabase מקושר:** ref `lixpidmnjznnocrpydbr` (שם: CashyCash)
- **פריסת Frontend:** גם Vercel (`vercel.json`) וגם Netlify (`netlify.toml`) מוגדרים.
  ⚠️ רק `vercel.json` מריץ את `inject-head.mjs` (אימות רשת השותפים). Netlify לא.

## סקריפטים ב-package.json
- `npm run start` — Expo dev (מצב דמו מיידי). ⚠️ ארוך-ריצה — שהמשתמש יריץ ידנית.
- `npm run web` / `android` / `ios` — dev לפי פלטפורמה. ⚠️ ארוך-ריצה.
- `npm run build:web` — `expo export --platform web` + `node scripts/inject-head.mjs`.
- `npm run typecheck` — `tsc --noEmit`. **להריץ אחרי כל שינוי קוד.**

---

## Workflow 1: אימות שינויי קוד (לפני כל commit/פריסה)
```powershell
npm run typecheck
```
אם יש שגיאות טיפוסים — לתקן לפני שממשיכים. אין test runner בפרויקט (אין להמציא אחד
אלא אם המשתמש מבקש).

## Workflow 2: פריסת Frontend לפרודקשן (Vercel דרך Git)
הפריסה **אוטומטית** דרך חיבור GitHub↔Vercel:
- push ל-`main` → פריסת **production**.
- push לענף אחר / PR → **preview deployment**.

השלבים:
```powershell
npm run typecheck            # אימות
git add <קבצים ספציפיים>     # לא git add . — להוסיף קבצים מפורשות
git commit -m "<הודעה>"
git push origin main         # מפעיל build+deploy אוטומטי ב-Vercel
```
⚠️ **commit רק כשהמשתמש מבקש מפורשות** (ראה כללי git במערכת).
⚠️ **push ל-main = פרודקשן חי.** לפעולה בעלת השפעה — לאשר עם המשתמש קודם.

פריסה ידנית חלופית (אם צריך, בלי git):
```powershell
vercel            # preview
vercel --prod     # production
```

### משתני סביבה בפרודקשן (קריטי!)
ה-build קורא בזמן build: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
הקובץ `.env` ב-.gitignore ולא מגיע לפלטפורמת הפריסה. אם המשתנים לא מוגדרים
ב-Vercel (Settings > Environment Variables, סביבת Production) → הפרודקשן ירוץ
**במצב דמו (mock)** במקום מול Supabase. אחרי הוספה/שינוי משתנה → צריך re-deploy.

## Workflow 3: פריסת Backend (Supabase Edge Functions)
ה-backend **נפרס בנפרד** מה-frontend — Vercel לא נוגע בו.
```powershell
# פעם אחת — קישור (כבר מקושר ל-lixpidmnjznnocrpydbr):
npx supabase link --project-ref lixpidmnjznnocrpydbr

# מיגרציות DB:
npx supabase db push

# סודות הפונקציות (מתוך קובץ מלא ערכים — לא מה-.env.example הריק):
npx supabase secrets set --env-file supabase/functions/.env.example

# פריסת פונקציות בודדות:
npx supabase functions deploy postback --no-verify-jwt   # חייב --no-verify-jwt (webhook חיצוני)
npx supabase functions deploy sync-stores
npx supabase functions deploy sync-coupons
npx supabase functions deploy sync-awin
npx supabase functions deploy delete-account
```
⚠️ `postback` **חייב** `--no-verify-jwt` — הרשת קוראת לו בלי JWT (מאובטח ע"י secret).
שאר הפונקציות עם אימות רגיל.

## Workflow 4: הוספת מיגרציית DB
1. ליצור `supabase/migrations/00NN_description.sql` (מספר עוקב לאחרון = 0014).
2. אם נוסף/שונה שדה בטבלה: לעדכן `src/lib/types.ts` **וגם** `src/lib/mock/mockBackend.ts`.
3. `npx supabase db push` לפריסה.
⚠️ לעולם לא לשמור סודות אמיתיים במיגרציה (ראה 0013 — placeholder ל-SYNC_SECRET).

## Workflow 5: סנכרון חנויות/קופונים מרשת השותפים
מריצים ידנית או דרך cron (0013). קריאות מאובטחות ב-`x-sync-secret`:
```powershell
# סנכרון חנויות:
curl -X POST "https://lixpidmnjznnocrpydbr.supabase.co/functions/v1/sync-stores" -H "x-sync-secret: <SYNC_SECRET>"

# דו"ח כיסוי בלבד (לא כותב ל-DB) — כמה חנויות מהקטלוג כבר מחוברות:
curl -X POST "https://lixpidmnjznnocrpydbr.supabase.co/functions/v1/sync-stores?coverage=1" -H "x-sync-secret: <SYNC_SECRET>"

# סנכרון קופונים:
curl -X POST "https://lixpidmnjznnocrpydbr.supabase.co/functions/v1/sync-coupons" -H "x-sync-secret: <SYNC_SECRET>"

# דגימת קופונים גולמית לדיבאג:
curl -X POST "https://lixpidmnjznnocrpydbr.supabase.co/functions/v1/sync-coupons?sample=1&network=admitad" -H "x-sync-secret: <SYNC_SECRET>"
```
תזמון אוטומטי כבר מוגדר ב-0013_daily_cron.sql (דילים יומי 03:00 UTC, חנויות שבועי).

## Workflow 6: הגדרת postback ברשת (Admitad)
ב-Admitad מגדירים URL (חד-פעמי, לא דרך קוד):
```
https://lixpidmnjznnocrpydbr.supabase.co/functions/v1/postback?secret=<POSTBACK_SECRET>&subid={subid}&order_sum={order_sum}&payment_sum={payment_sum}&currency={currency}&status={status}&action_id={action_id}
```
Awin שונה — אין postback; זיכוי דרך `sync-awin` (מומלץ cron יומי).

---

## עקרונות בטיחות תפעוליים (חשוב ל-Kiro)
- **push ל-main מפרסם לפרודקשן חי** — פעולה בעלת השפעה. לאשר עם המשתמש.
- **commit רק לפי בקשה מפורשת** של המשתמש.
- **סודות** — לא לקרוא/להדפיס ערכי `.env` או secrets. להתייחס אליהם בשם המפתח בלבד.
- **שרתי dev ארוכי-ריצה** (expo start) — לא להריץ בפקודה חוסמת; שהמשתמש יריץ ידנית.
- לפני פריסה — תמיד `npm run typecheck`.
