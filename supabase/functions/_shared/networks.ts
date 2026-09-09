/**
 * מתאם רשתות שותפים (Affiliate Networks).
 * מגדיר ממשק אחיד + מימוש אמיתי ל-Admitad. ניתן להוסיף רשתות נוספות
 * (Awin/CJ/AliExpress) ע"י מימוש אותו ממשק ורישום ב-getNetwork().
 */

export type CashbackType = "percent" | "fixed";

/** הצעה/מפרסם שנשלף מרשת השותפים ומסונכרן לטבלת stores. */
export interface NetworkOffer {
  externalId: string;
  name: string;
  category: string | null;
  description: string | null;
  logoUrl: string | null;
  baseUrl: string;
  /** תבנית קישור עם {SUBID} להחלפה בטוקן המעקב של המשתמש. */
  affiliateUrlTemplate: string;
  cashbackType: CashbackType;
  cashbackValue: number;
  /** האם שיעור הקאשבק משתנה בין פריטים (מציגים "עד"). */
  variable: boolean;
}

/** קופון/דיל שנשלף מרשת השותפים ומסונכרן לטבלת coupons. */
export interface NetworkCoupon {
  externalId: string;
  /** מזהה הקמפיין ברשת — ממופה ל-stores.network_offer_id כדי לקשר לחנות. */
  campaignExternalId: string;
  title: string;
  code: string | null;
  description: string | null;
  /** תאריך תפוגה ב-ISO, אם קיים. */
  expiresAt: string | null;
  featured: boolean;
}

export type PostbackStatus = "pending" | "confirmed" | "rejected";

/** אירוע המרה שמגיע מ-postback של רשת השותפים. */
export interface PostbackEvent {
  /** הטוקן שהעברנו כ-subid — מזהה את הקליק/המשתמש. */
  subid: string;
  orderAmount: number | null;
  /** העמלה/קאשבק שהרשת דיווחה, אם קיים. */
  reportedCashback: number | null;
  currency: string | null;
  status: PostbackStatus;
  /** מזהה ייחודי של ההמרה ברשת — למניעת כפילויות. */
  networkTxnId: string | null;
}

export interface AffiliateNetwork {
  readonly name: string;
  fetchOffers(): Promise<NetworkOffer[]>;
  fetchCoupons(): Promise<NetworkCoupon[]>;
  parsePostback(url: URL, body: Record<string, unknown> | null): PostbackEvent;
}

// ============================================================
// Admitad — מימוש אמיתי
// ============================================================

const ADMITAD_API = "https://api.admitad.com";

interface AdmitadCampaign {
  id: number;
  name: string;
  site_url?: string;
  image?: string | null;
  gotolink?: string;
  categories?: { name: string }[];
  actions_detail?: { size?: string; rate?: string; name?: string }[];
}

interface AdmitadCoupon {
  id: number;
  name?: string;
  promocode?: string | null;
  discount?: string | null;
  description?: string | null;
  date_end?: string | null;
  rating?: string | number | null;
  advcampaign?: { id: number } | null;
  campaign?: { id: number } | null;
  regions?: Array<string | { region?: string; code?: string }> | null;
}

class AdmitadNetwork implements AffiliateNetwork {
  readonly name = "admitad";

  private clientId = Deno.env.get("ADMITAD_CLIENT_ID") ?? "";
  private clientSecret = Deno.env.get("ADMITAD_CLIENT_SECRET") ?? "";
  private websiteId = Deno.env.get("ADMITAD_WEBSITE_ID") ?? "";
  private scope = Deno.env.get("ADMITAD_SCOPE") ?? "advcampaigns_for_website";

  private async token(scope = this.scope): Promise<string> {
    if (!this.clientId || !this.clientSecret) {
      throw new Error("חסרים ADMITAD_CLIENT_ID / ADMITAD_CLIENT_SECRET");
    }
    const basic = btoa(`${this.clientId}:${this.clientSecret}`);
    const body = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: this.clientId,
      scope,
    });
    const res = await fetch(`${ADMITAD_API}/token/`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basic}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });
    if (!res.ok) {
      throw new Error(`Admitad token נכשל: ${res.status} ${await res.text()}`);
    }
    const data = await res.json();
    return data.access_token as string;
  }

  async fetchOffers(): Promise<NetworkOffer[]> {
    if (!this.websiteId) throw new Error("חסר ADMITAD_WEBSITE_ID");
    const token = await this.token();
    const offers: NetworkOffer[] = [];
    const limit = 100;
    let offset = 0;

    // מושכים את כל הקמפיינים המחוברים לאתר בעימוד.
    while (true) {
      const res = await fetch(
        `${ADMITAD_API}/advcampaigns/website/${this.websiteId}/?limit=${limit}&offset=${offset}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!res.ok) {
        throw new Error(
          `Admitad advcampaigns נכשל: ${res.status} ${await res.text()}`,
        );
      }
      const data = await res.json();
      const results: AdmitadCampaign[] = data.results ?? [];
      for (const c of results) {
        if (!c.gotolink) continue;
        const sep = c.gotolink.includes("?") ? "&" : "?";
        const cat = mapCategory(c.categories?.[0]?.name);
        offers.push({
          externalId: String(c.id),
          name: c.name,
          category: cat,
          description: null,
          logoUrl: c.image ?? null,
          baseUrl: c.site_url ?? "",
          affiliateUrlTemplate: `${c.gotolink}${sep}subid={SUBID}`,
          variable: cat === "קניות כלליות",
          ...parseAdmitadRate(c),
        });
      }
      const total = data._meta?.count ?? offers.length;
      offset += limit;
      if (offset >= total || results.length === 0) break;
    }
    return offers;
  }

  async fetchCoupons(): Promise<NetworkCoupon[]> {
    if (!this.websiteId) throw new Error("חסר ADMITAD_WEBSITE_ID");
    const scope =
      Deno.env.get("ADMITAD_COUPONS_SCOPE") ?? "coupons_for_website";
    const token = await this.token(scope);
    const coupons: NetworkCoupon[] = [];
    const limit = 100;
    let offset = 0;

    // מושכים את כל הקופונים המחוברים לאתר בעימוד.
    while (true) {
      const res = await fetch(
        `${ADMITAD_API}/coupons/website/${this.websiteId}/?limit=${limit}&offset=${offset}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!res.ok) {
        throw new Error(
          `Admitad coupons נכשל: ${res.status} ${await res.text()}`,
        );
      }
      const data = await res.json();
      const results: AdmitadCoupon[] = data.results ?? [];
      for (const c of results) {
        const campaignId = c.advcampaign?.id ?? c.campaign?.id;
        if (!campaignId) continue;
        if (!isCouponRegionRelevant(c)) continue;
        const rating = c.rating != null ? Number(c.rating) : NaN;
        const summary = summarizeCouponHe(c);
        coupons.push({
          externalId: String(c.id),
          campaignExternalId: String(campaignId),
          title: summary.title,
          code: normalizePromocode(c.promocode),
          description: summary.description,
          expiresAt: c.date_end ?? null,
          featured: !Number.isNaN(rating) && rating >= 4,
        });
      }
      const total = data._meta?.count ?? coupons.length;
      offset += limit;
      if (offset >= total || results.length === 0) break;
    }
    return coupons;
  }

  parsePostback(url: URL, body: Record<string, unknown> | null): PostbackEvent {
    const q = (k: string): string | null =>
      url.searchParams.get(k) ?? (body?.[k] != null ? String(body[k]) : null);

    const rawStatus = (q("status") ?? "pending").toLowerCase();
    const status: PostbackStatus =
      rawStatus === "approved" || rawStatus === "confirmed"
        ? "confirmed"
        : rawStatus === "declined" || rawStatus === "rejected"
          ? "rejected"
          : "pending";

    const num = (v: string | null): number | null =>
      v != null && v !== "" && !Number.isNaN(Number(v)) ? Number(v) : null;

    return {
      subid: q("subid") ?? q("subid1") ?? "",
      orderAmount: num(q("order_sum") ?? q("cart") ?? q("payment_sum")),
      reportedCashback: num(q("payment_sum") ?? q("reward")),
      currency: q("currency"),
      status,
      networkTxnId: q("action_id") ?? q("order_id") ?? null,
    };
  }
}

/** ממפה קטגוריה מהרשת (רוסית/אנגלית) לעברית; אם לא מזוהה — null (ללא שפה זרה). */
function mapCategory(name?: string): string | null {
  if (!name) return null;
  const n = name.toLowerCase();
  if (
    n.includes("маркетплейс") ||
    n.includes("marketplace") ||
    n.includes("кита")
  )
    return "קניות כלליות";
  if (
    n.includes("одежд") ||
    n.includes("fashion") ||
    n.includes("clothing") ||
    n.includes("мод")
  )
    return "אופנה";
  if (
    n.includes("электрон") ||
    n.includes("electronic") ||
    n.includes("gadget")
  )
    return "אלקטרוניקה";
  if (
    n.includes("travel") ||
    n.includes("путеш") ||
    n.includes("отел") ||
    n.includes("hotel") ||
    n.includes("flight")
  )
    return "טיסות ומלונות";
  if (
    n.includes("health") ||
    n.includes("beauty") ||
    n.includes("здоров") ||
    n.includes("красот")
  )
    return "בריאות וטבע";
  return null;
}

/** מנסה לחלץ שיעור עמלה מתוך פרטי הקמפיין; ברירת מחדל 5% אם לא נמצא. */
function parseAdmitadRate(c: AdmitadCampaign): {
  cashbackType: CashbackType;
  cashbackValue: number;
} {
  const detail = c.actions_detail?.find((a) => a.rate);
  const rate = detail?.rate ? parseFloat(detail.rate) : NaN;
  if (!Number.isNaN(rate) && rate > 0) {
    const isFixed = (detail?.size ?? "").toLowerCase() === "fix";
    return { cashbackType: isFixed ? "fixed" : "percent", cashbackValue: rate };
  }
  return { cashbackType: "percent", cashbackValue: 5 };
}

/** מנרמל קוד קופון: "NOT REQUIRED"/ריק וכו' -> null (דיל אוטומטי ללא קוד). */
function normalizePromocode(raw?: string | null): string | null {
  const code = (raw ?? "").trim();
  if (!code) return null;
  if (/^(not required|no code|none|n\/?a|не требуется)$/i.test(code)) return null;
  return code;
}

/**
 * מחזיר את קודי האזור של הקופון (ISO) באותיות גדולות. תומך במבנה מחרוזות או אובייקטים.
 */
function couponRegionCodes(c: AdmitadCoupon): string[] {
  const arr = c.regions;
  if (!Array.isArray(arr)) return [];
  return arr
    .map((r) => (typeof r === "string" ? r : (r.region ?? r.code ?? "")))
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);
}

/** מוותרים על קופונים אזוריים שלא רלוונטיים — שומרים גלובלי/ישראל בלבד. */
function isCouponRegionRelevant(c: AdmitadCoupon): boolean {
  const allow = (Deno.env.get("COUPON_REGIONS") ?? "IL")
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);
  const globals = ["WW", "WORLD", "GLOBAL", "INT", "INTL", "ALL"];
  const codes = couponRegionCodes(c);
  if (codes.length === 0) return true; // ללא אזור מוגדר = גלובלי
  return codes.some((x) => allow.includes(x) || globals.includes(x));
}

/**
 * בונה סיכום קצר בעברית לקופון מתוך השדות המובנים (במקום הטקסט הגולמי באנגלית/רוסית).
 * מחזיר כותרת קצרה + תיאור מינימלי (קוד/תוקף) — "בלי הרבה מלל".
 */
function summarizeCouponHe(c: AdmitadCoupon): {
  title: string;
  description: string | null;
} {
  const blob = `${c.name ?? ""} ${c.discount ?? ""}`.trim();
  const upTo = /up to|up-to|до\b|from\b|מעל|עד\b/i.test(blob);
  const freeShip = /free ship|free deliver|бесплатн\w* доставк|משלוח חינם/i.test(
    blob,
  );
  const code = normalizePromocode(c.promocode);

  // אחוז הנחה (למשל 70%)
  const pct = blob.match(/(\d{1,3})\s*%/);
  // סכום קבוע עם מטבע (למשל $10 / 50₪)
  const amount = blob.match(/([$€₪£])\s*(\d+[\d.,]*)|(\d+[\d.,]*)\s*([$€₪£])/);

  let title: string;
  if (pct) {
    title = `${upTo ? "עד " : ""}${pct[1]}% הנחה`;
  } else if (amount) {
    const sym = amount[1] ?? amount[4] ?? "";
    const num = amount[2] ?? amount[3] ?? "";
    title = `${sym}${num} הנחה`;
  } else if (freeShip) {
    title = "משלוח חינם";
  } else if (code) {
    title = "קופון הנחה";
  } else {
    title = "מבצע";
  }

  const parts: string[] = [];
  if (code) parts.push("בקוד קופון");
  else parts.push("מוחל אוטומטית");
  if (c.date_end) {
    const d = new Date(c.date_end);
    if (!Number.isNaN(d.getTime())) {
      parts.push(`בתוקף עד ${d.toLocaleDateString("he-IL")}`);
    }
  }
  return { title, description: parts.length ? parts.join(" · ") : null };
}

// ============================================================

/** בוחר את רשת השותפים לפי משתנה הסביבה AFFILIATE_NETWORK. */
export function getNetwork(): AffiliateNetwork {
  const name = (Deno.env.get("AFFILIATE_NETWORK") ?? "admitad").toLowerCase();
  switch (name) {
    case "admitad":
      return new AdmitadNetwork();
    default:
      throw new Error(`רשת שותפים לא נתמכת: ${name}`);
  }
}
