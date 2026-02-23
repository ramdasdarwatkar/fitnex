import { useState, useEffect, type ReactNode, type ChangeEvent } from "react";
import {
  Moon,
  Sun,
  Check,
  Sparkles,
  Paintbrush,
  Hash,
  Pipette,
} from "lucide-react";
import { SubPageLayout } from "../../components/layout/SubPageLayout";

// 1. Strict Interfaces
interface ThemeCardProps {
  active: boolean;
  onClick: () => void;
  label: string;
  icon: ReactNode;
  desc: string;
}

const BRAND_PALETTE = [
  { name: "Fitnex Orange", hex: "#ff7f50" },
  { name: "Electric Blue", hex: "#3b82f6" },
  { name: "Cyber Green", hex: "#22c55e" },
  { name: "Neon Purple", hex: "#a855f7" },
  { name: "Crimson Red", hex: "#ef4444" },
  { name: "Solar Yellow", hex: "#eab308" },
];

export const ProfileTheme = () => {
  const [activeTheme, setActiveTheme] = useState<"dark" | "light">(() => {
    return document.documentElement.classList.contains("light-theme")
      ? "light"
      : "dark";
  });

  const [activeColor, setActiveColor] = useState(() => {
    return localStorage.getItem("fitnex-color") || "#ff7f50";
  });

  const [customHex, setCustomHex] = useState(activeColor);

  /**
   * APPLY CHANGES
   * Synchronizes LocalStorage and document attributes/styles
   */
  const handleApply = () => {
    const root = document.documentElement;
    localStorage.setItem("fitnex-theme", activeTheme);
    localStorage.setItem("fitnex-color", activeColor);

    if (activeTheme === "light") {
      root.classList.add("light-theme");
    } else {
      root.classList.remove("light-theme");
    }

    root.style.setProperty("--brand-primary", activeColor);

    // Optional: Success feedback could be added here
  };

  useEffect(() => {
    setCustomHex(activeColor);
  }, [activeColor]);

  return (
    <SubPageLayout title="Appearance">
      <div className="space-y-10 pb-10 bg-bg-main animate-in fade-in duration-500">
        {/* VISUAL MODE SECTION */}
        <section>
          <div className="flex items-center gap-3 mb-5 px-3">
            <Sparkles size={14} className="text-brand-primary" />
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted italic">
              Visual Mode
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <ThemeCard
              active={activeTheme === "dark"}
              onClick={() => setActiveTheme("dark")}
              label="Dark"
              icon={<Moon size={20} />}
              desc="OLED Saver"
            />
            <ThemeCard
              active={activeTheme === "light"}
              onClick={() => setActiveTheme("light")}
              label="Light"
              icon={<Sun size={20} />}
              desc="High Contrast"
            />
          </div>
        </section>

        {/* ACCENT COLOR SECTION */}
        <section>
          <div className="flex items-center gap-3 mb-5 px-3">
            <Paintbrush size={14} className="text-brand-primary" />
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted italic">
              Brand Accent
            </h2>
          </div>

          <div className="p-8 rounded-[2.5rem] mb-4 border border-border-color bg-bg-surface shadow-xl">
            <div className="grid grid-cols-3 gap-y-8 gap-x-4">
              {BRAND_PALETTE.map((color) => (
                <button
                  key={color.hex}
                  onClick={() => setActiveColor(color.hex)}
                  className="flex flex-col items-center gap-2 group"
                >
                  <div
                    className="w-14 h-14 rounded-2xl transition-all duration-300 flex items-center justify-center border-4 group-active:scale-90 shadow-lg"
                    style={{
                      backgroundColor: color.hex,
                      borderColor:
                        activeColor.toLowerCase() === color.hex.toLowerCase()
                          ? "rgba(255,255,255,0.4)"
                          : "transparent",
                    }}
                  >
                    {activeColor.toLowerCase() === color.hex.toLowerCase() && (
                      <Check size={24} className="text-white" strokeWidth={4} />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* CUSTOM COLOR INPUTS */}
          <div className="grid grid-cols-12 gap-3 mt-4">
            <div className="col-span-8 relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">
                <Hash size={14} />
              </div>
              <input
                type="text"
                value={customHex.replace("#", "")}
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  const val = `#${e.target.value}`;
                  setCustomHex(val);
                  if (/^#[0-9A-F]{6}$/i.test(val)) setActiveColor(val);
                }}
                className="w-full border border-border-color rounded-2xl py-5 pl-10 pr-4 text-xs font-black uppercase bg-bg-surface text-text-main outline-none focus:border-brand-primary/50 transition-colors tabular-nums"
                placeholder="FFFFFF"
              />
            </div>

            <div className="col-span-4 relative">
              <input
                type="color"
                value={activeColor}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setActiveColor(e.target.value)
                }
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="w-full h-full border border-border-color rounded-2xl flex items-center justify-center text-text-muted bg-bg-surface group-hover:bg-bg-main transition-colors">
                <Pipette size={20} />
              </div>
            </div>
          </div>
        </section>

        {/* SUBMIT */}
        <div className="pt-6 px-1">
          <button
            onClick={handleApply}
            className="w-full py-6 bg-brand-primary text-black font-black uppercase italic tracking-widest rounded-4xl active:scale-[0.98] transition-all shadow-xl shadow-brand-primary/20"
          >
            Apply Changes
          </button>
        </div>
      </div>
    </SubPageLayout>
  );
};

/* --- SUB-COMPONENTS --- */

const ThemeCard = ({ active, onClick, label, icon, desc }: ThemeCardProps) => (
  <button
    onClick={onClick}
    className={`p-6 rounded-[2.2rem] border-2 transition-all text-left flex-1 shadow-sm ${
      active
        ? "bg-brand-primary/5 border-brand-primary text-brand-primary"
        : "bg-bg-surface border-border-color text-text-muted"
    }`}
  >
    <div
      className={`mb-4 transition-transform duration-300 ${active ? "scale-110" : ""}`}
    >
      {icon}
    </div>
    <p className="text-[11px] font-black uppercase italic tracking-widest leading-none mb-1.5">
      {label}
    </p>
    <p className="text-[8px] font-bold uppercase opacity-60 tracking-tight">
      {desc}
    </p>
  </button>
);
