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
  fetchCouponsRaw?(): Promise<unknown[]>;
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

  async fetchCouponsRaw(): Promise<unknown[]> {
    if (!this.websiteId) throw new Error("חסר ADMITAD_WEBSITE_ID");
    const scope =
      Deno.env.get("ADMITAD_COUPONS_SCOPE") ?? "coupons_for_website";
    const token = await this.token(scope);
    const res = await fetch(
      `${ADMITAD_API}/coupons/website/${this.websiteId}/?limit=20&offset=0`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    const data = await res.json();
    return (data.results ?? []) as unknown[];
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

// ============================================================
// Awin — מימוש אמיתי (מביא חנויות + שיעורי עמלה + קישור מעקב)
// ============================================================

const AWIN_API = "https://api.awin.com";

interface AwinCommission {
  min?: number;
  max?: number;
  type?: string; // "percentage" | "amount" ...
}

interface AwinProgramme {
  id: number; // advertiser id (mid)
  name: string;
  displayUrl?: string;
  clickThroughUrl?: string;
  logoUrl?: string;
  currencyCode?: string;
  commissionRange?: AwinCommission[];
}

class AwinNetwork implements AffiliateNetwork {
  readonly name = "awin";
  private token = Deno.env.get("AWIN_API_TOKEN") ?? "";
  private publisherId = Deno.env.get("AWIN_PUBLISHER_ID") ?? "";

  private headers() {
    return { Authorization: `Bearer ${this.token}` };
  }

  async fetchOffers(): Promise<NetworkOffer[]> {
    if (!this.token || !this.publisherId) {
      throw new Error("חסרים AWIN_API_TOKEN / AWIN_PUBLISHER_ID");
    }
    // רק תוכניות שהצטרפנו אליהן (relationship=joined).
    const res = await fetch(
      `${AWIN_API}/publishers/${this.publisherId}/programmes?relationship=joined`,
      { headers: this.headers() },
    );
    if (!res.ok) {
      throw new Error(`Awin programmes נכשל: ${res.status} ${await res.text()}`);
    }
    const programmes: AwinProgramme[] = await res.json();
    const offers: NetworkOffer[] = [];
    for (const p of programmes) {
      const baseUrl = p.displayUrl || p.clickThroughUrl || "";
      if (!baseUrl) continue;
      const rate = parseAwinRate(p.commissionRange);
      // קישור מעקב של Awin: cread.php עם awinmid/awinaffid + clickref(subid) + יעד (ued).
      const template =
        `https://www.awin1.com/cread.php?awinmid=${p.id}` +
        `&awinaffid=${this.publisherId}&clickref={SUBID}` +
        `&ued=${encodeURIComponent(baseUrl)}`;
      offers.push({
        externalId: String(p.id),
        name: p.name,
        category: null,
        description: null,
        logoUrl: p.logoUrl ?? null,
        baseUrl,
        affiliateUrlTemplate: template,
        variable: false,
        ...rate,
      });
    }
    return offers;
  }

  async fetchCoupons(): Promise<NetworkCoupon[]> {
    // ל-API של Awin (publisher) אין endpoint קופונים פשוט — דילים מגיעים דרך פידים.
    // כרגע Awin תורם חנויות + קאשבק בלבד; קופונים נשארים מ-Admitad.
    return [];
  }

  parsePostback(url: URL, body: Record<string, unknown> | null): PostbackEvent {
    // Awin מזכה דרך משיכת transactions ב-API (לא postback). מפרסר מינימלי לתאימות.
    const q = (k: string): string | null =>
      url.searchParams.get(k) ?? (body?.[k] != null ? String(body[k]) : null);
    const num = (v: string | null): number | null =>
      v != null && v !== "" && !Number.isNaN(Number(v)) ? Number(v) : null;
    return {
      subid: q("clickref") ?? q("subid") ?? "",
      orderAmount: num(q("totalAmount")),
      reportedCashback: num(q("commissionAmount")),
      currency: q("currency"),
      status: "pending",
      networkTxnId: q("transactionId") ?? null,
    };
  }
}

/** מחלץ שיעור עמלה מ-commissionRange של Awin; ברירת מחדל 5% אם לא נמצא. */
function parseAwinRate(range?: AwinCommission[]): {
  cashbackType: CashbackType;
  cashbackValue: number;
} {
  let best = 0;
  let isFixed = false;
  for (const r of range ?? []) {
    const val = Number(r.max ?? r.min ?? 0);
    const isPct = (r.type ?? "percentage").toLowerCase().startsWith("perc");
    if (isPct) {
      if (val > best) {
        best = val;
        isFixed = false;
      }
    } else if (best === 0 && val > 0) {
      best = val;
      isFixed = true;
    }
  }
  if (best > 0) {
    return { cashbackType: isFixed ? "fixed" : "percent", cashbackValue: best };
  }
  return { cashbackType: "percent", cashbackValue: 5 };
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
  if (/^(not required|no code|none|n\/?a|не требуется)$/i.test(code))
    return null;
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
  // ה-name הוא מקור האמת (discount לרוב שדה דירוג פנימי ולא ההנחה בפועל).
  const name = (c.name ?? "").trim();
  const code = normalizePromocode(c.promocode);
  // מטבע: אותיות מדינה אופציונליות + רווח, ואז סמל ומספר. תופס "US $39", "CA$50", "€39".
  const CUR = "(?:[A-Z]{0,3}\\s?)?([$€£₪])\\s?(\\d[\\d.,]*)";
  const upTo = /up to|up-to|до\b|from\b|מעל|עד\b/i.test(name);
  const freeShip =
    /free ship|free deliver|бесплатн\w* доставк|משלוח חינם/i.test(name);

  let title: string;
  let minPurchase: string | null = null;

  // תבנית "X off orders over Y" — סכום הנחה קבוע + מינימום קנייה (ההגבלה האמיתית)
  const offOver = name.match(
    new RegExp(`${CUR}\\s*off\\s*orders?\\s*over\\s*${CUR}`, "i"),
  );
  const pct = name.match(/(\d{1,3})\s*%/);
  const amount = name.match(new RegExp(CUR, "i"));

  if (offOver) {
    title = `${offOver[1]}${offOver[2]} הנחה`;
    minPurchase = `${offOver[3]}${offOver[4]}`;
  } else if (pct) {
    title = `${upTo ? "עד " : ""}${pct[1]}% הנחה`;
  } else if (freeShip) {
    title = "משלוח חינם";
  } else if (amount) {
    title = `${amount[1]}${amount[2]} הנחה`;
  } else if (code) {
    title = "קופון הנחה";
  } else {
    title = "מבצע";
  }

  // הגבלת מינימום קנייה כללית (אם לא נתפסה למעלה)
  if (!minPurchase) {
    const over = name.match(new RegExp(`(?:over|above|от|מעל)\\s*${CUR}`, "i"));
    if (over) minPurchase = `${over[1]}${over[2]}`;
  }

  const parts: string[] = [];
  if (minPurchase) parts.push(`בקנייה מעל ${minPurchase}`);
  parts.push(code ? "בקוד קופון" : "מוחל אוטומטית");
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
    case "awin":
      return new AwinNetwork();
    default:
      throw new Error(`רשת שותפים לא נתמכת: ${name}`);
  }
}

/** מחזיר את כל רשתות השותפים המוגדרות (לפי מפתחות סביבה קיימים). */
export function getNetworks(): AffiliateNetwork[] {
  const nets: AffiliateNetwork[] = [];
  if (Deno.env.get("ADMITAD_CLIENT_ID")) nets.push(new AdmitadNetwork());
  if (Deno.env.get("AWIN_API_TOKEN")) nets.push(new AwinNetwork());
  if (nets.length === 0) nets.push(new AdmitadNetwork());
  return nets;
}
