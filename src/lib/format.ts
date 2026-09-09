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

/** תיאור קריא של תנאי הקאשבק בחנות. */
export function formatCashbackLabel(type: CashbackType, value: number): string {
  if (type === "percent") return `${value}% קאשבק`;
  return `${formatMoney(value)} קאשבק`;
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
 * מחזיר רשימת מקורות ללוגו המותג, לניסיון לפי סדר.
 * (Clearbit נסגר ב-2023, לכן משתמשים ב-favicon של Google/DuckDuckGo.)
 */
export function brandLogoCandidates(store: {
  logo_url: string | null;
  base_url: string;
}): string[] {
  const out: string[] = [];
  const domain = domainFromUrl(store.base_url);
  // לוגו אמיתי מהרשת — אבל לא SVG (React Native לא מרנדר SVG).
  if (store.logo_url && !store.logo_url.toLowerCase().endsWith(".svg")) {
    out.push(store.logo_url);
  }
  if (domain) {
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
