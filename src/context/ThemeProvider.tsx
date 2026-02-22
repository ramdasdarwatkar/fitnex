import React, { useState, useEffect, useCallback, useMemo } from "react";
import { db, type AppSettings } from "../db/database";
import { ThemeContext } from "./ThemeTypes";

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [theme, setThemeState] = useState<"dark" | "light">("dark");
  const [brandColor, setBrandColorState] = useState("#ff7f50");

  const applyTheme = useCallback((t: "dark" | "light") => {
    const root = window.document.documentElement;
    if (t === "light") {
      root.classList.add("light-theme");
    } else {
      root.classList.remove("light-theme");
    }
  }, []);

  const applyColor = useCallback((color: string) => {
    document.documentElement.style.setProperty("--brand-primary", color);
  }, []);

  // Load from Dexie on Mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await db.app_settings.get("global");
        if (settings) {
          applyTheme(settings.theme);
          applyColor(settings.brandColor);
          setThemeState(settings.theme);
          setBrandColorState(settings.brandColor);
        } else {
          applyTheme("dark");
          applyColor("#ff7f50");
        }
      } catch (err: unknown) {
        console.error(
          "Theme Load Error:",
          err instanceof Error ? err.message : err,
        );
      }
    };
    loadSettings();
  }, [applyTheme, applyColor]);

  const setTheme = useCallback(
    async (t: "dark" | "light") => {
      try {
        setThemeState(t);
        applyTheme(t);
        const existing = await db.app_settings.get("global");
        await db.app_settings.put({
          ...existing,
          id: "global",
          theme: t,
          brandColor: brandColor,
          unitSystem: existing?.unitSystem || "metric",
        } as AppSettings);
      } catch (err: unknown) {
        console.error("SetTheme Error:", err);
      }
    },
    [brandColor, applyTheme],
  );

  const setBrandColor = useCallback(
    async (color: string) => {
      try {
        setBrandColorState(color);
        applyColor(color);
        const existing = await db.app_settings.get("global");
        await db.app_settings.put({
          ...existing,
          id: "global",
          theme,
          brandColor: color,
          unitSystem: existing?.unitSystem || "metric",
        } as AppSettings);
      } catch (err: unknown) {
        console.error("SetColor Error:", err);
      }
    },
    [theme, applyColor],
  );

  const value = useMemo(
    () => ({
      theme,
      brandColor,
      setTheme,
      setBrandColor,
    }),
    [theme, brandColor, setTheme, setBrandColor],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};
