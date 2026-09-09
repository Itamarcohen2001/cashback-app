import { CashbackType } from "./types";

const ils = new Intl.NumberFormat("he-IL", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * מעצב סכום כספי בש"ח בצורה עקבית: המספר ואז ₪ (הסמל תמיד מימין למספר).
 * עטוף ב-LTR isolate כדי שהתצוגה תהיה זהה בכל הקשר (כרטיס/רשימה).
 */
export function formatMoney(amount: number): string {
  return `\u2066${ils.format(amount ?? 0)} \u20AA\u2069`;
}

/** תיאור קריא של תנאי הקאשבק בחנות (שיעור העמלה הגולמי). */
export function formatCashbackLabel(type: CashbackType, value: number): string {
  if (type === "percent") return `${value}% קאשבק`;
  return `${formatMoney(value)} קאשבק`;
}

/** מעגל אחוז לתצוגה נעימה (עד ספרה אחת אחרי הנקודה, בלי .0 מיותר). */
function roundRate(n: number): number {
  return Math.round(n * 10) / 10;
}

/**
 * הקאשבק שהמשתמש מקבל בפועל = שיעור העמלה × חלק המשתמש.
 * לחנויות עם שיעור משתנה (variable) מוסיפים "עד".
 */
export function formatUserCashback(store: {
  cashback_type: CashbackType;
  cashback_value: number;
  user_share_percent: number;
  variable?: boolean | null;
}): string {
  const share = (store.user_share_percent ?? 0) / 100;
  const prefix = store.variable ? "עד " : "";
  if (store.cashback_type === "percent") {
    return `${prefix}${roundRate(store.cashback_value * share)}% קאשבק`;
  }
  return `${prefix}${formatMoney(store.cashback_value * share)} קאשבק`;
}

/** תאריך קצר בעברית. */
export function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("he-IL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

/** מחלץ דומיין מכתובת URL (למשל https://www.booking.com/x -> booking.com). */
function domainFromUrl(url: string): string {
  const cleaned = url.replace(/^https?:\/\//, "").replace(/^www\./, "");
  return cleaned.split("/")[0];
}

/**
 * override ידני ללוגואים איכותיים (לפי דומיין ללא www).
 * משתמשים בזה כשה-favicon מטושטש/שגוי. עדיף PNG/JPG שקוף וברזולוציה גבוהה.
 */
const LOGO_OVERRIDES: Record<string, string> = {
  "fox.co.il":
    "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/FOX_Israel_logo.svg/512px-FOX_Israel_logo.svg.png",
  "shilav.co.il": "https://www.shilav.co.il/cdn/shop/files/shilav-logo.png",
  "alm.co.il": "https://www.alm.co.il/media/logo/stores/1/alm-logo.png",
};

/**
 * מחזיר רשימת מקורות ללוגו המותג, לניסיון לפי סדר.
 * סדר: override ידני -> logo_url מה-DB -> icon.horse (רזולוציה גבוהה) -> Google -> DuckDuckGo.
 * (Clearbit נסגר ב-2023.)
 */
export function brandLogoCandidates(store: {
  logo_url: string | null;
  base_url: string;
}): string[] {
  const out: string[] = [];
  const domain = domainFromUrl(store.base_url);
  const override = LOGO_OVERRIDES[domain];
  if (override) out.push(override);
  // לוגו אמיתי מה-DB — אבל לא SVG (React Native לא מרנדר SVG).
  if (store.logo_url && !store.logo_url.toLowerCase().endsWith(".svg")) {
    out.push(store.logo_url);
  }
  if (domain) {
    // icon.horse מחזיר את האייקון הגדול/איכותי ביותר שקיים לאתר.
    out.push(`https://icon.horse/icon/${domain}`);
    out.push(`https://www.google.com/s2/favicons?sz=128&domain=${domain}`);
    out.push(`https://icons.duckduckgo.com/ip3/${domain}.ico`);
  }
  return out;
}

/**
 * מחזיר לוגו למותג: משתמש ב-logo_url אם קיים, אחרת נגזר מהדומיין דרך Clearbit.
 */
export function brandLogoUrl(store: {
  logo_url: string | null;
  base_url: string;
}): string | null {
  return brandLogoCandidates(store)[0] ?? null;
}
