import React, { useState, type ChangeEvent } from "react";
import { supabase } from "../../lib/supabase";
import { Input } from "../../components/ui/Input";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const logoImg = "/fitnex/logo.webp";

interface LoginFormProps {
  email: string;
  setEmail: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  loading: boolean;
  error: string | null;
  onSubmit: (e: React.FormEvent) => void;
}

const LoginForm = ({
  email,
  setEmail,
  password,
  setPassword,
  loading,
  error,
  onSubmit,
}: LoginFormProps) => (
  <div className="w-full max-w-md space-y-8 animate-in fade-in zoom-in-95 duration-700">
    {/* Header Section */}
    <div className="space-y-2">
      <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-text-main">
        PUSH YOUR <span className="text-brand-primary italic">LIMITS.</span>
      </h1>
      <p className="text-text-muted font-medium">
        Enter your credentials to access your training lab.
      </p>
    </div>

    {/* Form Card */}
    <div className="relative group">
      <div className="absolute -inset-1 bg-linear-to-r from-brand-primary to-brand-primary/20 rounded-3xl blur opacity-10 group-hover:opacity-20 transition duration-1000"></div>

      <form
        onSubmit={onSubmit}
        className="relative bg-bg-surface/40 backdrop-blur-2xl border border-border-color/20 shadow-[0_20px_50px_rgba(0,0,0,0.3)] rounded-3xl p-8 space-y-5"
      >
        <div className="space-y-4">
          <div className="relative">
            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setEmail(e.target.value)
              }
              placeholder="athlete@fitnex.com"
              className="bg-bg-main/50 border-border-color/10 focus:border-brand-primary/50 transition-all h-12"
              required
            />
          </div>

          <div className="space-y-1">
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setPassword(e.target.value)
              }
              placeholder="••••••••"
              className="bg-bg-main/50 border-border-color/10 focus:border-brand-primary/50 transition-all h-12"
              required
            />
          </div>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 flex items-center gap-3 animate-shake">
            <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.8)]" />
            <p className="text-rose-400 text-xs font-bold uppercase tracking-wider">
              {error}
            </p>
          </div>
        )}

        <button
          disabled={loading}
          className="group relative w-full h-14 overflow-hidden rounded-2xl bg-brand-primary font-bold text-bg-main uppercase tracking-widest transition-all active:scale-[0.97] disabled:opacity-50"
        >
          <div className="absolute inset-0 w-full h-full bg-text-main/10 -translate-x-full group-hover:translate-x-full transition-transform duration-500 skew-x-12" />
          <span className="relative flex items-center justify-center gap-2">
            {loading ? (
              <div className="w-5 h-5 border-3 border-bg-main/30 border-t-bg-main rounded-full animate-spin" />
            ) : (
              <>
                Initialize Session <ArrowRight size={18} />
              </>
            )}
          </span>
        </button>
      </form>
    </div>

    <p className="text-center text-sm text-text-muted">
      Don't have an account?{" "}
      <button className="text-brand-primary font-bold hover:opacity-80 transition-opacity">
        Join the Elite
      </button>
    </p>
  </div>
);

export const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (authError) {
      setError(authError.message);
      setLoading(false);
    } else {
      navigate("/dashboard", { replace: true });
    }
  };

  return (
    <div className="h-screen w-full bg-bg-main text-text-main flex overflow-hidden selection:bg-brand-primary selection:text-bg-main">
      {/* Visual Side Panel */}
      <div className="hidden lg:flex w-7/12 relative overflow-hidden bg-bg-surface border-r border-border-color/10">
        <div className="absolute top-[-10%] left-[-10%] w-150 h-150 bg-brand-primary/20 blur-[150px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-125 h-125 bg-brand-primary/5 blur-[150px] rounded-full" />
        <div className="absolute inset-0 bg-bg-main opacity-20 brightness-50"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--border-color)_1px,transparent_1px),linear-gradient(to_bottom,var(--border-color)_1px,transparent_1px)] bg-size[40px_40px] opacity-10"></div>

        <div className="relative z-10 w-full flex flex-col justify-between p-16">
          <div className="flex items-center gap-3">
            <img
              src={logoImg}
              alt="Logo"
              className="w-12 h-12 rounded-xl shadow-lg"
            />
            <h2 className="text-2xl font-black tracking-tighter text-text-main">
              FITNEX
            </h2>
          </div>
          <div className="space-y-6">
            <div className="inline-block px-4 py-1.5 rounded-full border border-brand-primary/30 bg-brand-primary/10 text-brand-primary text-xs font-bold tracking-[0.2em] uppercase">
              System Status: Optimal
            </div>
            <h3 className="text-7xl font-black leading-[0.9] tracking-tighter text-text-main">
              PRECISION <br />
              <span className="text-brand-primary">PERFORMANCE.</span>
            </h3>
            <p className="max-w-md text-text-muted text-lg font-medium leading-relaxed">
              The world's most advanced workout engine for professional athletes
              and data-driven trainers.
            </p>
          </div>
          <div className="flex items-center gap-8 text-text-muted font-mono text-xs tracking-widest uppercase">
            <div className="flex flex-col">
              <span className="text-text-main font-bold text-lg">128+</span>
              <span>Modes</span>
            </div>
            <div className="flex flex-col">
              <span className="text-text-main font-bold text-lg">0.02s</span>
              <span>Latency</span>
            </div>
            <div className="flex flex-col">
              <span className="text-text-main font-bold text-lg">24/7</span>
              <span>Uptime</span>
            </div>
          </div>
        </div>
      </div>

      {/* Form Side Panel */}
      <div className="flex-1 flex flex-col relative overflow-hidden h-full">
        {/* Centered Large Logo for Mobile */}
        <div className="lg:hidden p-10 flex flex-col items-center justify-center shrink-0">
          <img src={logoImg} alt="Logo" className="w-24 h-24 mb-4" />
          <span className="font-black text-2xl tracking-tighter uppercase italic text-text-main">
            FITNEX
          </span>
        </div>

        <div className="flex-1 flex items-center justify-center px-8">
          <LoginForm
            email={email}
            setEmail={setEmail}
            password={password}
            setPassword={setPassword}
            loading={loading}
            error={error}
            onSubmit={handleSignIn}
          />
        </div>

        {/* Footer info */}
        <div className="p-8 flex justify-between items-center border-t border-border-color/10 shrink-0">
          <span className="text-[10px] font-mono text-text-muted/40 uppercase tracking-[0.3em]">
            Build v1.0.4 • Local-First
          </span>
          <div className="flex gap-4">
            <div className="w-2 h-2 rounded-full bg-brand-primary animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
};
