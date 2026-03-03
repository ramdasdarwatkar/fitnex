import type { AppSettings } from "../types/database.types";

export const applySettingsToDOM = (settings: AppSettings | null): void => {
  const root = document.documentElement;
  const theme = settings?.theme || "dark";
  const accentName = settings?.accent_color || "emerald"; // Fallback to default

  root.setAttribute("data-theme", theme);

  if (theme === "light") {
    root.classList.add("light-theme");
  } else {
    root.classList.remove("light-theme");
  }

  root.setAttribute("data-brand", accentName);

  // Sync Units
  root.setAttribute("data-unit-system", settings?.unit_system || "metric");
  root.setAttribute("data-unit-weight", settings?.weight_unit || "kg");
  root.setAttribute("data-unit-distance", settings?.distance_unit || "km");
  root.setAttribute("data-unit-height", settings?.height_unit || "cm");
  root.setAttribute("data-unit-body", settings?.body_measure_unit || "cm");

  console.log(`🚀 UI Sync: Mode=${theme}, Accent=${accentName}`);
};
