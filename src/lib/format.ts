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
