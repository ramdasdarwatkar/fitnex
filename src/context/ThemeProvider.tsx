import React, { useEffect, useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db/database";
import { ThemeContext } from "./ThemeTypes";

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  /**
   * 1. THE OBSERVER
   * Reads from Dexie. We use a fallback object to ensure 'theme'
   * and 'accent_color' are never undefined.
   */
  const settings = useLiveQuery(() => db.app_settings.toCollection().first());

  /**
   * 2. RESOLVE VALUES
   * We explicitly cast the theme to the union type to satisfy TypeScript.
   * Default: Light & Emerald.
   */
  const theme = (settings?.theme as "dark" | "light") ?? "light";
  const accentColor = settings?.accent_color ?? "emerald";

  /**
   * 3. DOM SYNC
   * No 'system' logic here—purely handles the two states.
   */
  useEffect(() => {
    const doc = document.documentElement;

    doc.setAttribute("data-theme", theme);
    doc.setAttribute("data-accent", accentColor);

    if (theme === "light") {
      doc.classList.add("light-theme");
    } else {
      doc.classList.remove("light-theme");
    }

    // Clean up legacy inline styles
    doc.style.removeProperty("--brand-primary");
    doc.style.removeProperty("--brand-primary-rgb");
  }, [theme, accentColor]);

  /**
   * 4. PERSISTENCE METHODS
   */
  const setTheme = async (t: "dark" | "light") => {
    await db.app_settings.toCollection().modify({ theme: t, is_synced: 0 });
  };

  const setBrandColor = async (accent: string) => {
    await db.app_settings
      .toCollection()
      .modify({ accent_color: accent, is_synced: 0 });
  };

  const value = useMemo(
    () => ({
      theme,
      brandColor: accentColor,
      setTheme,
      setBrandColor,
    }),
    [theme, accentColor],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};
