# 💸 CashyCash

אפליקציית קאשבק: המשתמשים גולשים לחנויות דרך קישור אישי, קונים כרגיל,
ומקבלים חלק מהעמלה בחזרה כקאשבק.

בנוי עם **Expo (React Native)** + **expo-router** + **Supabase**. ממשק בעברית (RTL), מטבע ₪.

## תכולת ה-MVP

- הרשמה והתחברות (Supabase Auth, או מצב דמו ללא שרת)
- דפדוף בחנויות עם אחוזי קאשבק
- הפעלת קאשבק: יצירת קישור שותפים אישי עם טוקן מעקב + פתיחת החנות
- ארנק: קאשבק _ממתין_ מול _מאושר_ מול _שולם_
- **סימולציית רכישה (mock postback)** — יצירת קאשבק "ממתין" ישירות מדף החנות
- **בקשות משיכה (payout)** עם סכום מינימלי
- **פאנל ניהול** — אישור/דחיית עסקאות ממתינות וסימון משיכות כשולמו

## מצב דמו (ללא Supabase) 🧪

האפליקציה רצה **מקצה לקצה בלי שום Database**. כשאין מפתחות Supabase בקובץ `.env`,
כל הנתונים מנוהלים מקומית (Mock) ונשמרים ב-AsyncStorage.

משתמשים מוכנים מראש:

| תפקיד | אימייל            | סיסמה      |
| ----- | ----------------- | ---------- |
| משתמש | `demo@cashy.app`  | `123456`   |
| מנהל  | `admin@cashy.app` | `admin123` |

זרימת בדיקה מלאה:

1. התחברו כ-`demo@cashy.app`, פתחו חנות, והשתמשו ב**"סימולציית רכישה"** ליצירת קאשבק "ממתין".
2. בארנק אפשר לשלוח **בקשת משיכה** (מעל הסכום המינימלי).
3. התחברו כ-`admin@cashy.app` ← **פאנל ניהול**: אשרו את העסקה (עוברת ל"מאושר") וסמנו את המשיכה כ"שולם".

מעבר ל-Supabase אמיתי: פשוט מלאו את `.env` — הקוד עובר אוטומטית למסלול Supabase.

## הרצה מקומית

```powershell
cd cashback-app
npm install
npm run start          # רץ מיד במצב דמו, ללא הגדרות נוספות
```

סרקו את קוד ה-QR עם אפליקציית **Expo Go** (או `npm run android` / `npm run ios`).

## הגדרת Supabase

1. צרו פרויקט חדש ב-[supabase.com](https://supabase.com).
2. `Settings > API` – העתיקו את ה-URL וה-anon key אל `.env`:
   ```
   EXPO_PUBLIC_SUPABASE_URL=...
   EXPO_PUBLIC_SUPABASE_ANON_KEY=...
   ```
3. `SQL Editor` – הדביקו והריצו את [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql).
   זה יוצר את הטבלאות, מדיניות RLS, יצירת פרופיל אוטומטית ונתוני חנויות לדוגמה.

## מודל הנתונים

| טבלה                    | תפקיד                                                        |
| ----------------------- | ------------------------------------------------------------ |
| `profiles`              | פרופיל משתמש (נוצר אוטומטית בהרשמה)                          |
| `stores`                | חנויות + אחוזי קאשבק + תבנית קישור שותפים                    |
| `clicks`                | קליק/קישור אישי עם טוקן מעקב (`token`)                       |
| `cashback_transactions` | קאשבק למשתמש עם סטטוס: pending / confirmed / paid / rejected |
| `payout_requests`       | בקשות משיכה עם סטטוס: requested / paid / rejected            |

## איך הקאשבק "נכנס" (צד שרת אמיתי)

חיבור ל**רשת שותפים אמיתית** (מומש עבור **Admitad**, בנוי להרחבה לרשתות נוספות):

1. **סנכרון חנויות** — הפונקציה `sync-stores` מושכת מ-Admitad את המפרסמים המחוברים,
   כולל תבנית קישור אמיתית (`gotolink` עם `{SUBID}`), ומעדכנת את טבלת `stores`.
2. **קליק** — כשמשתמש מפעיל קאשבק, נרשם `click` עם `token`, והקישור נפתח כשה-`token`
   מוזרק כ-`subid`.
3. **postback** — כשמתבצעת רכישה, Admitad קוראת ל-Edge Function `postback` עם ה-`subid`
   וסכום ההזמנה. הפונקציה מאתרת את הקליק, מחשבת קאשבק, ויוצרת `cashback_transaction`.
4. עדכוני סטטוס (`confirmed`/`rejected`) מגיעים באותו postback לפי שדה ה-status.

> ⚠️ משלמים למשתמש רק על קאשבק **confirmed**, לא על pending — רכישות עלולות להתבטל.

### פריסת ה-Backend

```powershell
# התקנת Supabase CLI וקישור הפרויקט
npx supabase link --project-ref <your-ref>

# הרצת המיגרציות (0001 + 0002)
npx supabase db push

# הגדרת סודות הפונקציות (ראו supabase/functions/.env.example)
npx supabase secrets set --env-file supabase/functions/.env.example

# פריסת הפונקציות
npx supabase functions deploy postback --no-verify-jwt
npx supabase functions deploy sync-stores
```

- **סנכרון חנויות:** `POST /functions/v1/sync-stores` עם כותרת `x-sync-secret: <SYNC_SECRET>`.
- **postback ב-Admitad:** הגדירו URL:
  `https://<ref>.supabase.co/functions/v1/postback?secret=<POSTBACK_SECRET>&subid={subid}&order_sum={order_sum}&payment_sum={payment_sum}&currency={currency}&status={status}&action_id={action_id}`

> להוספת רשת נוספת (Awin/CJ): ממשים את הממשק `AffiliateNetwork` ב-[`supabase/functions/_shared/networks.ts`](supabase/functions/_shared/networks.ts) ורושמים ב-`getNetwork()`.

## הצעדים הבאים

- [x] Edge Function לקליטת postback אמיתי מרשת שותפים (Admitad)
- [x] סנכרון חנויות אוטומטי מהרשת (`sync-stores`)
- [x] בקשות משיכה (payout) + סכום מינימלי
- [x] פאנל ניהול לאישור עסקאות ותשלומים
- [ ] סנכרון סטטוס תקופתי (אישור/דחייה) דרך Statistics API
- [ ] חיפוש/קטגוריות בחנויות
- [ ] התראות push על אישור קאשבק
