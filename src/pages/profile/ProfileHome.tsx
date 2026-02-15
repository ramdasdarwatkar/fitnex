import { useAuth } from "../../context/AuthContext";
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

export const ProfileHome = () => {
  const { athlete, signOut } = useAuth();
  const navigate = useNavigate();

  if (!athlete) return null;

  return (
    <div className="page-container no-scrollbar px-6 pb-28 bg-[var(--bg-main)]">
      <header className="flex justify-end pt-6 pb-2">
        <button
          onClick={() => signOut()}
          className="p-3 bg-red-500/10 border border-red-500/15 rounded-2xl text-red-500 active:scale-90 transition-all"
        >
          <LogOut size={18} />
        </button>
      </header>

      <section className="flex flex-col items-center mb-10">
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-[var(--brand-primary)] opacity-10 blur-2xl rounded-full" />
          <div className="relative w-28 h-28 rounded-full bg-gradient-to-tr from-[var(--brand-primary)] to-orange-500 p-[3px]">
            <div className="w-full h-full rounded-full bg-[var(--bg-main)] border-[4px] border-[var(--bg-main)] flex items-center justify-center overflow-hidden">
              <span className="text-4xl font-black text-[var(--text-main)] italic tracking-tighter">
                {athlete.name?.charAt(0)}
              </span>
            </div>
          </div>
        </div>

        <div className="text-center">
          <h1 className="text-3xl font-black tracking-tight uppercase italic text-[var(--text-main)] leading-none">
            {athlete.name}
          </h1>
          <div className="mt-3 flex items-center justify-center gap-2">
            <span className="h-[1px] w-6 bg-[var(--border-color)]" />
            <p className="text-[11px] font-black uppercase tracking-[0.4em] text-[var(--brand-primary)] italic">
              Level — {athlete.current_level}
            </p>
            <span className="h-[1px] w-6 bg-[var(--border-color)]" />
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-2.5 mb-8">
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
          label="Lost"
          value={`${athlete.weight_lost || "0"}kg`}
          icon={<Flame size={12} />}
        />
        <TinyCard
          label="Goal"
          value={athlete.target_weight ? `${athlete.target_weight}kg` : "—"}
          icon={<Target size={12} />}
        />
      </div>

      <div className="flex items-center gap-4 mb-6">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-muted)] whitespace-nowrap">
          Account Settings
        </p>
        <div className="h-[1px] w-full bg-[var(--divider-color)]" />
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
    </div>
  );
};

const TinyCard = ({ label, value, icon }: any) => (
  <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] p-3 rounded-[1.2rem] flex items-center gap-3">
    <div className="w-7 h-7 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] flex items-center justify-center text-[var(--brand-primary)]">
      {icon}
    </div>
    <div>
      <p className="text-sm font-black italic text-[var(--text-main)] leading-none">
        {value}
      </p>
      <p className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-tight mt-0.5">
        {label}
      </p>
    </div>
  </div>
);

const MenuButton = ({ label, sub, icon, onClick }: any) => (
  <button
    onClick={onClick}
    className="w-full flex items-center justify-between p-4 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-[1.8rem] active:opacity-70 transition-all group"
  >
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-muted)] group-active:text-[var(--brand-primary)]">
        {icon}
      </div>
      <div className="text-left">
        <p className="text-[11px] font-black uppercase italic tracking-wider text-[var(--text-main)]">
          {label}
        </p>
        <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-tighter">
          {sub}
        </p>
      </div>
    </div>
    <ChevronRight
      size={16}
      className="text-[var(--text-muted)] group-active:text-[var(--brand-primary)]"
    />
  </button>
);
