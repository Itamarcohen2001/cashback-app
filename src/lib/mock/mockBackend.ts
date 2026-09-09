/**
 * Backend מדומה (Mock) של CashyCash.
 * מאפשר להריץ את כל האפליקציה מקצה-לקצה ללא Supabase — כל הנתונים
 * נשמרים מקומית ב-AsyncStorage. מופעל אוטומטית כשאין מפתחות Supabase.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";
import {
  AppUser,
  CashbackTransaction,
  Click,
  PayoutRequest,
  Store,
  UserBrief,
} from "../types";

const STORAGE_KEY = "cashy_mock_db_v2";

interface MockUser {
  id: string;
  email: string;
  password: string;
  full_name: string | null;
  phone: string | null;
  is_admin: boolean;
}

interface MockDb {
  users: MockUser[];
  sessionUserId: string | null;
  stores: Store[];
  clicks: Click[];
  transactions: CashbackTransaction[];
  payouts: PayoutRequest[];
}

type AuthListener = (user: AppUser | null) => void;

let db: MockDb | null = null;
let loadPromise: Promise<MockDb> | null = null;
const listeners = new Set<AuthListener>();

function now(): string {
  return new Date().toISOString();
}

function uid(): string {
  return Crypto.randomUUID();
}

function seedStores(): Store[] {
  const base = (
    name: string,
    category: string,
    description: string,
    baseUrl: string,
    cashbackType: "percent" | "fixed",
    cashbackValue: number,
    userShare: number,
  ): Store => ({
    id: uid(),
    name,
    category,
    description,
    logo_url: null,
    base_url: baseUrl,
    affiliate_url_template: null,
    cashback_type: cashbackType,
    cashback_value: cashbackValue,
    user_share_percent: userShare,
    active: true,
    created_at: now(),
  });

  return [
    base(
      "AliExpress",
      "קניות כלליות",
      "מגוון עצום של מוצרים במחירים משתלמים.",
      "https://www.aliexpress.com",
      "percent",
      8,
      60,
    ),
    base(
      "Booking.com",
      "טיסות ומלונות",
      "הזמנת מלונות ולינה ברחבי העולם.",
      "https://www.booking.com",
      "percent",
      4,
      70,
    ),
    base(
      "ASOS",
      "אופנה",
      "אופנה ואקססוריז לגברים ולנשים.",
      "https://www.asos.com",
      "percent",
      6,
      55,
    ),
    base(
      "KSP",
      "אלקטרוניקה",
      "מחשבים, גאדג'טים ומוצרי חשמל.",
      "https://ksp.co.il",
      "percent",
      3,
      50,
    ),
    base(
      "Terminal X",
      "אופנה",
      "מותגי אופנה מובילים בישראל.",
      "https://www.terminalx.com",
      "percent",
      5,
      60,
    ),
    base(
      "iHerb",
      "בריאות וטבע",
      "תוספי תזונה ומוצרים אורגניים.",
      "https://www.iherb.com",
      "fixed",
      20,
      50,
    ),
  ];
}

function seed(): MockDb {
  const stores = seedStores();
  const demoUser: MockUser = {
    id: "demo-user",
    email: "demo@cashy.app",
    password: "123456",
    full_name: "משתמש דמו",
    phone: "050-1234567",
    is_admin: false,
  };
  const adminUser: MockUser = {
    id: "admin-user",
    email: "admin@cashy.app",
    password: "admin123",
    full_name: "מנהל CashyCash",
    phone: null,
    is_admin: true,
  };

  // עסקאות דוגמה למשתמש הדמו כדי שהארנק לא יהיה ריק.
  const transactions: CashbackTransaction[] = [
    {
      id: uid(),
      user_id: demoUser.id,
      store_id: stores[0].id,
      click_id: null,
      order_amount: 250,
      cashback_amount: 12,
      status: "confirmed",
      network_txn_id: "seed-1",
      created_at: now(),
      confirmed_at: now(),
      store: { name: stores[0].name, logo_url: stores[0].logo_url },
    },
    {
      id: uid(),
      user_id: demoUser.id,
      store_id: stores[2].id,
      click_id: null,
      order_amount: 180,
      cashback_amount: 5.94,
      status: "pending",
      network_txn_id: "seed-2",
      created_at: now(),
      confirmed_at: null,
      store: { name: stores[2].name, logo_url: stores[2].logo_url },
    },
  ];

  return {
    users: [demoUser, adminUser],
    sessionUserId: null,
    stores,
    clicks: [],
    transactions,
    payouts: [],
  };
}

async function persist(): Promise<void> {
  if (!db) return;
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

async function load(): Promise<MockDb> {
  if (db) return db;
  if (loadPromise) return loadPromise;
  loadPromise = (async () => {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      db = JSON.parse(raw) as MockDb;
    } else {
      db = seed();
      await persist();
    }
    return db;
  })();
  return loadPromise;
}

function toAppUser(u: MockUser | undefined | null): AppUser | null {
  if (!u) return null;
  return {
    id: u.id,
    email: u.email,
    full_name: u.full_name,
    phone: u.phone,
    is_admin: u.is_admin,
  };
}

// פרטי משתמש מקוצרים לתצוגת אדמין.
function briefFor(d: MockDb, userId: string): UserBrief | undefined {
  const u = d.users.find((x) => x.id === userId);
  if (!u) return undefined;
  return { full_name: u.full_name, email: u.email, phone: u.phone };
}

function notify(): void {
  const user = db
    ? toAppUser(db.users.find((u) => u.id === db!.sessionUserId))
    : null;
  listeners.forEach((cb) => cb(user));
}

// ===================== Auth =====================

export function subscribe(cb: AuthListener): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export async function getSessionUser(): Promise<AppUser | null> {
  const d = await load();
  return toAppUser(d.users.find((u) => u.id === d.sessionUserId));
}

export async function signIn(email: string, password: string): Promise<void> {
  const d = await load();
  const user = d.users.find(
    (u) => u.email.toLowerCase() === email.toLowerCase(),
  );
  if (!user || user.password !== password) {
    throw new Error("פרטי התחברות שגויים");
  }
  d.sessionUserId = user.id;
  await persist();
  notify();
}

export async function signUp(
  email: string,
  password: string,
  fullName: string,
  phone: string | null,
): Promise<void> {
  const d = await load();
  if (d.users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
    throw new Error("כתובת האימייל כבר רשומה");
  }
  const user: MockUser = {
    id: uid(),
    email,
    password,
    full_name: fullName || null,
    phone: phone || null,
    is_admin: false,
  };
  d.users.push(user);
  d.sessionUserId = user.id;
  await persist();
  notify();
}

export async function signOut(): Promise<void> {
  const d = await load();
  d.sessionUserId = null;
  await persist();
  notify();
}

export async function updateProfile(
  fullName: string,
  phone: string,
): Promise<void> {
  const d = await load();
  const u = d.users.find((x) => x.id === d.sessionUserId);
  if (!u) throw new Error("לא מחובר");
  u.full_name = fullName || null;
  u.phone = phone || null;
  await persist();
  notify();
}

export async function updatePassword(newPassword: string): Promise<void> {
  const d = await load();
  const u = d.users.find((x) => x.id === d.sessionUserId);
  if (!u) throw new Error("לא מחובר");
  u.password = newPassword;
  await persist();
}

// ===================== Stores =====================

export async function listStores(): Promise<Store[]> {
  const d = await load();
  return d.stores
    .filter((s) => s.active)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function getStore(id: string): Promise<Store | null> {
  const d = await load();
  return d.stores.find((s) => s.id === id) ?? null;
}

// ===================== Clicks =====================

export async function createClick(
  userId: string,
  storeId: string,
  token: string,
  redirectUrl: string,
): Promise<Click> {
  const d = await load();
  const click: Click = {
    id: uid(),
    user_id: userId,
    store_id: storeId,
    token,
    redirect_url: redirectUrl,
    created_at: now(),
  };
  d.clicks.push(click);
  await persist();
  return click;
}

// ===================== Transactions =====================

export async function listTransactions(
  userId: string,
): Promise<CashbackTransaction[]> {
  const d = await load();
  return d.transactions
    .filter((t) => t.user_id === userId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

/** מדמה postback מרשת שותפים: יוצר עסקת קאשבק חדשה במצב "ממתין". */
export async function simulatePurchase(
  userId: string,
  storeId: string,
  orderAmount: number,
  cashbackAmount: number,
): Promise<CashbackTransaction> {
  const d = await load();
  const store = d.stores.find((s) => s.id === storeId);
  const lastClick = [...d.clicks]
    .reverse()
    .find((c) => c.user_id === userId && c.store_id === storeId);
  const txn: CashbackTransaction = {
    id: uid(),
    user_id: userId,
    store_id: storeId,
    click_id: lastClick?.id ?? null,
    order_amount: orderAmount,
    cashback_amount: Math.round(cashbackAmount * 100) / 100,
    status: "pending",
    network_txn_id: "mock-" + uid().slice(0, 8),
    created_at: now(),
    confirmed_at: null,
    store: store ? { name: store.name, logo_url: store.logo_url } : undefined,
  };
  d.transactions.push(txn);
  await persist();
  return txn;
}

// ===================== Payouts =====================

export async function listPayouts(userId: string): Promise<PayoutRequest[]> {
  const d = await load();
  return d.payouts
    .filter((p) => p.user_id === userId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function requestPayout(
  userId: string,
  amount: number,
): Promise<PayoutRequest> {
  const d = await load();
  const payout: PayoutRequest = {
    id: uid(),
    user_id: userId,
    amount: Math.round(amount * 100) / 100,
    status: "requested",
    created_at: now(),
    paid_at: null,
  };
  d.payouts.push(payout);
  await persist();
  return payout;
}

// ===================== Admin =====================

export async function adminListPendingTransactions(): Promise<
  CashbackTransaction[]
> {
  const d = await load();
  return d.transactions
    .filter((t) => t.status === "pending")
    .map((t) => ({ ...t, user: briefFor(d, t.user_id) }))
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function adminSetTransactionStatus(
  id: string,
  status: "confirmed" | "rejected",
): Promise<void> {
  const d = await load();
  const txn = d.transactions.find((t) => t.id === id);
  if (!txn) throw new Error("עסקה לא נמצאה");
  txn.status = status;
  txn.confirmed_at = status === "confirmed" ? now() : null;
  await persist();
}

export async function adminListPayouts(): Promise<PayoutRequest[]> {
  const d = await load();
  return d.payouts
    .map((p) => ({ ...p, user: briefFor(d, p.user_id) }))
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

/** מסמן משיכה כשולמה ומעביר את כל הקאשבק ה"מאושר" של המשתמש למצב "שולם". */
export async function adminMarkPayoutPaid(id: string): Promise<void> {
  const d = await load();
  const payout = d.payouts.find((p) => p.id === id);
  if (!payout) throw new Error("בקשת משיכה לא נמצאה");
  payout.status = "paid";
  payout.paid_at = now();
  d.transactions
    .filter((t) => t.user_id === payout.user_id && t.status === "confirmed")
    .forEach((t) => {
      t.status = "paid";
    });
  await persist();
}
