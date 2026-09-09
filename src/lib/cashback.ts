import * as Crypto from "expo-crypto";
import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";
import { isSupabaseConfigured, supabase } from "./supabase";
import {
  CashbackTransaction,
  Coupon,
  PayoutRequest,
  Store,
  UserBrief,
  WalletSummary,
} from "./types";
import * as mock from "./mock/mockBackend";

const USE_MOCK = !isSupabaseConfigured;

/**
 * בונה קישור שותפים אישי לחנות עבור טוקן מעקב נתון.
 * הטוקן משמש בהמשך לשיוך הרכישה למשתמש כשרשת השותפים שולחת אישור.
 */
export function buildAffiliateUrl(store: Store, token: string): string {
  if (store.affiliate_url_template) {
    return store.affiliate_url_template.replace(
      "{SUBID}",
      encodeURIComponent(token),
    );
  }
  const sep = store.base_url.includes("?") ? "&" : "?";
  return `${store.base_url}${sep}subid=${encodeURIComponent(token)}`;
}

/**
 * מחשב את הקאשבק שחוזר למשתמש עבור רכישה נתונה:
 * העמלה מהרשת (אחוז מההזמנה או סכום קבוע) כפול חלק המשתמש.
 */
export function computeUserCashback(store: Store, orderAmount: number): number {
  const commission =
    store.cashback_type === "percent"
      ? (orderAmount * store.cashback_value) / 100
      : store.cashback_value;
  const userCashback = (commission * store.user_share_percent) / 100;
  return Math.round(userCashback * 100) / 100;
}

/**
 * מפעיל קאשבק לחנות: יוצר טוקן ייחודי, רושם קליק ופותח את קישור השותפים.
 * מחזיר את כתובת ההפניה שנפתחה.
 */
export async function activateCashback(
  store: Store,
  userId: string,
): Promise<string> {
  const token = Crypto.randomUUID();
  const redirectUrl = buildAffiliateUrl(store, token);

  // ב-web: פותחים לשונית מיד על לחיצת המשתמש כדי שהדפדפן לא יחסום פופ-אפ.
  const isWeb = Platform.OS === "web";
  const webWindow =
    isWeb && typeof window !== "undefined"
      ? window.open(redirectUrl, "_blank")
      : null;

  if (USE_MOCK) {
    await mock.createClick(userId, store.id, token, redirectUrl);
  } else {
    const { error } = await supabase.from("clicks").insert({
      user_id: userId,
      store_id: store.id,
      token,
      redirect_url: redirectUrl,
    });
    if (error) throw error;
  }

  if (!isWeb) {
    await WebBrowser.openBrowserAsync(redirectUrl);
  } else if (!webWindow && typeof window !== "undefined") {
    // אם הפופ-אפ נחסם — ניווט באותה לשונית כגיבוי.
    window.location.href = redirectUrl;
  }
  return redirectUrl;
}

/** מחשב סיכום ארנק מרשימת עסקאות. */
export function summarizeWallet(txns: CashbackTransaction[]): WalletSummary {
  const summary: WalletSummary = {
    pending: 0,
    confirmed: 0,
    paid: 0,
    available: 0,
  };
  for (const t of txns) {
    if (t.status === "pending") summary.pending += t.cashback_amount;
    else if (t.status === "confirmed") summary.confirmed += t.cashback_amount;
    else if (t.status === "paid") summary.paid += t.cashback_amount;
  }
  summary.available = summary.confirmed;
  return summary;
}

/** שולף את כל עסקאות הקאשבק של המשתמש. */
export async function fetchTransactions(
  userId: string,
): Promise<CashbackTransaction[]> {
  if (USE_MOCK) return mock.listTransactions(userId);
  const { data, error } = await supabase
    .from("cashback_transactions")
    .select("*, store:stores(name, logo_url)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as CashbackTransaction[];
}

/** שולף את החנויות הפעילות. */
export async function fetchStores(): Promise<Store[]> {
  if (USE_MOCK) return mock.listStores();
  const { data, error } = await supabase
    .from("stores")
    .select("*")
    .eq("active", true)
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Store[];
}

/** שולף חנות בודדת לפי מזהה. */
export async function fetchStore(id: string): Promise<Store | null> {
  if (USE_MOCK) return mock.getStore(id);
  const { data } = await supabase
    .from("stores")
    .select("*")
    .eq("id", id)
    .single();
  return (data as Store) ?? null;
}

// ===================== קופונים / דילים (Coupons) =====================

const COUPON_SELECT = "*, store:stores(name, logo_url, base_url, category)";

/** שולף קופונים פעילים — הכול או לחנות מסוימת (דילים חמים ראשונים). */
export async function fetchCoupons(storeId?: string): Promise<Coupon[]> {
  if (USE_MOCK) return mock.listCoupons(storeId);
  let q = supabase.from("coupons").select(COUPON_SELECT).eq("active", true);
  if (storeId) q = q.eq("store_id", storeId);
  const { data, error } = await q
    .order("featured", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Coupon[];
}

/** שולף את הדילים החמים (featured) לקרוסלת עמוד הבית. */
export async function fetchFeaturedCoupons(): Promise<Coupon[]> {
  if (USE_MOCK) return mock.listFeaturedCoupons();
  const { data, error } = await supabase
    .from("coupons")
    .select(COUPON_SELECT)
    .eq("active", true)
    .eq("featured", true)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Coupon[];
}

/**
 * סימולציית רכישה (mock postback): יוצרת עסקת קאשבק חדשה במצב "ממתין".
 * במצב Supabase נדרש Backend עם service role – ולכן זמין רק במצב דמו.
 */
export async function simulatePurchase(
  store: Store,
  userId: string,
  orderAmount: number,
): Promise<CashbackTransaction> {
  const cashback = computeUserCashback(store, orderAmount);
  if (USE_MOCK) {
    return mock.simulatePurchase(userId, store.id, orderAmount, cashback);
  }
  throw new Error("סימולציית רכישה זמינה רק במצב דמו (ללא Supabase).");
}

// ===================== משיכות (Payouts) =====================

export async function fetchPayouts(userId: string): Promise<PayoutRequest[]> {
  if (USE_MOCK) return mock.listPayouts(userId);
  const { data, error } = await supabase
    .from("payout_requests")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as PayoutRequest[];
}

export async function requestPayout(
  userId: string,
  amount: number,
): Promise<PayoutRequest> {
  if (USE_MOCK) return mock.requestPayout(userId, amount);
  const { data, error } = await supabase
    .from("payout_requests")
    .insert({ user_id: userId, amount })
    .select("*")
    .single();
  if (error) throw error;
  return data as PayoutRequest;
}

// ===================== ניהול (Admin) =====================

// מעשיר רשומות עם user_id בפרטי המשתמש (שם/אימייל/טלפון) מטבלת profiles.
async function attachUsers<T extends { user_id: string; user?: UserBrief }>(
  rows: T[],
): Promise<T[]> {
  const ids = [...new Set(rows.map((r) => r.user_id))];
  if (ids.length === 0) return rows;
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, email, phone")
    .in("id", ids);
  const map = new Map(
    (data ?? []).map((p: any) => [
      p.id,
      { full_name: p.full_name, email: p.email, phone: p.phone } as UserBrief,
    ]),
  );
  return rows.map((r) => ({ ...r, user: map.get(r.user_id) }));
}

export async function adminFetchPendingTransactions(): Promise<
  CashbackTransaction[]
> {
  if (USE_MOCK) return mock.adminListPendingTransactions();
  const { data, error } = await supabase
    .from("cashback_transactions")
    .select("*, store:stores(name, logo_url)")
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return attachUsers((data ?? []) as CashbackTransaction[]);
}

export async function adminSetTransactionStatus(
  id: string,
  status: "confirmed" | "rejected",
): Promise<void> {
  if (USE_MOCK) return mock.adminSetTransactionStatus(id, status);
  const { error } = await supabase
    .from("cashback_transactions")
    .update({
      status,
      confirmed_at: status === "confirmed" ? new Date().toISOString() : null,
    })
    .eq("id", id);
  if (error) throw error;
}

export async function adminFetchPayouts(): Promise<PayoutRequest[]> {
  if (USE_MOCK) return mock.adminListPayouts();
  const { data, error } = await supabase
    .from("payout_requests")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return attachUsers((data ?? []) as PayoutRequest[]);
}

export async function adminMarkPayoutPaid(id: string): Promise<void> {
  if (USE_MOCK) return mock.adminMarkPayoutPaid(id);
  const { error } = await supabase.rpc("mark_payout_paid", { payout_id: id });
  if (error) throw error;
}
