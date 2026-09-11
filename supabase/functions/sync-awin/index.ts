/**
 * זיכוי קאשבק מ-Awin.
 * שלא כמו Admitad (postback), Awin מזכה ע"י משיכת transactions ב-API.
 * מושכים עסקאות בטווח תאריכים, מאתרים את הקליק לפי clickRef (הטוקן/subid),
 * מחשבים קאשבק ויוצרים/מעדכנים עסקה (idempotent לפי network_txn_id).
 * הרצה: POST עם x-sync-secret. תזמון יומי מומלץ.
 */
import { adminClient } from "../_shared/db.ts";
import { AwinNetwork } from "../_shared/networks.ts";
import { cors, json } from "../_shared/http.ts";

type Status = "pending" | "confirmed" | "rejected";

/** ממפה סטטוס עמלה של Awin לסטטוס הפנימי שלנו. */
function mapStatus(raw?: string): Status {
  const s = (raw ?? "").toLowerCase();
  if (s === "approved" || s === "confirmed") return "confirmed";
  if (s === "declined" || s === "deleted" || s === "rejected")
    return "rejected";
  return "pending";
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** פורמט תאריך ל-Awin: YYYY-MM-DDThh:mm:ss */
function awinDate(d: Date): string {
  return d.toISOString().slice(0, 19);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const url = new URL(req.url);
  const secret =
    req.headers.get("x-sync-secret") ?? url.searchParams.get("secret");
  const expected = Deno.env.get("SYNC_SECRET");
  if (!expected || secret !== expected) {
    return json({ error: "unauthorized" }, 401);
  }
  if (!Deno.env.get("AWIN_API_TOKEN")) {
    return json({ error: "Awin לא מוגדר (חסר AWIN_API_TOKEN)" }, 400);
  }

  // טווח תאריכים: ברירת מחדל 30 הימים האחרונים (Awin מגביל ל-~31 יום לבקשה).
  const days = Math.min(Number(url.searchParams.get("days")) || 30, 31);
  const end = new Date();
  const start = new Date(end.getTime() - days * 86400000);

  const awin = new AwinNetwork();
  let txns;
  try {
    txns = await awin.fetchTransactions(awinDate(start), awinDate(end));
  } catch (e) {
    return json({ error: String(e instanceof Error ? e.message : e) }, 502);
  }

  const db = adminClient();
  let credited = 0;
  let ignored = 0;

  for (const t of txns) {
    const subid = (t.clickRef ?? "").trim();
    if (!subid) {
      ignored++;
      continue;
    }
    const { data: click } = await db
      .from("clicks")
      .select("id, user_id, store_id")
      .eq("token", subid)
      .maybeSingle();
    if (!click) {
      ignored++;
      continue;
    }

    const { data: store } = await db
      .from("stores")
      .select("user_share_percent")
      .eq("id", click.store_id)
      .maybeSingle();

    const share = store ? (store.user_share_percent ?? 0) / 100 : 0.5;
    const commission = Number(t.commissionAmount?.amount ?? 0);
    const cashbackAmount = round2(commission * share);
    const status = mapStatus(t.commissionStatus);

    const { error: upErr } = await db.from("cashback_transactions").upsert(
      {
        user_id: click.user_id,
        store_id: click.store_id,
        click_id: click.id,
        order_amount: Number(t.saleAmount?.amount ?? 0) || null,
        cashback_amount: cashbackAmount,
        status,
        network_txn_id: `awin-${t.id}`,
        confirmed_at: status === "confirmed" ? new Date().toISOString() : null,
      },
      { onConflict: "network_txn_id", ignoreDuplicates: false },
    );
    if (upErr) return json({ error: upErr.message }, 500);
    credited++;
  }

  return json({ ok: true, fetched: txns.length, credited, ignored });
});
