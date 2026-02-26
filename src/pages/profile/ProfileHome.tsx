import { type ReactNode } from "react";
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
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

// 1. Strict Interfaces
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

export const ProfileHome = () => {
  const { athlete, signOut } = useAuth();
  const navigate = useNavigate();

  if (!athlete) return null;

  return (
    <div className="flex-1 flex flex-col bg-bg-main min-h-screen pb-32 pt-safe animate-in fade-in duration-500">
      {/* HEADER - LOGOUT */}
      <header className="flex justify-end pt-6 pb-2">
        <button
          onClick={() => signOut()}
          className="p-3 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 active:scale-90 transition-all hover:bg-red-500/20"
        >
          <LogOut size={18} />
        </button>
      </header>

      {/* HERO SECTION */}
      <section className="flex flex-col items-center mb-10">
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-brand-primary opacity-20 blur-3xl rounded-full" />
          <div className="relative w-28 h-28 rounded-full bg-linear-to-tr from-brand-primary to-orange-500 p-0.75 shadow-2xl shadow-brand-primary/20">
            <div className="w-full h-full rounded-full bg-bg-main border-4 border-bg-main flex items-center justify-center overflow-hidden">
              <span className="text-4xl font-black text-text-main italic tracking-tighter uppercase">
                {athlete.name?.charAt(0)}
              </span>
            </div>
          </div>
        </div>

        <div className="text-center">
          <h1 className="text-3xl font-black tracking-tight uppercase italic text-text-main leading-none">
            {athlete.name}
          </h1>
          <div className="mt-4 flex items-center justify-center gap-3">
            <span className="h-px w-6 bg-border-color" />
            <p className="text-[11px] font-black uppercase tracking-[0.4em] text-brand-primary italic">
              Level — {athlete.current_level}
            </p>
            <span className="h-px w-6 bg-border-color" />
          </div>
        </div>
      </section>

      {/* METRIC GRID */}
      <div className="grid grid-cols-2 gap-3 mb-10">
        <TinyCard
          label="BMI"
          value={athlete.bmi || "0.0"}
          icon={<Zap size={12} />}
        />
        <TinyCard
          label="Body Fat"
          value={`${athlete.body_fat_percent || "0"}%`}
          icon={<Percent size={12} />}
        />
        <TinyCard
          label="Weight Lost"
          value={`${athlete.weight_lost || "0"}kg`}
          icon={<Flame size={12} />}
        />
        <TinyCard
          label="Goal Weight"
          value={athlete.target_weight ? `${athlete.target_weight}kg` : "—"}
          icon={<Target size={12} />}
        />
      </div>

      {/* ACCOUNT SETTINGS SECTION */}
      <div className="flex items-center gap-4 mb-6 px-1">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-text-muted whitespace-nowrap italic">
          Account Settings
        </p>
        <div className="h-px w-full bg-border-color/50" />
      </div>

      <nav className="space-y-3">
        <MenuButton
          label="User Profile"
          sub="Personal Identity & Goals"
          icon={<User size={18} />}
          onClick={() => navigate("/profile/details")}
        />
        <MenuButton
          label="Measurements"
          sub="Vitals & Metrics Tracking"
          icon={<Scale size={18} />}
          onClick={() => navigate("/profile/metrics")}
        />
        <MenuButton
          label="Level Details"
          sub="Rank Progress & Milestone"
          icon={<Trophy size={18} />}
          onClick={() => navigate("/profile/level")}
        />
        <MenuButton
          label="Themes & Appearance"
          sub="Brand Color & Styles"
          icon={<Palette size={18} />}
          onClick={() => navigate("/profile/theme")}
        />
      </nav>

      <div className="flex-1" />
    </div>
  );
};

/* --- SUB-COMPONENTS --- */

const TinyCard = ({ label, value, icon }: TinyCardProps) => (
  <div className="bg-bg-surface border border-border-color p-4 rounded-3xl flex items-center gap-4 shadow-sm">
    <div className="w-8 h-8 rounded-xl bg-bg-main border border-border-color flex items-center justify-center text-brand-primary">
      {icon}
    </div>
    <div>
      <p className="text-sm font-black italic text-text-main leading-none">
        {value}
      </p>
      <p className="text-[8px] font-bold text-text-muted uppercase tracking-tight mt-1.5">
        {label}
      </p>
    </div>
  </div>
);

const MenuButton = ({ label, sub, icon, onClick }: MenuButtonProps) => (
  <button
    onClick={onClick}
    className="w-full flex items-center justify-between p-5 bg-bg-surface border border-border-color rounded-[2.2rem] active:scale-[0.98] transition-all group hover:border-brand-primary/30"
  >
    <div className="flex items-center gap-5">
      <div className="w-11 h-11 rounded-2xl bg-bg-main border border-border-color flex items-center justify-center text-text-muted group-hover:text-brand-primary group-hover:border-brand-primary/20 transition-all">
        {icon}
      </div>
      <div className="text-left">
        <p className="text-[12px] font-black uppercase italic tracking-wider text-text-main leading-tight">
          {label}
        </p>
        <p className="text-[9px] font-bold text-text-muted uppercase tracking-tighter mt-1">
          {sub}
        </p>
      </div>
    </div>
    <ChevronRight
      size={18}
      className="text-text-muted opacity-30 group-hover:opacity-100 group-hover:translate-x-1 transition-all"
    />
  </button>
);
