import { CashbackType } from './types';

const ils = new Intl.NumberFormat('he-IL', {
  style: 'currency',
  currency: 'ILS',
  maximumFractionDigits: 2,
});

/** מעצב סכום כספי בש"ח, למשל: ‏₪12.50 */
export function formatMoney(amount: number): string {
  return ils.format(amount ?? 0);
}

/** תיאור קריא של תנאי הקאשבק בחנות. */
export function formatCashbackLabel(type: CashbackType, value: number): string {
  if (type === 'percent') return `${value}% קאשבק`;
  return `${formatMoney(value)} קאשבק`;
}

/** תאריך קצר בעברית. */
export function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('he-IL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

/** מחלץ דומיין מכתובת URL (למשל https://www.booking.com/x -> booking.com). */
function domainFromUrl(url: string): string {
  const cleaned = url.replace(/^https?:\/\//, '').replace(/^www\./, '');
  return cleaned.split('/')[0];
}

/**
 * מחזיר לוגו למותג: משתמש ב-logo_url אם קיים, אחרת נגזר מהדומיין דרך Clearbit.
 * למשל booking.com -> https://logo.clearbit.com/booking.com
 */
export function brandLogoUrl(store: {
  logo_url: string | null;
  base_url: string;
}): string | null {
  if (store.logo_url) return store.logo_url;
  const domain = domainFromUrl(store.base_url);
  return domain ? `https://logo.clearbit.com/${domain}` : null;
}

