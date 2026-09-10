// מייצר מיגרציית SQL מלאה מקטלוג החנויות (src/lib/catalog.json).
// הרצה: node scripts/gen-catalog-sql.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const catalog = JSON.parse(
  readFileSync(join(root, "src/lib/catalog.json"), "utf8"),
);

const RATE_BY_CATEGORY = {
  אופנה: 6,
  "יופי וטיפוח": 6,
  "טיסות ומלונות": 4,
  אלקטרוניקה: 3,
  "ילדים ותינוקות": 5,
  "בית וריהוט": 4,
  ספורט: 5,
  "בריאות וטבע": 6,
  "מזון ומשלוחים": 4,
  "קניות כלליות": 5,
  ספרים: 4,
  "פנאי ובידור": 4,
  "שירותים דיגיטליים": 8,
  "פיננסים וביטוח": 3,
  "חיות מחמד": 6,
};
const SHARE = 60;
const q = (s) => s.replace(/'/g, "''");

const rows = catalog
  .map(([name, category, domain]) => {
    const rate = RATE_BY_CATEGORY[category] ?? 5;
    return `  ('${q(name)}', '${q(category)}', 'https://${q(domain)}', 'percent', ${rate}, ${SHARE}, false, true)`;
  })
  .join(",\n");

const sql = `-- CashyCash – ייבוא הקטלוג המלא (341 חנויות בהשראת cashback.co.il)
-- נוצר אוטומטית ע"י scripts/gen-catalog-sql.mjs — אין לערוך ידנית.
-- idempotent: מוסיף רק חנויות שעדיין לא קיימות (לפי שם).

insert into public.stores
  (name, category, base_url, cashback_type, cashback_value, user_share_percent, variable, active)
select v.name, v.category, v.base_url, v.cashback_type, v.cashback_value,
       v.user_share_percent, v.variable, v.active
from (values
${rows}
) as v(name, category, base_url, cashback_type, cashback_value, user_share_percent, variable, active)
where not exists (select 1 from public.stores s where s.name = v.name);
`;

writeFileSync(join(root, "supabase/migrations/0012_full_catalog.sql"), sql, "utf8");
console.log(`Wrote 0012_full_catalog.sql with ${catalog.length} stores.`);
