/**
 * Backend מדומה (Mock) של CashyCash.
 * מאפשר להריץ את כל האפליקציה מקצה-לקצה ללא Supabase — כל הנתונים
 * נשמרים מקומית ב-AsyncStorage. מופעל אוטומטית כשאין מפתחות Supabase.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";
import { CATALOG, catalogRate, catalogUserShare } from "../catalog";
import {
  AppUser,
  CashbackTransaction,
  Click,
  Coupon,
  PayoutRequest,
  Store,
  UserBrief,
} from "../types";

const STORAGE_KEY = "cashy_mock_db_v7";

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
  coupons: Coupon[];
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
    opts?: { popular?: boolean; variable?: boolean },
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
    popular: opts?.popular ?? false,
    variable: opts?.variable ?? false,
  });

  const curated: Store[] = [
    // בינלאומיות פופולריות
    base(
      "AliExpress",
      "קניות כלליות",
      "מגוון עצום של מוצרים במחירים משתלמים.",
      "https://www.aliexpress.com",
      "percent",
      8,
      60,
      { popular: true, variable: true },
    ),
    base(
      "Shein",
      "אופנה",
      "אופנה טרנדית במחירים נמוכים.",
      "https://www.shein.com",
      "percent",
      10,
      60,
      { popular: true, variable: true },
    ),
    base(
      "Temu",
      "קניות כלליות",
      "הכול לבית ולמשפחה במחירי רצפה.",
      "https://www.temu.com",
      "percent",
      10,
      60,
      { popular: true, variable: true },
    ),
    base(
      "eBay",
      "קניות כלליות",
      "קניות ומכירות מכל העולם.",
      "https://www.ebay.com",
      "percent",
      3,
      60,
      { variable: true },
    ),
    base(
      "ASOS",
      "אופנה",
      "אופנה ואקססוריז לגברים ולנשים.",
      "https://www.asos.com",
      "percent",
      6,
      55,
      { popular: true },
    ),
    base(
      "Booking.com",
      "טיסות ומלונות",
      "הזמנת מלונות ולינה ברחבי העולם.",
      "https://www.booking.com",
      "percent",
      4,
      70,
      { popular: true },
    ),
    base(
      "Agoda",
      "טיסות ומלונות",
      "מלונות ומקומות לינה במזרח ובעולם.",
      "https://www.agoda.com",
      "percent",
      5,
      60,
    ),
    base(
      "Trivago",
      "טיסות ומלונות",
      "השוואת מחירי מלונות.",
      "https://www.trivago.com",
      "percent",
      4,
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
      { popular: true },
    ),
    base(
      "Nike",
      "ספורט",
      "הנעליים והביגוד של נייקי.",
      "https://www.nike.com",
      "percent",
      6,
      60,
      { popular: true },
    ),
    base(
      "Adidas",
      "ספורט",
      "ביגוד והנעלת ספורט.",
      "https://www.adidas.co.il",
      "percent",
      6,
      60,
    ),
    base(
      "Sephora",
      "יופי וטיפוח",
      "איפור, בישום וטיפוח.",
      "https://www.sephora.com",
      "percent",
      6,
      60,
    ),
    base(
      "Samsung",
      "אלקטרוניקה",
      "סמארטפונים ומוצרי חשמל.",
      "https://www.samsung.com",
      "percent",
      3,
      60,
    ),
    // ישראליות
    base(
      "KSP",
      "אלקטרוניקה",
      "מחשבים, גאדג'טים ומוצרי חשמל.",
      "https://ksp.co.il",
      "percent",
      3,
      50,
      { popular: true },
    ),
    base(
      "Terminal X",
      "אופנה",
      "מותגי אופנה מובילים בישראל.",
      "https://www.terminalx.com",
      "percent",
      5,
      60,
      { popular: true },
    ),
    base(
      "FOX",
      "אופנה",
      "אופנה לכל המשפחה.",
      "https://www.fox.co.il",
      "percent",
      5,
      60,
      { popular: true },
    ),
    base(
      "GOLF",
      "אופנה",
      "אופנה ואקססוריז.",
      "https://www.golf-fashion.co.il",
      "percent",
      5,
      60,
    ),
    base(
      "Castro",
      "אופנה",
      "רשת האופנה הישראלית.",
      "https://www.castro.com",
      "percent",
      5,
      60,
    ),
    base(
      "Renuar",
      "אופנה",
      "אופנת נשים.",
      "https://www.renuar.co.il",
      "percent",
      5,
      60,
    ),
    base(
      "שילב",
      "ילדים ותינוקות",
      "הכול לתינוק ולילד.",
      "https://www.shilav.co.il",
      "percent",
      4,
      60,
    ),
    base(
      "Home Center",
      "בית וריהוט",
      "מוצרים לבית ולגינה.",
      "https://www.homecenter.co.il",
      "percent",
      4,
      60,
    ),
    base(
      "נעמן",
      "בית וריהוט",
      "כלי בית ומתנות.",
      "https://www.naaman.co.il",
      "percent",
      4,
      60,
    ),
    base(
      "Steimatzky",
      "ספרים",
      "ספרים, משחקים ומתנות.",
      "https://www.steimatzky.co.il",
      "percent",
      4,
      60,
    ),
    base(
      "Mega Sport",
      "ספורט",
      "ציוד וביגוד ספורט.",
      "https://www.megasport.co.il",
      "percent",
      5,
      60,
    ),
    base(
      "Wolt",
      "מזון ומשלוחים",
      "משלוחי אוכל ומצרכים.",
      "https://wolt.com/he",
      "percent",
      4,
      60,
    ),
    // בינלאומיות נוספות
    base(
      "ZARA",
      "אופנה",
      "אופנה עדכנית לכל המשפחה.",
      "https://www.zara.com/il",
      "percent",
      5,
      60,
      { popular: true },
    ),
    base(
      "MANGO",
      "אופנה",
      "אופנה ואקססוריז במגע ספרדי.",
      "https://shop.mango.com",
      "percent",
      6,
      60,
    ),
    base(
      "H&M",
      "אופנה",
      "אופנה במחירים נגישים.",
      "https://www2.hm.com",
      "percent",
      5,
      60,
      { popular: true },
    ),
    base(
      "Puma",
      "ספורט",
      "הנעלה וביגוד ספורט.",
      "https://il.puma.com",
      "percent",
      6,
      60,
    ),
    base(
      "Farfetch",
      "אופנה",
      "מותגי יוקרה מכל העולם.",
      "https://www.farfetch.com",
      "percent",
      7,
      60,
    ),
    base(
      "Namshi",
      "אופנה",
      "אופנה ומותגים מהמזרח התיכון.",
      "https://www.namshi.com",
      "percent",
      6,
      60,
    ),
    base(
      "Banggood",
      "אלקטרוניקה",
      "גאדג'טים ואלקטרוניקה במחירים נמוכים.",
      "https://www.banggood.com",
      "percent",
      7,
      55,
      { variable: true },
    ),
    base(
      "Lenovo",
      "אלקטרוניקה",
      "מחשבים ניידים ואביזרים.",
      "https://www.lenovo.com",
      "percent",
      4,
      60,
    ),
    base(
      "Expedia",
      "טיסות ומלונות",
      "טיסות, מלונות וחבילות נופש.",
      "https://www.expedia.com",
      "percent",
      5,
      60,
    ),
    base(
      "Hotels.com",
      "טיסות ומלונות",
      "הזמנת מלונות בכל העולם.",
      "https://www.hotels.com",
      "percent",
      5,
      60,
    ),
    // ישראליות נוספות
    base(
      "Ivory",
      "אלקטרוניקה",
      "מחשבים, גיימינג ומוצרי חשמל.",
      "https://www.ivory.co.il",
      "percent",
      3,
      50,
      { popular: true },
    ),
    base(
      "לאסט פרייס",
      "קניות כלליות",
      "מוצרים במחירי מבצע כל יום.",
      "https://www.lastprice.co.il",
      "percent",
      4,
      55,
    ),
    base(
      "ADIKA",
      "אופנה",
      "אופנת נשים אונליין.",
      "https://www.adika.com",
      "percent",
      6,
      60,
      { popular: true },
    ),
    base(
      "Factory 54",
      "אופנה",
      "מותגי יוקרה ואופנה.",
      "https://www.factory54.co.il",
      "percent",
      5,
      60,
    ),
    base(
      "TwentyFourSeven",
      "אופנה",
      "אופנה במחירים משתלמים.",
      "https://www.24-7.co.il",
      "percent",
      5,
      60,
    ),
    base(
      "Super-Pharm",
      "יופי וטיפוח",
      "טיפוח, בישום ומוצרי בריאות.",
      "https://shop.super-pharm.co.il",
      "percent",
      3,
      55,
      { popular: true },
    ),
    base(
      "Laline",
      "יופי וטיפוח",
      "מוצרי גוף, בית ובישום.",
      "https://www.laline.co.il",
      "percent",
      5,
      60,
    ),
    base(
      "MAC",
      "יופי וטיפוח",
      "איפור מקצועי.",
      "https://www.maccosmetics.co.il",
      "percent",
      5,
      60,
    ),
    base(
      "BUG",
      "אלקטרוניקה",
      "סמארטפונים, מחשבים וגאדג'טים.",
      "https://www.bug.co.il",
      "percent",
      3,
      50,
    ),
    base(
      "Payngo",
      "אלקטרוניקה",
      "מוצרי חשמל ואלקטרוניקה.",
      "https://www.payngo.co.il",
      "percent",
      3,
      50,
    ),
    base(
      "ACE",
      "בית וריהוט",
      "כלי עבודה, גינון והכול לבית.",
      "https://www.ace.co.il",
      "percent",
      4,
      60,
    ),
    base(
      "Max Stock",
      "קניות כלליות",
      "מוצרים לבית ולמשפחה במחירים נמוכים.",
      "https://www.maxstock.co.il",
      "percent",
      4,
      55,
    ),
    base(
      "Nespresso",
      "מזון ומשלוחים",
      "קפסולות ומכונות קפה.",
      "https://www.nespresso.com/il",
      "percent",
      4,
      60,
    ),
    base(
      "American Eagle",
      "אופנה",
      "אופנת ג'ינס וקז'ואל.",
      "https://www.americaneagle.co.il",
      "percent",
      6,
      60,
    ),
    base(
      "Crocs",
      "אופנה",
      "הנעלה נוחה לכל המשפחה.",
      "https://www.crocs.co.il",
      "percent",
      6,
      60,
    ),
    // ישראליות – תיירות, בית ופנאי
    base(
      "Isrotel",
      "טיסות ומלונות",
      "רשת מלונות הנופש בישראל.",
      "https://www.isrotel.co.il",
      "percent",
      5,
      60,
      { popular: true },
    ),
    base(
      "Fattal",
      "טיסות ומלונות",
      "רשת מלונות פתאל בארץ ובעולם.",
      "https://www.fattal.co.il",
      "percent",
      5,
      60,
    ),
    base(
      "Gulliver",
      "טיסות ומלונות",
      "חבילות נופש וטיסות.",
      "https://www.gulliver.co.il",
      "percent",
      4,
      60,
    ),
    base(
      "Cinema City",
      "פנאי ובידור",
      "כרטיסים לסרטים וחוויות קולנוע.",
      "https://www.cinema-city.co.il",
      "percent",
      4,
      55,
    ),
    base(
      "Keter",
      "בית וריהוט",
      "רהיטי פלסטיק ופתרונות אחסון.",
      "https://www.keter.com",
      "percent",
      4,
      60,
    ),
    base(
      "Vardinon",
      "בית וריהוט",
      "מצעים, מגבות וטקסטיל לבית.",
      "https://www.vardinon.co.il",
      "percent",
      5,
      60,
    ),
    base(
      "Opticana",
      "יופי וטיפוח",
      "משקפי ראייה ושמש.",
      "https://www.opticana.co.il",
      "percent",
      4,
      55,
    ),
    base(
      "GOLF&CO",
      "בית וריהוט",
      "עיצוב הבית ואקססוריז.",
      "https://www.golfand.co.il",
      "percent",
      5,
      60,
    ),
    base(
      "Delta",
      "אופנה",
      "הלבשה תחתונה וביגוד בסיסי.",
      "https://www.delta.co.il",
      "percent",
      5,
      60,
    ),
    base(
      "Intima",
      "אופנה",
      "הלבשה תחתונה ובגדי ים.",
      "https://www.intima.co.il",
      "percent",
      5,
      60,
    ),
    base(
      "Mania Jeans",
      "אופנה",
      "אופנת ג'ינס ישראלית.",
      "https://www.maniajeans.co.il",
      "percent",
      5,
      60,
    ),
    base(
      "קרביץ",
      "קניות כלליות",
      "צעצועים, כלי כתיבה ומתנות.",
      "https://www.kravitz.co.il",
      "percent",
      4,
      60,
    ),
    // בינלאומיות – יופי ואופנה
    base(
      "Look Fantastic",
      "יופי וטיפוח",
      "מוצרי טיפוח ואיפור מובחרים.",
      "https://www.lookfantastic.com",
      "percent",
      7,
      60,
    ),
    base(
      "Victoria's Secret",
      "אופנה",
      "הלבשה תחתונה ובישום.",
      "https://www.victoriassecret.com",
      "percent",
      6,
      60,
    ),
    base(
      "Reserved",
      "אופנה",
      "אופנה עדכנית לכל המשפחה.",
      "https://www.reserved.com",
      "percent",
      6,
      60,
    ),
    base(
      "Anker",
      "אלקטרוניקה",
      "מטענים, סוללות ואביזרים.",
      "https://www.anker.com",
      "percent",
      5,
      55,
    ),
  ];

  // מיזוג הקטלוג המלא (341 חנויות מ-cashback.co.il) — בלי לדרוס חנויות קיימות (לפי שם).
  const existing = new Set(curated.map((s) => s.name.toLowerCase()));
  const share = catalogUserShare();
  for (const [name, category, domain] of CATALOG) {
    if (existing.has(name.toLowerCase())) continue;
    existing.add(name.toLowerCase());
    curated.push(
      base(
        name,
        category,
        "",
        `https://${domain}`,
        "percent",
        catalogRate(category),
        share,
      ),
    );
  }
  return curated;
}
function seedCoupons(stores: Store[]): Coupon[] {
  const byName = (name: string) => stores.find((s) => s.name === name);
  const rows: Array<{
    store: string;
    title: string;
    code: string | null;
    description: string | null;
    featured: boolean;
  }> = [
    {
      store: "AliExpress",
      title: "קופון ₪12 הנחה בקנייה מעל $20",
      code: "CASHY12",
      description: "תקף למשתמשים חדשים באפליקציה.",
      featured: true,
    },
    {
      store: "Shein",
      title: "15% הנחה על כל האתר",
      code: "CASHY15",
      description: "ללא מינימום קנייה.",
      featured: true,
    },
    {
      store: "Temu",
      title: "משלוח חינם + ₪40 הנחה",
      code: null,
      description: "הדיל מוחל אוטומטית בעגלה.",
      featured: true,
    },
    {
      store: "Booking.com",
      title: "עד 10% הנחה על מלונות נבחרים",
      code: null,
      description: "ההנחה מוצגת בעמוד המלון.",
      featured: true,
    },
    {
      store: "ASOS",
      title: "20% הנחה על קולקציית העונה",
      code: "STYLE20",
      description: "לא כולל מותגים נבחרים.",
      featured: false,
    },
    {
      store: "Terminal X",
      title: "₪50 הנחה בקנייה מעל ₪300",
      code: "TX50",
      description: "מבצע לזמן מוגבל.",
      featured: false,
    },
    {
      store: "iHerb",
      title: "5% הנחה נוספת על כל הסל",
      code: "IHERB5",
      description: "מצטבר עם מבצעי האתר.",
      featured: false,
    },
    {
      store: "Nike",
      title: "25% הנחה על פריטים נבחרים",
      code: null,
      description: "ההנחה מוחלת אוטומטית.",
      featured: false,
    },
    {
      store: "KSP",
      title: "קופון ₪30 הנחה על אביזרים",
      code: "KSP30",
      description: "בקנייה מעל ₪200.",
      featured: false,
    },
    {
      store: "FOX",
      title: "1+1 על מוצרי הקולקציה",
      code: null,
      description: "בחנויות הרשת ובאתר.",
      featured: false,
    },
  ];
  const out: Coupon[] = [];
  for (const r of rows) {
    const store = byName(r.store);
    if (!store) continue;
    out.push({
      id: uid(),
      store_id: store.id,
      title: r.title,
      code: r.code,
      description: r.description,
      expires_at: null,
      featured: r.featured,
      active: true,
      created_at: now(),
      store: {
        name: store.name,
        logo_url: store.logo_url,
        base_url: store.base_url,
        category: store.category,
      },
    });
  }
  return out;
}

function seed(): MockDb {
  const stores = seedStores();
  const coupons = seedCoupons(stores);
  const storeByName = (name: string) => stores.find((s) => s.name === name)!;
  const aliexpress = storeByName("AliExpress");
  const asos = storeByName("ASOS");
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
      store_id: aliexpress.id,
      click_id: null,
      order_amount: 250,
      cashback_amount: 12,
      status: "confirmed",
      network_txn_id: "seed-1",
      created_at: now(),
      confirmed_at: now(),
      store: { name: aliexpress.name, logo_url: aliexpress.logo_url },
    },
    {
      id: uid(),
      user_id: demoUser.id,
      store_id: asos.id,
      click_id: null,
      order_amount: 180,
      cashback_amount: 5.94,
      status: "pending",
      network_txn_id: "seed-2",
      created_at: now(),
      confirmed_at: null,
      store: { name: asos.name, logo_url: asos.logo_url },
    },
  ];

  return {
    users: [demoUser, adminUser],
    sessionUserId: null,
    stores,
    coupons,
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

// ===================== Coupons =====================

function enrichCoupon(d: MockDb, c: Coupon): Coupon {
  const store = d.stores.find((s) => s.id === c.store_id);
  return {
    ...c,
    store: store
      ? {
          name: store.name,
          logo_url: store.logo_url,
          base_url: store.base_url,
          category: store.category,
        }
      : c.store,
  };
}

export async function listCoupons(storeId?: string): Promise<Coupon[]> {
  const d = await load();
  return (d.coupons ?? [])
    .filter((c) => c.active && (!storeId || c.store_id === storeId))
    .map((c) => enrichCoupon(d, c))
    .sort((a, b) => Number(b.featured) - Number(a.featured));
}

export async function listFeaturedCoupons(): Promise<Coupon[]> {
  const d = await load();
  return (d.coupons ?? [])
    .filter((c) => c.active && c.featured)
    .map((c) => enrichCoupon(d, c));
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
