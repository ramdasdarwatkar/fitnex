import React, { createContext, useContext, useEffect, useState } from "react";
import { db, type AppSettings } from "../db/database";

interface ThemeContextType {
  theme: "dark" | "light";
  brandColor: string;
  setTheme: (t: "dark" | "light") => Promise<void>;
  setBrandColor: (c: string) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [theme, setThemeState] = useState<"dark" | "light">("dark");
  const [brandColor, setBrandColorState] = useState("#ff7f50"); // Default Fitnex Orange

  // Load settings from Dexie on Mount
  useEffect(() => {
    const loadSettings = async () => {
      const settings = await db.app_settings.get("global");
      if (settings) {
        applyTheme(settings.theme);
        applyColor(settings.brandColor);
        setThemeState(settings.theme);
        setBrandColorState(settings.brandColor);
      } else {
        // Initial setup for new users
        applyTheme("dark");
        applyColor("#ff7f50");
      }
    };
    loadSettings();
  }, []);

  const applyTheme = (t: "dark" | "light") => {
    const root = window.document.documentElement;
    if (t === "light") {
      root.classList.add("light-theme");
    } else {
      root.classList.remove("light-theme");
    }
  };

  const applyColor = (color: string) => {
    document.documentElement.style.setProperty("--brand-primary", color);
  };

  const setTheme = async (t: "dark" | "light") => {
    setThemeState(t);
    applyTheme(t);
    await db.app_settings.put({
      id: "global",
      theme: t,
      brandColor,
      unitSystem: "metric",
    } as AppSettings);
  };

  const setBrandColor = async (color: string) => {
    setBrandColorState(color);
    applyColor(color);
    await db.app_settings.put({
      id: "global",
      theme,
      brandColor: color,
      unitSystem: "metric",
    } as AppSettings);
  };

  return (
    <ThemeContext.Provider
      value={{ theme, brandColor, setTheme, setBrandColor }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
};
