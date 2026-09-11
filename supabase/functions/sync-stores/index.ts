/**
 * סנכרון חנויות מרשת השותפים אל טבלת stores.
 * מושך את המפרסמים המחוברים (עם תבנית קישור אמיתית) ומעדכן/מוסיף אותם.
 * הרצה: קריאה מאובטחת עם x-sync-secret, או תזמון (cron) דרך Supabase.
 */
import { adminClient } from "../_shared/db.ts";
import { getNetworks, type NetworkOffer } from "../_shared/networks.ts";
import { cors, json } from "../_shared/http.ts";

/** מחלץ דומיין נקי מכתובת URL. */
function domainOf(url: string | null | undefined): string | null {
  if (!url) return null;
  const c = String(url)
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "");
  return c.split(/[/?#]/)[0] || null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const secret =
    req.headers.get("x-sync-secret") ??
    new URL(req.url).searchParams.get("secret");
  const expected = Deno.env.get("SYNC_SECRET");
  if (!expected || secret !== expected) {
    return json({ error: "unauthorized" }, 401);
  }

  // מושכים הצעות מכל הרשתות המוגדרות (Admitad + Awin וכו').
  const networks = getNetworks();

  // מצב דיבאג: דגימת הצעות גולמית מרשת נבחרת (?sample=1[&network=awin]).
  const reqUrl = new URL(req.url);
  if (reqUrl.searchParams.get("sample") === "1") {
    const which = (reqUrl.searchParams.get("network") ?? "").toLowerCase();
    const net = networks.find(
      (n) => (!which || n.name === which) && n.fetchOffersRaw,
    );
    if (net?.fetchOffersRaw) {
      try {
        return json({ ok: true, network: net.name, sample: await net.fetchOffersRaw() });
      } catch (e) {
        return json({ error: String(e instanceof Error ? e.message : e) }, 502);
      }
    }
    return json({ ok: true, sample: [] });
  }

  const offers: Array<NetworkOffer & { __network: string }> = [];
  const perNetwork: Record<string, number> = {};
  for (const net of networks) {
    try {
      const o = await net.fetchOffers();
      perNetwork[net.name] = o.length;
      for (const off of o) offers.push({ ...off, __network: net.name });
    } catch (e) {
      perNetwork[net.name] = -1; // -1 = שגיאה בשליפה מהרשת הזו
      console.error(`fetchOffers ${net.name}:`, e);
    }
  }

  const db = adminClient();

  // מצב דו"ח: מצליב את התוכניות המחוברות מול הקטלוג שלנו, בלי לכתוב ל-DB.
  if (new URL(req.url).searchParams.get("coverage") === "1") {
    const { data: stores } = await db.from("stores").select("name, base_url");
    const offerDomains = new Set(
      offers.map((o) => domainOf(o.baseUrl)).filter(Boolean),
    );
    const covered: string[] = [];
    const missing: string[] = [];
    for (const s of stores ?? []) {
      const d = domainOf(s.base_url);
      if (d && offerDomains.has(d)) covered.push(s.name);
      else missing.push(s.name);
    }
    return json({
      ok: true,
      networks: perNetwork,
      connectedPrograms: offers.length,
      coveredCount: covered.length,
      missingCount: missing.length,
      covered: covered.sort(),
      missing: missing.sort(),
    });
  }

  const rows = offers.map((o) => ({
    network: o.__network,
    network_offer_id: o.externalId,
    name: o.name,
    category: o.category,
    description: o.description,
    logo_url: o.logoUrl,
    base_url: o.baseUrl,
    affiliate_url_template: o.affiliateUrlTemplate,
    cashback_type: o.cashbackType,
    cashback_value: o.cashbackValue,
    variable: o.variable,
    active: true,
  }));

  if (rows.length > 0) {
    const { error } = await db
      .from("stores")
      .upsert(rows, { onConflict: "network,network_offer_id" });
    if (error) return json({ error: error.message }, 500);
  }

  // בחירת ההחזר הגבוה ביותר לכל דומיין: משאירים פעילה רק את החנות עם הקאשבק
  // האפקטיבי הגבוה ביותר, ומשביתים כפילויות (רשתות אחרות / רשומות ידניות).
  const deactivated = await pickBestPerDomain(db);

  return json({
    ok: true,
    synced: rows.length,
    networks: perNetwork,
    deactivatedDuplicates: deactivated,
  });
});

/**
 * לכל דומיין שיש בו לפחות חנות אחת עם מעקב אמיתי — משאירים פעילה את זו עם
 * הקאשבק האפקטיבי הגבוה ביותר (value × user_share), ומשביתים את השאר.
 * דומיין שכולו רשומות ידניות (ללא מעקב) נשאר כמו שהוא.
 */
async function pickBestPerDomain(
  db: ReturnType<typeof adminClient>,
): Promise<number> {
  const { data: all } = await db
    .from("stores")
    .select(
      "id, base_url, affiliate_url_template, cashback_value, user_share_percent, active",
    );
  const groups = new Map<string, NonNullable<typeof all>>();
  for (const s of all ?? []) {
    const d = domainOf(s.base_url);
    if (!d) continue;
    const arr = groups.get(d) ?? [];
    arr.push(s);
    groups.set(d, arr);
  }

  const activate: string[] = [];
  const deactivate: string[] = [];
  const eff = (s: { cashback_value: number; user_share_percent: number }) =>
    (Number(s.cashback_value) || 0) * (Number(s.user_share_percent) || 0);

  for (const arr of groups.values()) {
    const trackable = arr.filter((s) => s.affiliate_url_template);
    if (trackable.length === 0) continue; // כולו ידני — לא נוגעים
    trackable.sort((a, b) => eff(b) - eff(a));
    const best = trackable[0];
    for (const s of arr) {
      if (s.id === best.id) {
        if (!s.active) activate.push(s.id);
      } else if (s.active) {
        deactivate.push(s.id);
      }
    }
  }

  if (activate.length) {
    await db.from("stores").update({ active: true }).in("id", activate);
  }
  if (deactivate.length) {
    await db.from("stores").update({ active: false }).in("id", deactivate);
  }
  return deactivate.length;
}
