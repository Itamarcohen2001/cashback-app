import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Appearance, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { buildThemeCss } from "@/theme";

type Mode = "light" | "dark";

interface ThemeCtx {
  mode: Mode;
  toggle: () => void;
  setMode: (m: Mode) => void;
}

const Ctx = createContext<ThemeCtx>({
  mode: "light",
  toggle: () => {},
  setMode: () => {},
});

const STORAGE_KEY = "cashy_theme";
const _web = Platform.OS === "web";

// הזרקת משתני ה-CSS פעם אחת (web בלבד).
function injectThemeCss() {
  if (!_web || typeof document === "undefined") return;
  if (document.getElementById("cashy-theme-vars")) return;
  const style = document.createElement("style");
  style.id = "cashy-theme-vars";
  style.textContent = buildThemeCss();
  document.head.appendChild(style);
}

function applyMode(mode: Mode) {
  if (!_web || typeof document === "undefined") return;
  const root = document.documentElement;
  root.setAttribute("data-theme", mode);
  root.style.colorScheme = mode;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<Mode>(() =>
    Appearance.getColorScheme() === "dark" ? "dark" : "light",
  );

  // טעינה ראשונית: הזרקת CSS + החלת ההעדפה השמורה (או מצב המערכת).
  useEffect(() => {
    injectThemeCss();
    let active = true;
    AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      if (!active) return;
      const initial: Mode =
        saved === "light" || saved === "dark"
          ? saved
          : Appearance.getColorScheme() === "dark"
            ? "dark"
            : "light";
      setModeState(initial);
      applyMode(initial);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    applyMode(mode);
  }, [mode]);

  const value = useMemo<ThemeCtx>(
    () => ({
      mode,
      setMode: (m) => {
        setModeState(m);
        AsyncStorage.setItem(STORAGE_KEY, m).catch(() => {});
      },
      toggle: () => {
        setModeState((prev) => {
          const next = prev === "dark" ? "light" : "dark";
          AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
          return next;
        });
      },
    }),
    [mode],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useThemeMode(): ThemeCtx {
  return useContext(Ctx);
}
