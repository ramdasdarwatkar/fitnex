import { useState, type ReactNode } from "react";
import { Moon, Sun, Check, Sparkles, Paintbrush } from "lucide-react";
import { SubPageLayout } from "../../components/layout/SubPageLayout";
import { useTheme } from "../../hooks/useTheme";

// 1. Strict Interfaces
interface ThemeCardProps {
  active: boolean;
  onClick: () => void;
  label: string;
  icon: ReactNode;
  desc: string;
}

// IDs must match your [data-accent='id'] selectors in index.css
const BRAND_PALETTE = [
  { name: "Fitnex Orange", id: "orange", hex: "#ff7f50" },
  { name: "Electric Blue", id: "blue", hex: "#3b82f6" },
  { name: "Cyber Green", id: "emerald", hex: "#10b981" },
  { name: "Neon Purple", id: "violet", hex: "#a855f7" },
  { name: "Crimson Red", id: "rose", hex: "#ef4444" },
  { name: "Zinc Slate", id: "zinc", hex: "#71717a" },
];

export const ProfileTheme = () => {
  const { theme, brandColor, setTheme, setBrandColor } = useTheme();

  /**
   * 1. INITIALIZE STATE DIRECTLY
   * By seeding useState with context values, we avoid the need for
   * a useEffect sync, which prevents the "cascading render" error.
   */
  const [pendingTheme, setPendingTheme] = useState<"dark" | "light">(theme);
  const [pendingColor, setPendingColor] = useState(brandColor);

  /**
   * 2. APPLY CHANGES
   * Updates Dexie via ThemeContext.
   * ThemeProvider watches Dexie and applies the [data-accent] attribute.
   */
  const handleApply = async () => {
    try {
      await setTheme(pendingTheme);
      await setBrandColor(pendingColor);
    } catch (error) {
      console.error("Failed to update appearance:", error);
    }
  };

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
              active={pendingTheme === "dark"}
              onClick={() => setPendingTheme("dark")}
              label="Dark"
              icon={<Moon size={20} />}
              desc="OLED Saver"
            />
            <ThemeCard
              active={pendingTheme === "light"}
              onClick={() => setPendingTheme("light")}
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

          <div className="p-8 rounded-[2.5rem] border border-border-color bg-bg-surface shadow-xl">
            <div className="grid grid-cols-3 gap-y-8 gap-x-4">
              {BRAND_PALETTE.map((color) => (
                <button
                  key={color.id}
                  onClick={() => setPendingColor(color.id)}
                  className="flex flex-col items-center gap-2 group"
                >
                  <div
                    className="w-14 h-14 rounded-2xl transition-all duration-300 flex items-center justify-center border-4 group-active:scale-90 shadow-lg"
                    style={{
                      backgroundColor: color.hex,
                      borderColor:
                        pendingColor === color.id
                          ? "rgba(255,255,255,0.4)"
                          : "transparent",
                    }}
                  >
                    {pendingColor === color.id && (
                      <Check size={24} className="text-white" strokeWidth={4} />
                    )}
                  </div>
                  <span className="text-[8px] font-black uppercase text-text-muted opacity-40 mt-1">
                    {color.id}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* SUBMIT ACTION */}
        <div className="pt-6 px-1">
          <button
            onClick={handleApply}
            className="w-full py-6 bg-brand-primary text-bg-main font-black uppercase italic tracking-widest rounded-4xl active:scale-[0.98] transition-all shadow-xl shadow-brand-primary/20"
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
