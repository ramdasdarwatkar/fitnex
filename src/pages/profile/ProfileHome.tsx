import { User, Ruler, Trophy, Palette, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export const ProfileHome = () => {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();

  return (
    <div className="pb-16 space-y-8">
      {/* HERO */}
      <section className="pt-6 flex flex-col items-center text-center space-y-4">
        <div className="relative">
          <div className="w-28 h-28 rounded-full bg-brand/20 flex items-center justify-center">
            <User size={42} className="text-brand" />
          </div>

          <div className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-brand text-black flex items-center justify-center font-black text-sm">
            5
          </div>
        </div>

        <h2 className="text-2xl font-black">{profile?.name || "Athlete"}</h2>

        {/* MINI STATS */}
        <div className="flex gap-3">
          <MiniStat label="Target" value={`${profile?.target_weight || 0}kg`} />
          <MiniStat label="BMI" value="22.1" />
          <MiniStat label="Points" value="5" />
        </div>
      </section>

      {/* ACTION GRID */}
      <section className="grid grid-cols-2 gap-4 px-6">
        <Action
          title="User Info"
          icon={<User />}
          onClick={() => navigate("/profile/details")}
        />
        <Action
          title="Measurements"
          icon={<Ruler />}
          onClick={() => navigate("/profile/metrics")}
        />
        <Action
          title="Level"
          icon={<Trophy />}
          onClick={() => navigate("/profile/level")}
        />
        <Action
          title="Appearance"
          icon={<Palette />}
          onClick={() => navigate("/profile/theme")}
        />
      </section>

      {/* LOGOUT */}
      <div className="px-6 pt-6">
        <button
          onClick={signOut}
          className="w-full h-14 rounded-2xl bg-red-500/10 text-red-400 font-black uppercase tracking-widest flex items-center justify-center gap-2"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </div>
  );
};

const MiniStat = ({ label, value }: any) => (
  <div className="px-4 py-2 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
    <p className="text-[10px] uppercase text-slate-500 font-black">{label}</p>
    <p className="font-black">{value}</p>
  </div>
);

const Action = ({ title, icon, onClick }: any) => (
  <button
    onClick={onClick}
    className="aspect-square rounded-[2rem] bg-slate-900/50 border border-slate-800 flex flex-col items-center justify-center gap-2 active:scale-95 transition"
  >
    <div className="text-brand">{icon}</div>
    <span className="text-xs font-black uppercase tracking-wide">{title}</span>
  </button>
);
