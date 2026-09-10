import rawCatalog from "./catalog.json";

/** שורת קטלוג: [שם, קטגוריה, דומיין]. */
export type CatalogRow = [name: string, category: string, domain: string];

export const CATALOG: CatalogRow[] = rawCatalog as CatalogRow[];

/** שיעור עמלה גולמי ברירת-מחדל לפי קטגוריה (עד שמתחבר שיעור אמיתי מהרשת). */
const RATE_BY_CATEGORY: Record<string, number> = {
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

export function catalogRate(category: string): number {
  return RATE_BY_CATEGORY[category] ?? 5;
}

/** חלק המשתמש ברירת-מחדל (אחוז מהעמלה שחוזר למשתמש). */
export function catalogUserShare(): number {
  return 60;
}
