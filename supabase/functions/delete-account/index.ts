/**
 * מחיקת חשבון המשתמש המחובר.
 * מאמת את ה-JWT מכותרת Authorization, ומוחק את המשתמש (וה-profile) בעזרת service role.
 * הרצה: פונקציה מוגנת — קוראים אליה מהאפליקציה עם ה-access token של המשתמש.
 */
import { adminClient } from "../_shared/db.ts";
import { cors, json } from "../_shared/http.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);

  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) return json({ error: "unauthorized" }, 401);

  const db = adminClient();

  // אימות המשתמש מתוך ה-JWT.
  const { data: userData, error: userErr } = await db.auth.getUser(token);
  if (userErr || !userData?.user) {
    return json({ error: "unauthorized" }, 401);
  }
  const uid = userData.user.id;

  // מחיקת רשומת הפרופיל (טבלאות תלויות נמחקות ב-cascade לפי ה-FK).
  await db.from("profiles").delete().eq("id", uid);

  // מחיקת משתמש ה-Auth עצמו.
  const { error: delErr } = await db.auth.admin.deleteUser(uid);
  if (delErr) {
    return json({ error: String(delErr.message ?? delErr) }, 500);
  }

  return json({ ok: true });
});
