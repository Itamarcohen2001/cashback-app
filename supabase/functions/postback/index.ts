/**
 * Postback / Webhook מרשת השותפים.
 * הרשת קוראת ל-URL הזה כשמתבצעת רכישה. אנחנו מאתרים את הקליק לפי ה-subid
 * (הטוקן שהזרקנו לקישור), מחשבים קאשבק ויוצרים/מעדכנים עסקה.
 *
 * הגדרת ה-postback ברשת (דוגמה ל-Admitad):
 *   https://<project>.supabase.co/functions/v1/postback?secret=XXX
 *     &subid={subid}&order_sum={order_sum}&payment_sum={payment_sum}
 *     &currency={currency}&status={status}&action_id={action_id}
 */
import { adminClient } from "../_shared/db.ts";
import { getNetwork } from "../_shared/networks.ts";
import { cors, json } from "../_shared/http.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const url = new URL(req.url);

  // אימות סוד משותף כדי שרק הרשת תוכל לדווח.
  const secret =
    url.searchParams.get("secret") ?? req.headers.get("x-postback-secret");
  const expected = Deno.env.get("POSTBACK_SECRET");
  if (!expected || secret !== expected) {
    return json({ error: "unauthorized" }, 401);
  }

  let body: Record<string, unknown> | null = null;
  try {
    if (req.headers.get("content-type")?.includes("application/json")) {
      body = await req.json();
    }
  } catch {
    body = null;
  }

  const network = getNetwork();
  const event = network.parsePostback(url, body);

  if (!event.subid) return json({ error: "missing subid" }, 400);

  const db = adminClient();

  // מאתרים את הקליק לפי הטוקן (subid) כדי לשייך למשתמש ולחנות.
  const { data: click, error: clickErr } = await db
    .from("clicks")
    .select("id, user_id, store_id")
    .eq("token", event.subid)
    .maybeSingle();

  if (clickErr) return json({ error: clickErr.message }, 500);
  if (!click) {
    // subid לא מוכר — מחזירים 200 כדי שהרשת לא תנסה שוב, ומתעדים.
    console.warn("postback: unknown subid", event.subid);
    return json({ ok: true, ignored: "unknown subid" });
  }

  const { data: store } = await db
    .from("stores")
    .select("cashback_type, cashback_value, user_share_percent")
    .eq("id", click.store_id)
    .maybeSingle();

  // מחשבים את הקאשבק ללקוח: אם הרשת דיווחה עמלה נשתמש בה, אחרת מחשבים מהשיעור.
  const cashbackAmount = computeCashback(event, store);

  const row = {
    user_id: click.user_id,
    store_id: click.store_id,
    click_id: click.id,
    order_amount: event.orderAmount,
    cashback_amount: cashbackAmount,
    status: event.status,
    network_txn_id: event.networkTxnId,
    confirmed_at:
      event.status === "confirmed" ? new Date().toISOString() : null,
  };

  // idempotent: אם כבר קיימת עסקה עם אותו network_txn_id — מעדכנים סטטוס/סכום.
  const { error: upsertErr } = await db
    .from("cashback_transactions")
    .upsert(row, { onConflict: "network_txn_id", ignoreDuplicates: false });

  if (upsertErr) return json({ error: upsertErr.message }, 500);

  return json({ ok: true, status: event.status, cashback: cashbackAmount });
});

function computeCashback(
  event: { reportedCashback: number | null; orderAmount: number | null },
  store: {
    cashback_type: string;
    cashback_value: number;
    user_share_percent: number;
  } | null,
): number {
  const share = store ? store.user_share_percent / 100 : 0.5;
  if (event.reportedCashback != null) {
    return round2(event.reportedCashback * share);
  }
  if (!store) return 0;
  const commission =
    store.cashback_type === "percent"
      ? ((event.orderAmount ?? 0) * store.cashback_value) / 100
      : store.cashback_value;
  return round2(commission * share);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
