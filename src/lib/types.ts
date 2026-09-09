/** טיפוסי הנתונים המרכזיים של CashyCash. משקפים את טבלאות ה-DB. */

export type CashbackType = "percent" | "fixed";

/** משתמש מחובר – טיפוס אחיד שעובד גם במצב Mock וגם מול Supabase. */
export interface AppUser {
  id: string;
  email: string;
  full_name: string | null;
  /** מספר טלפון (לתשלום קאשבק בביט). */
  phone: string | null;
  /** האם המשתמש הוא מנהל (בעל גישה לפאנל הניהול). */
  is_admin: boolean;
}

/** פרטי משתמש מקוצרים לתצוגת אדמין (מי מקבל את הקאשבק). */
export interface UserBrief {
  full_name: string | null;
  email: string | null;
  phone: string | null;
}

export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  created_at: string;
}

export interface Store {
  id: string;
  name: string;
  category: string | null;
  description: string | null;
  logo_url: string | null;
  /** כתובת היעד של החנות (ללא פרמטרי מעקב). */
  base_url: string;
  /**
   * תבנית קישור השותפים. הטוקן האישי של המשתמש מוחלף במקום {SUBID}.
   * לדוגמה: https://network.example/click?adv=123&subid={SUBID}&url=https%3A%2F%2Fstore.com
   * אם ריק – נשתמש ב-base_url עם פרמטר subid.
   */
  affiliate_url_template: string | null;
  cashback_type: CashbackType;
  /** אחוז (0-100) אם percent, או סכום בש"ח אם fixed. */
  cashback_value: number;
  /** אחוז מתוך העמלה שחוזר ללקוח (0-100). */
  user_share_percent: number;
  active: boolean;
  created_at: string;
  /** שם רשת השותפים שממנה סונכרנה החנות (למשל admitad). */
  network?: string | null;
  /** מזהה המפרסם/ההצעה ברשת השותפים. */
  network_offer_id?: string | null;
  /** האם שיעור הקאשבק משתנה בין פריטים (מציגים "עד"). */
  variable?: boolean | null;
}

export type CashbackStatus = "pending" | "confirmed" | "paid" | "rejected";

export interface CashbackTransaction {
  id: string;
  user_id: string;
  store_id: string;
  click_id: string | null;
  /** סכום הרכישה שדווח ע"י רשת השותפים. */
  order_amount: number | null;
  /** הקאשבק שמגיע ללקוח (בש"ח). */
  cashback_amount: number;
  status: CashbackStatus;
  network_txn_id: string | null;
  created_at: string;
  confirmed_at: string | null;
  /** מצורף ב-join עם טבלת stores. */
  store?: Pick<Store, "name" | "logo_url">;
  /** פרטי המשתמש שמקבל את הקאשבק (מצורף בתצוגת אדמין). */
  user?: UserBrief;
}

export interface Click {
  id: string;
  user_id: string;
  store_id: string;
  token: string;
  redirect_url: string;
  created_at: string;
}

export type PayoutStatus = "requested" | "paid" | "rejected";

export interface PayoutRequest {
  id: string;
  user_id: string;
  /** הסכום שהתבקש למשיכה (בש"ח). */
  amount: number;
  status: PayoutStatus;
  created_at: string;
  paid_at: string | null;
  /** פרטי המשתמש שמבקש את המשיכה (מצורף בתצוגת אדמין). */
  user?: UserBrief;
}

export interface WalletSummary {
  pending: number;
  confirmed: number;
  paid: number;
  /** זמין למשיכה = confirmed. */
  available: number;
}
