import { useState, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import { useOnboarding } from "../../hooks/useOnboarding";
import { GenderPicker } from "./components/GenderPicker";
import { RulerPicker } from "./components/RulerPicker";
import { LevelPicker } from "./components/LevelPicker";
import { Input } from "../../components/ui/Input";
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  Target,
  Sparkles,
  Trophy,
} from "lucide-react";
import type { GenderType } from "../../types/database.types";

export const OnboardingPage = () => {
  const { user_id, refreshProfile } = useAuth();
  const { saveOnboarding } = useOnboarding();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    gender: "male" as GenderType,
    birthdate: "",
    height: 175,
    current_weight: 80,
    target_weight: 75,
    target_workout_days: 4,
    selected_level: "Novice",
    initial_points: 0,
  });

  // BMI Logic
  const bmiData = useMemo(() => {
    const h = formData.height / 100;
    const bmi = parseFloat((formData.current_weight / (h * h)).toFixed(1));
    if (bmi < 18.5)
      return { val: bmi, label: "Underweight", color: "text-yellow-500" };
    if (bmi < 25) return { val: bmi, label: "Healthy", color: "text-brand" };
    if (bmi < 30)
      return { val: bmi, label: "Overweight", color: "text-orange-500" };
    return { val: bmi, label: "Obese", color: "text-red-500" };
  }, [formData.height, formData.current_weight]);

  // RESTORED: Encouragement Text Logic
  const weightDiff = formData.current_weight - formData.target_weight;
  const encouragementText = useMemo(() => {
    if (weightDiff > 0) return `That's a ${weightDiff}kg loss plan!`;
    if (weightDiff < 0) return `Targeting a ${Math.abs(weightDiff)}kg gain!`;
    return "Staying steady and strong!";
  }, [weightDiff]);

  const handleFinish = async () => {
    if (!user_id) return;
    setLoading(true);
    try {
      await saveOnboarding(
        {
          user_id,
          name: formData.name,
          gender: formData.gender,
          birthdate: formData.birthdate,
          target_weight: formData.target_weight,
          target_days_per_week: formData.target_workout_days,
          role: "user",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        formData.current_weight,
        formData.height,
        formData.selected_level,
        formData.initial_points,
      );
      await refreshProfile();
    } catch (err) {
      console.error("Onboarding Error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-transparent text-white pt-safe overflow-hidden">
      {/* 1. PROGRESS BAR */}
      <div className="flex-none h-1 w-full bg-slate-900/30">
        <div
          className="h-full bg-brand transition-all duration-700 shadow-[0_0_15px_#0ea5e9]"
          style={{ width: `${(step / 6) * 100}%` }}
        />
      </div>

      {/* 2. SCROLLABLE AREA */}
      <div className="flex-1 overflow-y-auto touch-pan-y no-scrollbar px-8 pt-8">
        <div className="min-h-full flex flex-col">
          {step === 1 && (
            <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
              <header className="space-y-1">
                <h1 className="text-4xl font-black uppercase leading-tight italic tracking-tighter">
                  First, <br /> the <span className="text-brand">Basics</span>
                </h1>
                <p className="text-slate-400 font-medium italic">
                  What should we call you?
                </p>
              </header>
              <div className="space-y-6">
                <Input
                  label="FULL NAME"
                  value={formData.name}
                  onChange={(e: any) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="John Doe"
                />
                <p className="text-slate-500 font-black uppercase text-[10px] tracking-widest ml-1">
                  Gender
                </p>
                <GenderPicker
                  value={formData.gender}
                  onChange={(g) => setFormData({ ...formData, gender: g })}
                />
                <p className="text-slate-500 font-black uppercase text-[10px] tracking-widest ml-1">
                  Birthday
                </p>
                <Input
                  label="BIRTH DATE"
                  type="date"
                  value={formData.birthdate}
                  onChange={(e: any) =>
                    setFormData({ ...formData, birthdate: e.target.value })
                  }
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="flex-1 flex flex-col justify-center text-center py-6">
              <Sparkles
                className="mx-auto mb-4 text-brand animate-pulse"
                size={32}
              />
              <h1 className="text-3xl font-black uppercase italic tracking-tight">
                Nice to meet you, <br />
                <span className="text-brand">
                  {formData.name.split(" ")[0] || "Athlete"}!
                </span>
              </h1>
              <p className="text-slate-400 font-medium mb-10 italic">
                How tall are you?
              </p>
              <RulerPicker
                min={100}
                max={250}
                value={formData.height}
                unit="cm"
                onChange={(v) => setFormData({ ...formData, height: v })}
              />
            </div>
          )}

          {step === 3 && (
            <div className="flex-1 flex flex-col justify-center text-center py-6">
              <h1 className="text-3xl font-black uppercase italic text-white tracking-tight">
                Current Weight
              </h1>
              <p className="text-slate-400 font-medium mb-10 italic">
                Your starting point today
              </p>
              <RulerPicker
                min={30}
                max={200}
                value={formData.current_weight}
                unit="kg"
                onChange={(v) =>
                  setFormData({ ...formData, current_weight: v })
                }
              />
              <div className="mt-8 bg-slate-900/40 border border-slate-800 p-6 rounded-[2rem] flex justify-between items-center backdrop-blur-md">
                <div className="text-left">
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">
                    BMI Index
                  </p>
                  <p className={`text-lg font-black italic ${bmiData.color}`}>
                    {bmiData.label}
                  </p>
                </div>
                <div className="text-5xl font-black italic tabular-nums text-white">
                  {bmiData.val}
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="flex-1 flex flex-col justify-center text-center py-6">
              <Target className="mx-auto mb-4 text-brand" size={40} />
              <h1 className="text-3xl font-black uppercase italic">
                Target Weight
              </h1>
              <p className="text-slate-400 font-medium mb-10 italic">
                What is your dream goal?
              </p>
              <RulerPicker
                min={30}
                max={200}
                value={formData.target_weight}
                unit="kg"
                onChange={(v) => setFormData({ ...formData, target_weight: v })}
              />

              {/* RESTORED: Encouragement badge */}
              <div className="mt-8 py-3 px-8 bg-brand/10 border border-brand/20 rounded-full inline-block mx-auto animate-in zoom-in duration-500">
                <span className="text-brand font-black uppercase tracking-tighter text-xs italic">
                  {encouragementText}
                </span>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="flex-1 flex flex-col justify-center text-center py-6">
              <h1 className="text-4xl font-black uppercase mb-4 leading-tight italic">
                Commitment
              </h1>
              <p className="text-slate-400 font-medium mb-12 italic">
                How many days a week will you train?
              </p>
              <div className="flex justify-between items-center bg-slate-900/40 p-6 rounded-[2.5rem] border border-slate-800">
                {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                  <button
                    key={d}
                    onClick={() =>
                      setFormData({ ...formData, target_workout_days: d })
                    }
                    className={`w-10 h-10 rounded-full font-black transition-all ${
                      formData.target_workout_days === d
                        ? "bg-brand text-white scale-125 shadow-lg shadow-brand/40"
                        : "text-slate-600"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="flex-1 flex flex-col justify-center py-6">
              <header className="text-center mb-8">
                <Trophy className="mx-auto mb-2 text-brand" size={32} />
                <h1 className="text-3xl font-black uppercase italic">
                  Experience
                </h1>
                <p className="text-slate-400 font-medium italic">
                  Where should we start you off?
                </p>
              </header>
              <LevelPicker
                value={formData.selected_level}
                onChange={(name, pts) =>
                  setFormData({
                    ...formData,
                    selected_level: name,
                    initial_points: pts,
                  })
                }
              />
            </div>
          )}

          <div className="h-6 flex-none" />
        </div>
      </div>

      {/* 3. SQUIRCLE FOOTER */}
      <footer className="flex-none px-8 pt-2 pb-10 flex gap-3 bg-transparent mt-auto">
        {step > 1 && (
          <button
            onClick={() => setStep((s) => s - 1)}
            className="h-14 w-14 bg-slate-900/80 rounded-2xl border border-slate-800 flex items-center justify-center text-slate-400 active:scale-90 transition-all"
          >
            <ChevronLeft size={24} />
          </button>
        )}
        <button
          onClick={step === 6 ? handleFinish : () => setStep((s) => s + 1)}
          disabled={loading || (step === 1 && !formData.name)}
          className="h-14 flex-1 bg-brand text-white rounded-2xl font-black uppercase tracking-widest italic shadow-lg shadow-brand/20 active:scale-[0.98] transition-all disabled:opacity-30"
        >
          {loading ? (
            <Loader2 className="animate-spin" />
          ) : (
            <div className="flex items-center justify-center gap-2">
              <span>{step === 6 ? "Finish" : "Continue"}</span>
              {step < 6 && <ChevronRight size={18} strokeWidth={3} />}
            </div>
          )}
        </button>
      </footer>
    </div>
  );
};
