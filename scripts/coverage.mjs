// דו"ח כיסוי רב-רשתי (Admitad + Awin + ...) מול הקטלוג שלנו.
// מריצים מקומית עם משתני-סביבה של המפתחות (לא נשמרים בקוד):
//   $env:ADMITAD_CLIENT_ID="..."; $env:ADMITAD_CLIENT_SECRET="..."; $env:ADMITAD_WEBSITE_ID="2992984"
//   $env:AWIN_API_TOKEN="..."; $env:AWIN_PUBLISHER_ID="3086473"
//   node scripts/coverage.mjs
// כל רשת שאין לה מפתחות פשוט מדולגת.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

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

// ---------- Admitad ----------
async function admitadProgrammes() {
  const id = process.env.ADMITAD_CLIENT_ID;
  const secret = process.env.ADMITAD_CLIENT_SECRET;
  const website = process.env.ADMITAD_WEBSITE_ID || "2992984";
  if (!id || !secret) return null;

  const basic = Buffer.from(`${id}:${secret}`).toString("base64");
  const tokRes = await fetch("https://api.admitad.com/token/", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: id,
      scope: "advcampaigns_for_website",
    }),
  });
  const tok = (await tokRes.json()).access_token;

  const out = [];
  const limit = 100;
  let offset = 0;
  while (true) {
    const res = await fetch(
      `https://api.admitad.com/advcampaigns/website/${website}/?limit=${limit}&offset=${offset}`,
      { headers: { Authorization: `Bearer ${tok}` } },
    );
    const data = await res.json();
    const results = data.results ?? [];
    for (const c of results) {
      const detail = (c.actions_detail ?? []).find((a) => a.rate);
      const rate = detail?.rate ? parseFloat(detail.rate) : null;
      out.push({
        domain: domainOf(c.site_url),
        name: c.name,
        status: c.connection_status ?? (c.gotolink ? "active" : "unknown"),
        rate: Number.isNaN(rate) ? null : rate,
      });
    }
    const total = data._meta?.count ?? out.length;
    offset += limit;
    if (offset >= total || results.length === 0) break;
  }
  return out;
}

// ---------- Awin ----------
async function awinProgrammes() {
  const token = process.env.AWIN_API_TOKEN;
  const pub = process.env.AWIN_PUBLISHER_ID;
  if (!token || !pub) return null;

  const res = await fetch(
    `https://api.awin.com/publishers/${pub}/programmes?relationship=joined`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) {
    console.error(`Awin programmes failed: ${res.status}`);
    return [];
  }
  const progs = await res.json();
  return (progs ?? []).map((p) => {
    let best = null;
    for (const r of p.commissionRange ?? []) {
      const val = Number(r.max ?? r.min ?? 0);
      const isPct = (r.type ?? "percentage").toLowerCase().startsWith("perc");
      if (isPct && val > (best ?? 0)) best = val;
    }
    return {
      domain: domainOf(p.displayUrl || p.clickThroughUrl || ""),
      name: p.name,
      status: "active",
      rate: best,
    };
  });
}

// ---------- הצלבה ----------
const providers = {};
const adm = await admitadProgrammes();
if (adm) providers.admitad = adm;
const awin = await awinProgrammes();
if (awin) providers.awin = awin;

if (Object.keys(providers).length === 0) {
  console.error("לא הוגדרו מפתחות לאף רשת. ראו הוראות בראש הקובץ.");
  process.exit(1);
}

// domain -> { net: { rate, status, name } } (שומר את הרייט הגבוה לכל רשת)
const byDomain = {};
for (const [net, list] of Object.entries(providers)) {
  for (const p of list) {
    if (!p.domain) continue;
    const cur = (byDomain[p.domain] ??= {});
    if (!cur[net] || (p.rate ?? 0) > (cur[net].rate ?? 0)) {
      cur[net] = { rate: p.rate, status: p.status, name: p.name };
    }
  }
}

const isUsable = (info) => info && (info.status === "active");

const active = [];
const pending = [];
const missing = [];
for (const [name, , domain] of catalog) {
  const nets = byDomain[domainOf(domain)];
  if (!nets) {
    missing.push({ name, domain });
    continue;
  }
  const usable = Object.entries(nets).filter(([, i]) => isUsable(i));
  if (usable.length === 0) {
    pending.push({ name, domain, nets });
    continue;
  }
  usable.sort((a, b) => (b[1].rate ?? 0) - (a[1].rate ?? 0));
  const [bestNet, bestInfo] = usable[0];
  active.push({
    name,
    domain,
    best: bestNet,
    bestRate: bestInfo.rate,
    all: Object.fromEntries(
      Object.entries(nets).map(([n, i]) => [n, i.rate]),
    ),
  });
}

// ---------- פלט ----------
const fmtRate = (r) => (r == null ? "?" : `${r}%`);
console.log(`\n=== דו"ח כיסוי רב-רשתי (${catalog.length} חנויות) ===`);
console.log(
  "רשתות: " +
    Object.entries(providers)
      .map(([n, l]) => `${n}=${l.length}`)
      .join(", "),
);

console.log(`\n✅ פעילות (${active.length}) — מביאות קאשבק:`);
for (const a of active) {
  const others = Object.entries(a.all)
    .map(([n, r]) => `${n} ${fmtRate(r)}`)
    .join(" | ");
  const multi = Object.keys(a.all).length > 1 ? `  →🏆 ${a.best}` : "";
  console.log(`  • ${a.name}: ${others}${multi}`);
}

console.log(`\n⏳ ממתינות לאישור (${pending.length}):`);
console.log(pending.map((p) => `  • ${p.name}`).join("\n") || "  (אין)");

console.log(`\n❌ לא קיימות באף רשת (${missing.length}) — צריך רשת נוספת:`);
console.log(
  missing
    .slice(0, 40)
    .map((m) => `  • ${m.name}`)
    .join("\n") || "  (אין)",
);
if (missing.length > 40) console.log(`  ...ועוד ${missing.length - 40}`);

const outPath = join(__dirname, "..", "coverage.json");
writeFileSync(
  outPath,
  JSON.stringify({ providers: Object.keys(providers), active, pending, missing }, null, 2),
  "utf8",
);
console.log(`\nנשמר דו"ח מלא: ${outPath}`);
