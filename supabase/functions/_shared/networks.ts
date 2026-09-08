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

class AdmitadNetwork implements AffiliateNetwork {
  readonly name = "admitad";

  private clientId = Deno.env.get("ADMITAD_CLIENT_ID") ?? "";
  private clientSecret = Deno.env.get("ADMITAD_CLIENT_SECRET") ?? "";
  private websiteId = Deno.env.get("ADMITAD_WEBSITE_ID") ?? "";
  private scope = Deno.env.get("ADMITAD_SCOPE") ?? "advcampaigns_for_website";

  private async token(): Promise<string> {
    if (!this.clientId || !this.clientSecret) {
      throw new Error("חסרים ADMITAD_CLIENT_ID / ADMITAD_CLIENT_SECRET");
    }
    const basic = btoa(`${this.clientId}:${this.clientSecret}`);
    const body = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: this.clientId,
      scope: this.scope,
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
        offers.push({
          externalId: String(c.id),
          name: c.name,
          category: c.categories?.[0]?.name ?? null,
          description: null,
          logoUrl: c.image ?? null,
          baseUrl: c.site_url ?? "",
          affiliateUrlTemplate: `${c.gotolink}${sep}subid={SUBID}`,
          ...parseAdmitadRate(c),
        });
      }
      const total = data._meta?.count ?? offers.length;
      offset += limit;
      if (offset >= total || results.length === 0) break;
    }
    return offers;
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
