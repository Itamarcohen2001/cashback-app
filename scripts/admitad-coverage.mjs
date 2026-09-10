// דו"ח כיסוי Admitad מול הקטלוג שלנו.
// מריצים מקומית: מגדירים משתני-סביבה עם מפתחות Admitad ואז `node scripts/admitad-coverage.mjs`.
//   $env:ADMITAD_CLIENT_ID="...";  $env:ADMITAD_CLIENT_SECRET="...";  $env:ADMITAD_WEBSITE_ID="2992984"
//   node scripts/admitad-coverage.mjs
// הסודות לא נשמרים בקובץ — רק נקראים מהסביבה.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const API = "https://api.admitad.com";
const CLIENT_ID = process.env.ADMITAD_CLIENT_ID;
const CLIENT_SECRET = process.env.ADMITAD_CLIENT_SECRET;
const WEBSITE_ID = process.env.ADMITAD_WEBSITE_ID || "2992984";

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error(
    "חסרים מפתחות. הגדירו ADMITAD_CLIENT_ID ו-ADMITAD_CLIENT_SECRET כמשתני-סביבה.",
  );
  process.exit(1);
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const catalog = JSON.parse(
  readFileSync(join(__dirname, "..", "src", "lib", "catalog.json"), "utf8"),
);

function domainOf(url) {
  if (!url) return null;
  const c = String(url)
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "");
  return c.split(/[/?#]/)[0] || null;
}

async function token() {
  const basic = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: CLIENT_ID,
    scope: "advcampaigns_for_website",
  });
  const res = await fetch(`${API}/token/`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  if (!res.ok) throw new Error(`token failed: ${res.status} ${await res.text()}`);
  return (await res.json()).access_token;
}

async function allCampaigns(tok) {
  const out = [];
  const limit = 100;
  let offset = 0;
  while (true) {
    const res = await fetch(
      `${API}/advcampaigns/website/${WEBSITE_ID}/?limit=${limit}&offset=${offset}`,
      { headers: { Authorization: `Bearer ${tok}` } },
    );
    if (!res.ok)
      throw new Error(`advcampaigns failed: ${res.status} ${await res.text()}`);
    const data = await res.json();
    const results = data.results ?? [];
    for (const c of results) {
      out.push({
        id: c.id,
        name: c.name,
        domain: domainOf(c.site_url),
        status: c.connection_status ?? "unknown",
      });
    }
    const total = data._meta?.count ?? out.length;
    offset += limit;
    if (offset >= total || results.length === 0) break;
  }
  return out;
}

const tok = await token();
const campaigns = await allCampaigns(tok);

// מיפוי דומיין -> קמפיין (מעדיפים סטטוס פעיל).
const byDomain = new Map();
for (const c of campaigns) {
  if (!c.domain) continue;
  const prev = byDomain.get(c.domain);
  if (!prev || (prev.status !== "active" && c.status === "active")) {
    byDomain.set(c.domain, c);
  }
}

const active = [];
const pending = [];
const available = []; // קיים ב-Admitad אך לא מחובר
const missing = []; // לא קיים ב-Admitad בכלל

for (const [name, , domain] of catalog) {
  const c = byDomain.get(domainOf(domain));
  if (!c) missing.push({ name, domain });
  else if (c.status === "active") active.push({ name, domain, campaign: c.name });
  else if (c.status === "pending")
    pending.push({ name, domain, campaign: c.name });
  else available.push({ name, domain, campaign: c.name, status: c.status });
}

const line = (arr) => arr.map((x) => `  • ${x.name} (${x.domain})`).join("\n");

console.log(`\n=== דו"ח כיסוי Admitad מול הקטלוג (${catalog.length} חנויות) ===`);
console.log(`\n✅ מחוברות ופעילות (${active.length}) — מביאות קאשבק/דילים:`);
console.log(line(active) || "  (אין)");
console.log(`\n⏳ ממתינות לאישור (${pending.length}):`);
console.log(line(pending) || "  (אין)");
console.log(
  `\n🔌 קיימות ב-Admitad אך לא מחוברות (${available.length}) — כדאי לחבר:`,
);
console.log(line(available) || "  (אין)");
console.log(
  `\n❌ לא קיימות ב-Admitad (${missing.length}) — צריך רשת שותפים אחרת:`,
);
console.log(line(missing.slice(0, 40)) || "  (אין)");
if (missing.length > 40) console.log(`  ...ועוד ${missing.length - 40}`);

const outPath = join(__dirname, "..", "admitad-coverage.json");
writeFileSync(
  outPath,
  JSON.stringify({ active, pending, available, missing }, null, 2),
  "utf8",
);
console.log(`\nנשמר דו"ח מלא: ${outPath}`);
