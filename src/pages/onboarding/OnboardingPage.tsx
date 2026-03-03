import { useState, useMemo, type ChangeEvent } from "react";
import { useOnboarding } from "../../hooks/useOnboarding";
import { GenderPicker } from "./components/GenderPicker";
import { RulerPicker } from "./components/RulerPicker";
import { LevelPicker } from "./components/LevelPicker";
import { Input } from "../../components/ui/Input";
import { Loader2, ChevronLeft, Target, Sparkles, Trophy } from "lucide-react";
import type {
  GenderType,
  UserProfile,
  BodyMetrics,
  AthleteLevel,
} from "../../types/database.types";
import { useAuth } from "../../hooks/useAuth";

export const OnboardingPage = () => {
  const { user_id } = useAuth();
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

  const bmiData = useMemo(() => {
    const h = formData.height / 100;
    const bmi = parseFloat((formData.current_weight / (h * h)).toFixed(1));
    if (bmi < 18.5)
      return { val: bmi, label: "Underweight", color: "text-warning" };
    if (bmi < 25)
      return { val: bmi, label: "Healthy", color: "text-brand-primary" };
    if (bmi < 30)
      return { val: bmi, label: "Overweight", color: "text-warning" };
    return { val: bmi, label: "Obese", color: "text-error" };
  }, [formData.height, formData.current_weight]);

  const weightDiff = formData.current_weight - formData.target_weight;
  const encouragementText = useMemo(() => {
    if (weightDiff > 0) return `That's a ${weightDiff}kg loss plan!`;
    if (weightDiff < 0) return `Targeting a ${Math.abs(weightDiff)}kg gain!`;
    return "Staying steady and strong!";
  }, [weightDiff]);

  const handleFinish = async () => {
    if (!user_id || loading) return;
    setLoading(true);
    try {
      const now = new Date().toISOString();
      const today = now.split("T")[0];
      const profileData: UserProfile = {
        user_id,
        name: formData.name,
        birthdate: formData.birthdate,
        target_weight: formData.target_weight,
        target_days_per_week: formData.target_workout_days,
        gender: formData.gender,
        role: "user",
        created_at: now,
        updated_at: now,
      };
      const metricsData: BodyMetrics = {
        user_id,
        logdate: today,
        weight: formData.current_weight,
        height: formData.height,
        created_at: now,
        updated_at: now,
      };
      const levelData: AthleteLevel = {
        user_id,
        level_points: formData.initial_points,
        current_level: formData.selected_level,
        updated_date: today,
      };
      const result = await saveOnboarding(profileData, metricsData, levelData);
      if (!result.success) alert(result.error);
    } catch (err) {
      console.error("Onboarding UI Error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-dvh bg-bg-main text-text-main pt-safe-pro overflow-hidden">
      {/* PROGRESS BAR */}
      <div className="flex-none h-1.5 w-full bg-bg-surface border-b border-border-color">
        <div
          className="h-full bg-brand-primary transition-all duration-700 shadow-[0_0_10px_var(--brand-primary-alpha)]"
          style={{ width: `${(step / 6) * 100}%` }}
        />
      </div>

      {/* CONTENT - Using flex-1 and justify-center to use the "too much space" effectively */}
      <div className="flex-1 flex flex-col px-8 overflow-hidden">
        <div className="flex-1 flex flex-col justify-center py-4">
          {step === 1 && (
            <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
              <header className="space-y-1">
                <h1 className="text-4xl font-black uppercase leading-tight italic tracking-tighter">
                  First, <br /> the{" "}
                  <span className="text-brand-primary">Basics</span>
                </h1>
                <p className="text-text-muted font-bold italic uppercase text-[11px] tracking-widest">
                  Identity Calibration
                </p>
              </header>
              <div className="space-y-6">
                <Input
                  label="FULL NAME"
                  value={formData.name}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="John Doe"
                />
                <div className="space-y-2">
                  <p className="text-text-muted font-black uppercase text-[10px] tracking-widest ml-1">
                    Gender
                  </p>
                  <GenderPicker
                    value={formData.gender}
                    onChange={(g) => setFormData({ ...formData, gender: g })}
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-text-muted font-black uppercase text-[10px] tracking-widest ml-1">
                    Birthday
                  </p>
                  <div className="flex items-center justify-center h-14 bg-bg-surface border border-border-color rounded-xl px-4">
                    <input
                      type="date"
                      value={formData.birthdate}
                      onChange={(e) =>
                        setFormData({ ...formData, birthdate: e.target.value })
                      }
                      className="w-full bg-transparent border-none outline-none text-center font-black uppercase italic text-text-main"
                      style={{ colorScheme: "dark" }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="text-center py-4 animate-in fade-in duration-500">
              <Sparkles
                className="mx-auto mb-4 text-brand-primary animate-pulse"
                size={32}
              />
              <h1 className="text-3xl font-black uppercase italic tracking-tight">
                Nice to meet you, <br />
                <span className="text-brand-primary">
                  {formData.name.split(" ")[0] || "Athlete"}!
                </span>
              </h1>
              <p className="text-text-muted font-bold uppercase text-[11px] tracking-widest mt-2 mb-10 italic">
                How tall are you?
              </p>
              <RulerPicker
                min={100}
                max={250}
                unit="cm"
                value={formData.height}
                onChange={(v) => setFormData({ ...formData, height: v })}
              />
            </div>
          )}

          {step === 3 && (
            <div className="text-center py-4 animate-in fade-in duration-500">
              <h1 className="text-3xl font-black uppercase italic tracking-tight">
                Current Weight
              </h1>
              <p className="text-text-muted font-bold uppercase text-[11px] tracking-widest mt-2 mb-10 italic">
                Starting baseline
              </p>
              <RulerPicker
                min={30}
                max={200}
                unit="kg"
                value={formData.current_weight}
                onChange={(v) =>
                  setFormData({ ...formData, current_weight: v })
                }
              />
              <div className="mt-8 bg-bg-surface border border-border-color p-6 rounded-xl flex justify-between items-center">
                <div className="text-left">
                  <p className="text-[10px] text-text-muted font-black uppercase tracking-widest">
                    BMI Index
                  </p>
                  <p
                    className={`text-lg font-black italic uppercase ${bmiData.color}`}
                  >
                    {bmiData.label}
                  </p>
                </div>
                <div className="text-5xl font-black italic tabular-nums">
                  {bmiData.val}
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="text-center py-4 animate-in fade-in duration-500">
              <Target className="mx-auto mb-4 text-brand-primary" size={40} />
              <h1 className="text-3xl font-black uppercase italic">
                Target Weight
              </h1>
              <RulerPicker
                min={30}
                max={200}
                unit="kg"
                value={formData.target_weight}
                onChange={(v) => setFormData({ ...formData, target_weight: v })}
              />
              <div className="mt-8 py-3 px-8 bg-brand-primary/10 border border-brand-primary/20 rounded-xl inline-block mx-auto">
                <span className="text-brand-primary font-black uppercase tracking-tighter text-xs italic">
                  {encouragementText}
                </span>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="text-center py-4 animate-in fade-in duration-500">
              <h1 className="text-4xl font-black uppercase mb-4 italic">
                Commitment
              </h1>
              <p className="text-text-muted font-bold uppercase text-[11px] tracking-widest mb-12 italic">
                Weekly Training Days
              </p>
              <div className="flex justify-between items-center bg-bg-surface p-6 rounded-xl border border-border-color">
                {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                  <button
                    key={d}
                    onClick={() =>
                      setFormData({ ...formData, target_workout_days: d })
                    }
                    className={`w-10 h-10 rounded-lg font-black italic transition-all ${
                      formData.target_workout_days === d
                        ? "bg-brand-primary text-bg-main scale-110 shadow-glow-primary"
                        : "text-text-muted"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="py-4 animate-in fade-in duration-500">
              <header className="text-center mb-8">
                <Trophy className="mx-auto mb-2 text-brand-primary" size={32} />
                <h1 className="text-3xl font-black uppercase italic">
                  Experience
                </h1>
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
        </div>
      </div>

      {/* FOOTER - pb-safe ensures it respects the iPhone home bar area */}
      <footer className="flex-none px-8 pt-4 pb-safe flex gap-3 bg-bg-main border-t border-border-color/10 mb-4">
        {step > 1 && (
          <button
            onClick={() => setStep((s) => s - 1)}
            className="h-14 w-14 bg-bg-surface rounded-xl border border-border-color flex items-center justify-center text-text-muted active:scale-90"
          >
            <ChevronLeft size={24} />
          </button>
        )}
        <button
          onClick={step === 6 ? handleFinish : () => setStep((s) => s + 1)}
          disabled={loading || (step === 1 && !formData.name)}
          className="h-14 flex-1 bg-brand-primary text-bg-main rounded-xl font-black uppercase tracking-widest italic shadow-md active:scale-[0.98] disabled:opacity-30"
        >
          {loading ? (
            <Loader2 className="animate-spin mx-auto" />
          ) : step === 6 ? (
            "Finish"
          ) : (
            "Continue"
          )}
        </button>
      </footer>
    </div>
  );
};
