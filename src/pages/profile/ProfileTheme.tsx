import { useState, useEffect } from "react";
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
  };

  useEffect(() => {
    setCustomHex(activeColor);
  }, [activeColor]);

  return (
    <SubPageLayout title="Appearance">
      <div className="space-y-10 pb-10 bg-[var(--bg-main)]">
        <section>
          <div className="flex items-center gap-3 mb-5 px-2 text-[var(--brand-primary)]">
            <Sparkles size={14} />
            <h2 className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">
              Visual Mode
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <ThemeCard
              active={activeTheme === "dark"}
              onClick={() => setActiveTheme("dark")}
              label="Dark"
              icon={<Moon size={18} />}
              desc="OLED Saver"
            />
            <ThemeCard
              active={activeTheme === "light"}
              onClick={() => setActiveTheme("light")}
              label="Light"
              icon={<Sun size={18} />}
              desc="High Contrast"
            />
          </div>
        </section>

        <section>
          <div className="flex items-center gap-3 mb-5 px-2 text-[var(--brand-primary)]">
            <Paintbrush size={14} />
            <h2 className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">
              Brand Accent
            </h2>
          </div>

          <div className="p-6 rounded-[2.5rem] mb-4 border border-[var(--border-color)] bg-[var(--bg-surface)]">
            <div className="grid grid-cols-3 gap-y-6 gap-x-4">
              {BRAND_PALETTE.map((color) => (
                <button
                  key={color.hex}
                  onClick={() => setActiveColor(color.hex)}
                  className="flex flex-col items-center gap-2"
                >
                  <div
                    className="w-12 h-12 rounded-2xl transition-all duration-300 flex items-center justify-center border-2"
                    style={{
                      backgroundColor: color.hex,
                      borderColor:
                        activeColor.toLowerCase() === color.hex.toLowerCase()
                          ? "var(--text-main)"
                          : "transparent",
                    }}
                  >
                    {activeColor.toLowerCase() === color.hex.toLowerCase() && (
                      <Check size={20} className="text-white" strokeWidth={4} />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-12 gap-3 mt-4">
            <div className="col-span-8 relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
                <Hash size={14} />
              </div>
              <input
                type="text"
                value={customHex.replace("#", "")}
                onChange={(e) => {
                  const val = `#${e.target.value}`;
                  setCustomHex(val);
                  if (/^#[0-9A-F]{6}$/i.test(val)) setActiveColor(val);
                }}
                className="w-full border border-[var(--border-color)] rounded-2xl py-4 pl-10 pr-4 text-xs font-black uppercase bg-[var(--bg-surface)] text-[var(--text-main)] outline-none"
              />
            </div>

            <div className="col-span-4 relative">
              <input
                type="color"
                value={activeColor}
                onChange={(e) => setActiveColor(e.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="w-full h-full border border-[var(--border-color)] rounded-2xl flex items-center justify-center text-[var(--text-muted)] bg-[var(--bg-surface)]">
                <Pipette size={18} />
              </div>
            </div>
          </div>
        </section>

        <div className="pt-4">
          <button
            onClick={handleApply}
            className="w-full py-5 bg-[var(--brand-primary)] text-[var(--bg-main)] font-black uppercase italic tracking-widest rounded-[2rem] active:scale-[0.95] transition-all"
          >
            Apply Changes
          </button>
        </div>
      </div>
    </SubPageLayout>
  );
};

const ThemeCard = ({ active, onClick, label, icon, desc }: any) => (
  <button
    onClick={onClick}
    className="p-5 rounded-[2rem] border transition-all text-left"
    style={{
      backgroundColor: active
        ? "rgba(var(--brand-rgb, 255,127,80), 0.1)"
        : "var(--bg-surface)",
      borderColor: active ? "var(--brand-primary)" : "var(--border-color)",
      color: active ? "var(--brand-primary)" : "var(--text-muted)",
    }}
  >
    <div className="mb-3">{icon}</div>
    <p className="text-xs font-black uppercase italic tracking-widest leading-none mb-1">
      {label}
    </p>
    <p className="text-[8px] font-bold uppercase opacity-50">{desc}</p>
  </button>
);
