import { type ReactNode, useState } from "react";
import {
  ChevronRight,
  Trophy,
  Target,
  Scale,
  Zap,
  Percent,
  Flame,
  LogOut,
  User,
  Palette,
  RefreshCw,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { SyncManager } from "../../services/SyncManager";

// --- INTERFACES ---

interface TinyCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
}

interface MenuButtonProps {
  label: string;
  sub: string;
  icon: ReactNode;
  onClick: () => void;
}

// --- MAIN COMPONENT ---

export const ProfileHome = () => {
  const { athlete, signOut } = useAuth();
  const navigate = useNavigate();
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    try {
      setIsSyncing(true);
      await SyncManager.refresh();
    } finally {
      setIsSyncing(false);
    }
  };

  if (!athlete) return null;

  return (
    <div className="flex-1 flex flex-col bg-bg-main pb-32 animate-in fade-in duration-700">
      {/* ── HEADER ── */}
      <header className="flex justify-end pt-6 pb-4">
        <button
          onClick={() => signOut()}
          className="p-3.5 rounded-2xl active:scale-[0.85] transition-all"
          style={{
            background: "var(--danger-bg)",
            border: "1px solid var(--danger-border)",
            color: "var(--brand-danger)",
          }}
        >
          <LogOut size={20} />
        </button>
      </header>

      {/* ── HERO ── */}
      <section className="flex flex-col items-center mb-10">
        <div className="relative mb-6 group">
          <div
            className="absolute inset-0 bg-brand-primary opacity-20 blur-3xl rounded-full
                          group-hover:opacity-35 transition-opacity duration-700 pointer-events-none"
          />
          <div
            className="relative w-32 h-32 rounded-full p-[3px]"
            style={{
              background:
                "linear-gradient(135deg, var(--brand-primary), var(--brand-streak))",
              boxShadow: "0 0 32px var(--glow-primary)",
            }}
          >
            <div className="w-full h-full rounded-full bg-bg-main flex items-center justify-center overflow-hidden">
              <span className="text-5xl font-black text-text-main italic tracking-tighter uppercase">
                {athlete.name?.charAt(0)}
              </span>
            </div>
          </div>

          <div
            className="absolute -bottom-2 right-1 p-1.5 rounded-xl bg-brand-primary
                       animate-in zoom-in duration-700 delay-300"
            style={{
              color: "var(--color-on-brand)",
              boxShadow: "0 0 12px var(--glow-primary)",
            }}
          >
            <Trophy size={14} fill="currentColor" />
          </div>
        </div>

        <div className="text-center space-y-3">
          <h1 className="text-4xl font-black tracking-tighter uppercase italic text-text-main leading-none">
            {athlete.name}
          </h1>
          <div className="flex items-center justify-center gap-4">
            <div className="h-px w-8 bg-gradient-to-r from-transparent to-brand-primary/40" />
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-primary italic">
              Level {athlete.current_level}
            </p>
            <div className="h-px w-8 bg-gradient-to-l from-transparent to-brand-primary/40" />
          </div>
        </div>
      </section>

      {/* ── BIOMETRIC GRID ── */}
      <div className="grid grid-cols-2 gap-3 mb-10">
        <TinyCard
          label="BMI Index"
          value={athlete.bmi || "0.0"}
          icon={<Zap size={14} />}
        />
        <TinyCard
          label="Body Fat"
          value={`${athlete.body_fat_percent || "0"}%`}
          icon={<Percent size={14} />}
        />
        <TinyCard
          label="Mass Lost"
          value={`${athlete.weight_lost || "0"} kg`}
          icon={<Flame size={14} />}
        />
        <TinyCard
          label="Goal Mass"
          value={athlete.target_weight ? `${athlete.target_weight} kg` : "—"}
          icon={<Target size={14} />}
        />
      </div>

      {/* ── SETTINGS ── */}
      <div className="space-y-6">
        <SectionLabel label="System Calibration" />

        <nav className="space-y-3">
          <MenuButton
            label="User Profile"
            sub="Biometric identity & objectives"
            icon={<User size={20} />}
            onClick={() => navigate("/profile/details")}
          />
          <MenuButton
            label="Measurements"
            sub="Vital stats & metric tracking"
            icon={<Scale size={20} />}
            onClick={() => navigate("/profile/metrics")}
          />
          <MenuButton
            label="Performance Level"
            sub="Rank progress & milestones"
            icon={<Trophy size={20} />}
            onClick={() => navigate("/profile/level")}
          />
          <MenuButton
            label="Appearance"
            sub="Visual themes & brand colors"
            icon={<Palette size={20} />}
            onClick={() => navigate("/profile/theme")}
          />

          {/* ── SYNC / REFRESH DATA BUTTON ── */}
          <MenuButton
            label="Sync Data"
            sub="Refresh all stats & metrics"
            icon={
              isSyncing ? (
                <span className="animate-spin">
                  <RefreshCw size={20} />
                </span>
              ) : (
                <RefreshCw size={20} />
              )
            }
            onClick={handleSync}
          />
        </nav>
      </div>
    </div>
  );
};

// --- SUB-COMPONENTS ---
const TinyCard = ({ label, value, icon }: TinyCardProps) => (
  <div
    className="bg-bg-surface border border-border-color/40 p-5 rounded-2xl
                  flex items-center gap-4 card-glow active:scale-[0.97] transition-all"
  >
    <div
      className="w-10 h-10 rounded-xl bg-bg-main border border-border-color/40
                    flex items-center justify-center text-brand-primary shrink-0"
    >
      {icon}
    </div>
    <div className="space-y-0.5 min-w-0">
      <p className="text-lg font-black italic text-text-main leading-none tabular-nums">
        {value}
      </p>
      <p className="text-[8px] font-black text-text-muted/40 uppercase italic tracking-widest truncate">
        {label}
      </p>
    </div>
  </div>
);

const MenuButton = ({ label, sub, icon, onClick }: MenuButtonProps) => (
  <button
    onClick={onClick}
    className="w-full flex items-center justify-between p-5 bg-bg-surface
               border border-border-color/40 rounded-2xl
               active:scale-[0.98] transition-all duration-200 group card-glow
               hover:border-brand-primary/30"
  >
    <div className="flex items-center gap-4">
      <div
        className="w-11 h-11 rounded-xl bg-bg-main border border-border-color/40
                   flex items-center justify-center text-text-muted/40
                   group-hover:text-brand-primary group-hover:border-brand-primary/30
                   transition-all duration-300"
      >
        {icon}
      </div>
      <div className="text-left space-y-1">
        <p
          className="text-[14px] font-black uppercase italic tracking-tight
                      text-text-main leading-none group-hover:text-brand-primary transition-colors duration-300"
        >
          {label}
        </p>
        <p className="text-[9px] font-black text-text-muted/40 uppercase italic tracking-widest">
          {sub}
        </p>
      </div>
    </div>
    <ChevronRight
      size={18}
      className="text-text-muted/20 group-hover:text-brand-primary
                 group-hover:translate-x-0.5 transition-all duration-300 shrink-0"
    />
  </button>
);

const SectionLabel = ({ label }: { label: string }) => (
  <div className="flex items-center gap-3">
    <div className="flex items-center gap-1 shrink-0">
      <div
        className="w-1.5 h-1.5 rounded-full bg-brand-primary"
        style={{ boxShadow: "0 0 6px 1px var(--glow-primary)" }}
      />
      <div className="w-1 h-1 rounded-full bg-brand-primary/30" />
    </div>
    <span className="text-[9.5px] font-black uppercase tracking-[0.35em] text-text-muted/50 italic whitespace-nowrap">
      {label}
    </span>
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
