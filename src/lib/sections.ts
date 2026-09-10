import { Ionicons } from "@expo/vector-icons";
import { Store } from "./types";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

/** האם החנות ישראלית (לפי דומיין .co.il / .org.il / wolt עברית). */
export function isIsraeliStore(store: Pick<Store, "base_url">): boolean {
  const url = (store.base_url ?? "").toLowerCase();
  return /\.co\.il|\.org\.il|\.il(\/|$)|wolt\.com\/he/.test(url);
}

/** קאשבק אפקטיבי למשתמש (לצורך מיון/סינון). */
function effective(s: Store): number {
  return (s.cashback_value * s.user_share_percent) / 100;
}

export interface Collection {
  id: string;
  title: string;
  subtitle: string;
  icon: IconName;
  color: string;
  match: (s: Store) => boolean;
}

/** אוספים נושאתיים (בהשראת ה-Sections של cashback.co.il). */
export const COLLECTIONS: Collection[] = [
  {
    id: "israeli",
    title: "חנויות ישראליות",
    subtitle: "קונים כחול-לבן עם קאשבק",
    icon: "flag",
    color: "#3B82F6",
    match: isIsraeliStore,
  },
  {
    id: "popular",
    title: "הכי פופולריות",
    subtitle: "החנויות המבוקשות ביותר",
    icon: "flame",
    color: "#FF5A6A",
    match: (s) => Boolean(s.popular),
  },
  {
    id: "top-cashback",
    title: "קאשבק גבוה",
    subtitle: "ההחזרים הכי משתלמים",
    icon: "trending-up",
    color: "#00C48C",
    match: (s) => effective(s) >= 3,
  },
  {
    id: "fashion",
    title: "אופנה וסטייל",
    subtitle: "ביגוד, הנעלה ואקססוריז",
    icon: "shirt",
    color: "#EC4899",
    match: (s) => s.category === "אופנה",
  },
  {
    id: "beauty",
    title: "יופי וטיפוח",
    subtitle: "איפור, בישום וטיפוח",
    icon: "sparkles",
    color: "#A855F7",
    match: (s) => s.category === "יופי וטיפוח",
  },
  {
    id: "travel",
    title: "טיסות ומלונות",
    subtitle: "חופשות ונופש",
    icon: "airplane",
    color: "#0EA5E9",
    match: (s) => s.category === "טיסות ומלונות",
  },
  {
    id: "electronics",
    title: "אלקטרוניקה וגאדג'טים",
    subtitle: "מחשבים, טלפונים וחשמל",
    icon: "hardware-chip",
    color: "#6366F1",
    match: (s) => s.category === "אלקטרוניקה",
  },
  {
    id: "kids",
    title: "ילדים ותינוקות",
    subtitle: "הכול לילד ולמשפחה",
    icon: "happy",
    color: "#F59E0B",
    match: (s) => s.category === "ילדים ותינוקות",
  },
  {
    id: "home",
    title: "בית וריהוט",
    subtitle: "לעצב ולצייד את הבית",
    icon: "home",
    color: "#14B8A6",
    match: (s) => s.category === "בית וריהוט",
  },
  {
    id: "sport",
    title: "ספורט וכושר",
    subtitle: "ביגוד וציוד ספורט",
    icon: "basketball",
    color: "#F97316",
    match: (s) => s.category === "ספורט",
  },
  {
    id: "health",
    title: "בריאות וטבע",
    subtitle: "תוספי תזונה ומוצרים אורגניים",
    icon: "leaf",
    color: "#22C55E",
    match: (s) => s.category === "בריאות וטבע",
  },
  {
    id: "food",
    title: "אוכל ומשלוחים",
    subtitle: "מזון, קפה ומצרכים",
    icon: "fast-food",
    color: "#EF4444",
    match: (s) => s.category === "מזון ומשלוחים",
  },
];

export function collectionById(id: string): Collection | undefined {
  return COLLECTIONS.find((c) => c.id === id);
}
