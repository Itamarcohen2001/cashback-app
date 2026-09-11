/**
 * סנכרון קופונים/דילים מרשת השותפים אל טבלת coupons.
 * מושך את הקופונים המחוברים, מקשר כל קופון לחנות דרך network_offer_id,
 * ומעדכן/מוסיף אותם (upsert לפי network + network_coupon_id).
 * הרצה: קריאה מאובטחת עם x-sync-secret, או תזמון (cron) דרך Supabase.
 */
import { adminClient } from "../_shared/db.ts";
import { getNetworks, type NetworkCoupon } from "../_shared/networks.ts";
import { cors, json } from "../_shared/http.ts";

/** מחלץ דומיין נקי מכתובת URL (למשל https://www.nike.com/x -> nike.com). */
function domainOf(url: string | null | undefined): string | null {
  if (!url) return null;
  const cleaned = url
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "");
  const domain = cleaned.split(/[/?#]/)[0];
  return domain || null;
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

  const url = new URL(req.url);
  const networks = getNetworks();

  // מצב דיבאג: דגימת קופונים גולמית מרשת נבחרת (?sample=1[&network=awin]).
  if (url.searchParams.get("sample") === "1") {
    const which = (url.searchParams.get("network") ?? "").toLowerCase();
    const net = networks.find(
      (n) => (!which || n.name === which) && n.fetchCouponsRaw,
    );
    if (net?.fetchCouponsRaw) {
      try {
        const raw = await net.fetchCouponsRaw();
        return json({ ok: true, network: net.name, sample: raw.slice(0, 20) });
      } catch (e) {
        return json({ error: String(e instanceof Error ? e.message : e) }, 502);
      }
    }
    return json({ ok: true, sample: [] });
  }

  // אוספים קופונים מכל הרשתות, מתויגים לפי מקור.
  const tagged: Array<NetworkCoupon & { __network: string }> = [];
  const perNetwork: Record<string, number> = {};
  for (const net of networks) {
    try {
      const cs = await net.fetchCoupons();
      perNetwork[net.name] = cs.length;
      for (const c of cs) tagged.push({ ...c, __network: net.name });
    } catch (e) {
      perNetwork[net.name] = -1;
      console.error(`fetchCoupons ${net.name}:`, e);
    }
  }

  const db = adminClient();

  // מיפוי קמפיין(network:id) -> דומיין, מכל ההצעות של כל הרשתות.
  const offerDomain = new Map<string, string>();
  for (const net of networks) {
    try {
      const offers = await net.fetchOffers();
      for (const o of offers) {
        const d = domainOf(o.baseUrl);
        if (d) offerDomain.set(`${net.name}:${o.externalId}`, d);
      }
    } catch (_e) {
      // ממשיכים — קישור לפי network_offer_id עדיין יעבוד.
    }
  }

  // כל החנויות הפעילות: מיפוי לפי (network:offer) וגם לפי דומיין.
  const { data: stores, error: storesErr } = await db
    .from("stores")
    .select("id, base_url, network, network_offer_id")
    .eq("active", true);
  if (storesErr) return json({ error: storesErr.message }, 500);

  const storeByOffer = new Map<string, string>();
  const storeByDomain = new Map<string, string>();
  for (const s of stores ?? []) {
    if (s.network_offer_id && s.network) {
      storeByOffer.set(`${s.network}:${s.network_offer_id}`, s.id);
    }
    const d = domainOf(s.base_url);
    if (d && !storeByDomain.has(d)) storeByDomain.set(d, s.id);
  }

  const rows = tagged
    .map((c) => {
      const key = `${c.__network}:${c.campaignExternalId}`;
      let storeId = storeByOffer.get(key);
      if (!storeId) {
        const d = offerDomain.get(key);
        if (d) storeId = storeByDomain.get(d);
      }
      if (!storeId) return null;
      return {
        store_id: storeId,
        network: c.__network,
        network_coupon_id: c.externalId,
        title: c.title,
        code: c.code,
        description: c.description,
        expires_at: c.expiresAt,
        featured: c.featured,
        active: true,
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

  if (rows.length > 0) {
    const { error } = await db
      .from("coupons")
      .upsert(rows, { onConflict: "network,network_coupon_id" });
    if (error) return json({ error: error.message }, 500);
  }

  // מחיקת קופוני-רשת ישנים לכל רשת שנמשכה בהצלחה (רשת שנכשלה לא נוגעים בה).
  const keptByNetwork = new Map<string, string[]>();
  for (const r of rows) {
    const arr = keptByNetwork.get(r.network) ?? [];
    arr.push(r.network_coupon_id);
    keptByNetwork.set(r.network, arr);
  }
  for (const net of networks) {
    if ((perNetwork[net.name] ?? -1) < 0) continue; // דילוג על רשת שנכשלה
    const keep = keptByNetwork.get(net.name) ?? [];
    let del = db.from("coupons").delete().eq("network", net.name);
    if (keep.length > 0) {
      del = del.not("network_coupon_id", "in", `(${keep.join(",")})`);
    }
    const { error: delErr } = await del;
    if (delErr) return json({ error: delErr.message }, 500);
  }

  return json({
    ok: true,
    synced: rows.length,
    fetched: tagged.length,
    networks: perNetwork,
  });
});
