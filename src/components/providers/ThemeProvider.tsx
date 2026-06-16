import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export const THEMES = ["light", "dark", "midnight", "sunset", "olive"] as const;
export type Theme = (typeof THEMES)[number];

type Ctx = { theme: Theme; setTheme: (t: Theme) => void };
const ThemeCtx = createContext<Ctx>({ theme: "light", setTheme: () => {} });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");

  useEffect(() => {
    const saved = (typeof window !== "undefined" && (localStorage.getItem("savora-theme") as Theme)) || "light";
    setThemeState(saved);
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    root.classList.remove("dark");
    root.removeAttribute("data-theme");
    if (theme === "dark") root.classList.add("dark");
    else if (theme !== "light") root.setAttribute("data-theme", theme);
    localStorage.setItem("savora-theme", theme);
  }, [theme]);

  return <ThemeCtx.Provider value={{ theme, setTheme: setThemeState }}>{children}</ThemeCtx.Provider>;
}

export const useTheme = () => useContext(ThemeCtx);