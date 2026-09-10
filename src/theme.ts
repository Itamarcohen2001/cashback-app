/** ערכת העיצוב המרכזית של CashyCash — מודרנית, נקייה ותוססת. */
import { Platform } from "react-native";

/** פלטת מצב-יום (ברירת מחדל). */
export const lightPalette = {
  // מותג – סגול-אינדיגו תוסס
  primary: "#6C5CE7",
  primaryDark: "#4B3FD1",
  primaryLight: "#EEEBFF",

  // מבטא – מנטה/אמרלד "כסף"
  accent: "#00C48C",
  accentDark: "#00A879",
  accentLight: "#DDFBF0",

  // רקעים ומשטחים
  bg: "#F4F5FB",
  bgAlt: "#FFFFFF",
  card: "#FFFFFF",
  border: "#ECEDF5",
  backdrop: "#E9EAF2",

  // טקסט
  text: "#141527",
  textMuted: "#8A8FA6",
  textInverse: "#FFFFFF",

  // סטטוסים
  success: "#00C48C",
  warning: "#FF9F1C",
  danger: "#FF5A6A",
  dangerSoft: "#FFE9EB",

  // מצבי קאשבק
  pending: "#FF9F1C",
  confirmed: "#00C48C",
  paid: "#6C5CE7",
  rejected: "#FF5A6A",
} as const;

/** פלטת מצב-לילה — אותם מפתחות בדיוק. */
export const darkPalette: Record<keyof typeof lightPalette, string> = {
  primary: "#8B7CFF",
  primaryDark: "#6C5CE7",
  primaryLight: "#272446",

  accent: "#00D9A0",
  accentDark: "#28E0AE",
  accentLight: "#123027",

  bg: "#0E1016",
  bgAlt: "#171A23",
  card: "#1A1E2A",
  border: "#2A2F3C",
  backdrop: "#05060A",

  text: "#F4F6FC",
  textMuted: "#9AA0B4",
  textInverse: "#FFFFFF",

  success: "#00D9A0",
  warning: "#FFB454",
  danger: "#FF6B7A",
  dangerSoft: "#3A2126",

  pending: "#FFB454",
  confirmed: "#00D9A0",
  paid: "#8B7CFF",
  rejected: "#FF6B7A",
};

type PaletteKey = keyof typeof lightPalette;

/**
 * ב-web הצבעים הם משתני-CSS (var) כדי לאפשר החלפת מצב-יום/לילה חיה ללא רירנדור.
 * ב-native (שאין בו var) נשארים בערכי מצב-יום.
 */
export const colors = Object.fromEntries(
  (Object.keys(lightPalette) as PaletteKey[]).map((k) => [
    k,
    Platform.OS === "web"
      ? `var(--c-${k}, ${lightPalette[k]})`
      : lightPalette[k],
  ]),
) as Record<PaletteKey, string>;

/** בונה את גיליון ה-CSS עם משתני מצב-יום ומצב-לילה (web בלבד). */
export function buildThemeCss(): string {
  const toVars = (p: Record<string, string>) =>
    (Object.keys(p) as PaletteKey[]).map((k) => `--c-${k}:${p[k]};`).join("");
  // איפוס מסגרת המיקוד (outline) של הדפדפן בכל שדות הקלט — חוויית חיפוש נקייה.
  const focusReset =
    "input:focus,input:focus-visible,textarea:focus,textarea:focus-visible,[contenteditable]:focus{outline:none!important;box-shadow:none!important;}";
  return `${focusReset}\n:root{${toVars(lightPalette)}}\n:root[data-theme="dark"]{${toVars(darkPalette)}}`;
}

/** גרדיאנטים לרכיבים בולטים (כרטיס ארנק, כפתור ראשי וכו'). */
export const gradients = {
  primary: ["#8B7CFF", "#6C5CE7", "#4B3FD1"],
  wallet: ["#7B6CFF", "#5C4CE0"],
  money: ["#00D9A0", "#00A879"],
  sunset: ["#FF8A65", "#FF5A6A"],
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
} as const;

export const font = {
  sm: 13,
  md: 15,
  lg: 18,
  xl: 22,
  xxl: 28,
  xxxl: 34,
} as const;

/** צללים רכים ומודרניים (iOS + Android). */
export const shadow = {
  sm: {
    shadowColor: "#1B1F3B",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  md: {
    shadowColor: "#1B1F3B",
    shadowOpacity: 0.1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 5,
  },
  glow: {
    shadowColor: "#6C5CE7",
    shadowOpacity: 0.35,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
} as const;

/**
 * עוזר RTL חוצה-פלטפורמות. ב-web (react-native-web) הכיווניות RTL לא הופכת
 * אוטומטית flexDirection, לכן משתמשים ב-row-reverse; בנייטיב forceRTL כבר הופך.
 */
const _web = Platform.OS === "web";
export const rtl = {
  row: (_web ? "row-reverse" : "row") as "row" | "row-reverse",
  /** יישור לקצה המוביל (ימין ב-RTL). */
  start: (_web ? "flex-end" : "flex-start") as "flex-start" | "flex-end",
  /** יישור לקצה הנגרר (שמאל ב-RTL). */
  end: (_web ? "flex-start" : "flex-end") as "flex-start" | "flex-end",
} as const;
