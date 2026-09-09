/**
 * סנכרון קופונים/דילים מרשת השותפים אל טבלת coupons.
 * מושך את הקופונים המחוברים, מקשר כל קופון לחנות דרך network_offer_id,
 * ומעדכן/מוסיף אותם (upsert לפי network + network_coupon_id).
 * הרצה: קריאה מאובטחת עם x-sync-secret, או תזמון (cron) דרך Supabase.
 */
import { adminClient } from "../_shared/db.ts";
import { getNetwork } from "../_shared/networks.ts";
import { cors, json } from "../_shared/http.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const secret =
    req.headers.get("x-sync-secret") ??
    new URL(req.url).searchParams.get("secret");
  const expected = Deno.env.get("SYNC_SECRET");
  if (!expected || secret !== expected) {
    return json({ error: "unauthorized" }, 401);
  }

  const network = getNetwork();

  // מצב דיבאג: מחזיר דגימת קופונים גולמית (לבדיקת השדות שמגיעים מהרשת)
  const url = new URL(req.url);
  if (url.searchParams.get("sample") === "1" && network.fetchCouponsRaw) {
    try {
      const raw = await network.fetchCouponsRaw();
      return json({ ok: true, sample: raw.slice(0, 20) });
    } catch (e) {
      return json({ error: String(e instanceof Error ? e.message : e) }, 502);
    }
  }

  let coupons;
  try {
    coupons = await network.fetchCoupons();
  } catch (e) {
    return json({ error: String(e instanceof Error ? e.message : e) }, 502);
  }

  const db = adminClient();

  // מיפוי network_offer_id -> store_id עבור החנויות של אותה רשת
  const { data: stores, error: storesErr } = await db
    .from("stores")
    .select("id, network_offer_id")
    .eq("network", network.name);
  if (storesErr) return json({ error: storesErr.message }, 500);

  const storeByOffer = new Map<string, string>();
  for (const s of stores ?? []) {
    if (s.network_offer_id) storeByOffer.set(String(s.network_offer_id), s.id);
  }

  const rows = coupons
    .map((c) => {
      const storeId = storeByOffer.get(c.campaignExternalId);
      if (!storeId) return null;
      return {
        store_id: storeId,
        network: network.name,
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

  if (rows.length === 0) {
    return json({ ok: true, synced: 0, fetched: coupons.length });
  }

  const { error } = await db
    .from("coupons")
    .upsert(rows, { onConflict: "network,network_coupon_id" });

  if (error) return json({ error: error.message }, 500);

  // מחיקת קופוני-רשת ישנים שכבר לא נמשכים (סוננו/הוסרו) — קופונים ידניים (network=null) לא נגעים.
  const keepIds = rows.map((r) => r.network_coupon_id);
  const { error: delErr } = await db
    .from("coupons")
    .delete()
    .eq("network", network.name)
    .not("network_coupon_id", "in", `(${keepIds.join(",")})`);
  if (delErr) return json({ error: delErr.message }, 500);

  return json({
    ok: true,
    synced: rows.length,
    fetched: coupons.length,
    network: network.name,
  });
});
