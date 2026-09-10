/**
 * סנכרון חנויות מרשת השותפים אל טבלת stores.
 * מושך את המפרסמים המחוברים (עם תבנית קישור אמיתית) ומעדכן/מוסיף אותם.
 * הרצה: קריאה מאובטחת עם x-sync-secret, או תזמון (cron) דרך Supabase.
 */
import { adminClient } from "../_shared/db.ts";
import { getNetwork } from "../_shared/networks.ts";
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

  const network = getNetwork();
  let offers;
  try {
    offers = await network.fetchOffers();
  } catch (e) {
    return json({ error: String(e instanceof Error ? e.message : e) }, 502);
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
      connectedPrograms: offers.length,
      coveredCount: covered.length,
      missingCount: missing.length,
      covered: covered.sort(),
      missing: missing.sort(),
    });
  }

  const rows = offers.map((o) => ({
    network: network.name,
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

  if (rows.length === 0) return json({ ok: true, synced: 0 });

  const { error } = await db
    .from("stores")
    .upsert(rows, { onConflict: "network,network_offer_id" });

  if (error) return json({ error: error.message }, 500);

  return json({ ok: true, synced: rows.length, network: network.name });
});
