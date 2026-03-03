import { useState, type ReactNode } from "react";
import {
  Moon,
  Sun,
  Check,
  Sparkles,
  Paintbrush,
  RefreshCcw,
  Save,
} from "lucide-react";
import { SubPageLayout } from "../../components/layout/SubPageLayout";
import { useTheme } from "../../hooks/useTheme";
import { useAuth } from "../../hooks/useAuth";
import { AppSettingsService } from "../../services/AppSettingsService";

interface ThemeCardProps {
  active: boolean;
  onClick: () => void;
  label: string;
  icon: ReactNode;
  desc: string;
}

const BRAND_PALETTE = [
  { name: "Emerald", id: "emerald", hex: "#22c55e" },
  { name: "Coral", id: "coral", hex: "#FF7F50" },
  { name: "HotPink", id: "hotpink", hex: "#FF69B4" },
  { name: "Tomato", id: "tomato", hex: "#FF6347" },
  { name: "SpringGreen", id: "springgreen", hex: "#00FF7F" },
  { name: "Violet", id: "violet", hex: "#EE82EE" },
];

export const ProfileTheme = () => {
  const { theme, brandColor, setTheme, setBrandColor } = useTheme();
  const { user_id } = useAuth();
  const [applying, setApplying] = useState(false);

  const [pendingTheme, setPendingTheme] = useState<"dark" | "light">(theme);
  const [pendingColor, setPendingColor] = useState(brandColor);

  const handleApply = async () => {
    if (!user_id || applying) return;
    setApplying(true);
    try {
      // 1. Update Context/State
      await setTheme(pendingTheme);
      await setBrandColor(pendingColor);

      // 2. Persist to AppSettingsService
      await AppSettingsService.updateLocalAppSettings(
        user_id,
        pendingTheme,
        pendingColor,
      );
    } catch (error) {
      console.error("Failed to update appearance:", error);
    } finally {
      setApplying(false);
    }
  };

  // --- FOOTER ACTION ---
  const applyButton = (
    <button
      disabled={applying}
      onClick={handleApply}
      className="w-full h-16 bg-brand-primary rounded-2xl
                 text-base font-black uppercase italic tracking-[0.25em]
                 flex items-center justify-center gap-3
                 active:scale-[0.98] transition-all disabled:opacity-30"
      style={{
        color: "var(--color-on-brand)",
        boxShadow: "0 4px 24px var(--glow-primary)",
      }}
    >
      {applying ? (
        <RefreshCcw size={22} className="animate-spin" />
      ) : (
        <Save size={22} strokeWidth={2.5} />
      )}
      <span>{applying ? "Syncing..." : "Apply Changes"}</span>
    </button>
  );

  return (
    <SubPageLayout title="Appearance" footer={applyButton}>
      <div className="space-y-10 pt-2 pb-10 animate-in fade-in duration-500">
        {/* VISUAL MODE */}
        <section className="space-y-5">
          <SectionLabel icon={<Sparkles size={13} />} title="Visual Mode" />
          <div className="grid grid-cols-2 gap-3 px-1">
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

        {/* BRAND ACCENT */}
        <section className="space-y-5">
          <SectionLabel icon={<Paintbrush size={13} />} title="Brand Accent" />
          <div className="p-8 rounded-[2.5rem] border border-border-color/40 bg-bg-surface card-glow mx-1">
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
                  <span className="text-[8px] font-black uppercase text-text-muted/40 tracking-widest mt-1">
                    {color.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>
      </div>
    </SubPageLayout>
  );
};

// --- REUSED SUB-COMPONENTS ---

const SectionLabel = ({ icon, title }: { icon: ReactNode; title: string }) => (
  <div className="flex items-center gap-3">
    <div className="flex items-center gap-1 shrink-0">
      <div
        className="w-1.5 h-1.5 rounded-full bg-brand-primary"
        style={{ boxShadow: "0 0 6px 1px var(--glow-primary)" }}
      />
      <div className="w-1 h-1 rounded-full bg-brand-primary/30" />
    </div>
    <div className="flex items-center gap-2">
      <span className="text-brand-primary/60">{icon}</span>
      <span className="text-[9.5px] font-black uppercase tracking-[0.35em] text-text-muted/50 italic">
        {title}
      </span>
    </div>
    <div
      className="h-px flex-1"
      style={{
        background:
          "linear-gradient(to right, var(--border-color), transparent)",
        opacity: 0.4,
      }}
    />
  </div>
);

const ThemeCard = ({ active, onClick, label, icon, desc }: ThemeCardProps) => (
  <button
    onClick={onClick}
    className={`p-6 rounded-[2.2rem] border-2 transition-all text-left flex-1 shadow-sm ${
      active
        ? "bg-brand-primary/5 border-brand-primary text-brand-primary"
        : "bg-bg-surface border-border-color/40 text-text-muted"
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
