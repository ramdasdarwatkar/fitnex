import { createContext } from "react";

export interface ThemeContextType {
  theme: "dark" | "light";
  brandColor: string;
  setTheme: (t: "dark" | "light") => Promise<void>;
  setBrandColor: (c: string) => Promise<void>;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(
  undefined,
);
