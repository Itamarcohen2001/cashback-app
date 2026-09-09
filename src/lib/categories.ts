/** מטא-דאטה לקטגוריות: אייקון וצבע לתצוגת גלריית הקטגוריות. */
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/theme";

type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

export interface CategoryMeta {
  name: string;
  icon: IoniconName;
  color: string;
}

/** מטא לפי שם קטגוריה (כפי שמופיע ב-store.category). */
const META: Record<string, { icon: IoniconName; color: string }> = {
  אופנה: { icon: "shirt", color: "#FF5A6A" },
  "קניות כלליות": { icon: "cart", color: "#6C5CE7" },
  אלקטרוניקה: { icon: "phone-portrait", color: "#0984E3" },
  "טיסות ומלונות": { icon: "airplane", color: "#00B894" },
  "בריאות וטבע": { icon: "leaf", color: "#2ECC71" },
  ספורט: { icon: "football", color: "#FF9F1C" },
  "בית וריהוט": { icon: "bed", color: "#E17055" },
  "ילדים ותינוקות": { icon: "happy", color: "#FD79A8" },
  ספרים: { icon: "book", color: "#A29BFE" },
  "יופי וטיפוח": { icon: "sparkles", color: "#E84393" },
  "מזון ומשלוחים": { icon: "fast-food", color: "#FDCB6E" },
};

const FALLBACK: { icon: IoniconName; color: string } = {
  icon: "pricetag",
  color: colors.primary,
};

export function categoryMeta(name: string): CategoryMeta {
  const m = META[name] ?? FALLBACK;
  return { name, icon: m.icon, color: m.color };
}
