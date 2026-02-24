import React, { useState, type ChangeEvent } from "react";
import { supabase } from "../../lib/supabase";
import { Input } from "../../components/ui/Input";
import { PasswordInput } from "../../components/ui/PasswordInput";
import { useNavigate } from "react-router-dom";
import { ArrowRight, User, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
  <div className="w-full max-w-md space-y-8 animate-in fade-in zoom-in-95 duration-700 lg:pt-8">
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-brand-primary">
        <ShieldCheck size={20} />
        <span className="text-[10px] font-black uppercase tracking-[0.3em]">
          Secure Access
        </span>
      </div>
      <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-text-main leading-none uppercase">
        PUSH YOUR <span className="text-brand-primary">LIMITS.</span>
      </h1>
      <p className="text-text-muted font-medium text-sm">
        Enter your credentials to access your training lab.
      </p>
    </div>

    <div className="relative group">
      <div className="absolute -inset-1 bg-linear-to-r from-brand-primary/20 to-transparent rounded-[2.5rem] blur-2xl opacity-20 group-hover:opacity-40 transition duration-1000"></div>

      <form
        onSubmit={onSubmit}
        className="relative bg-bg-surface/40 backdrop-blur-2xl border border-border-color/20 shadow-[0_30px_60px_rgba(0,0,0,0.4)] rounded-[2.5rem] p-8 md:p-10 space-y-6"
      >
        <div className="space-y-2">
          <Input
            label="Email Address"
            type="email"
            value={email}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setEmail(e.target.value)
            }
            placeholder="athlete@fitnex.com"
            icon={<User size={18} strokeWidth={2.5} />}
            required
            autoComplete="email"
          />

          <PasswordInput
            label="Security Key"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
        </div>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 flex items-center gap-3"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_10px_#f43f5e]" />
              <p className="text-rose-400 text-[11px] font-black uppercase tracking-wider">
                {error}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          disabled={loading}
          className="group relative w-full h-14 overflow-hidden rounded-2xl bg-brand-primary font-black text-[13px] text-bg-main uppercase tracking-[0.15em] transition-all active:scale-[0.96] disabled:opacity-50"
        >
          <div className="absolute inset-0 w-full h-full bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-700 skew-x-12" />

          <span className="relative flex items-center justify-center gap-2">
            {loading ? (
              <div className="w-5 h-5 border-2 border-bg-main/30 border-t-bg-main rounded-full animate-spin" />
            ) : (
              <>
                Initialize Session{" "}
                <ArrowRight
                  size={18}
                  strokeWidth={3}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </>
            )}
          </span>
        </button>
      </form>
    </div>

    <div className="text-center space-y-4">
      <p className="text-xs text-text-muted font-bold uppercase tracking-widest">
        Don't have an account?{" "}
        <button className="text-brand-primary hover:underline underline-offset-4 transition-all">
          Join the Elite
        </button>
      </p>
    </div>
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

    try {
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
    } catch (err: unknown) {
      setError("System handshake failed. Check connection.");
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-full bg-bg-main text-text-main flex overflow-hidden selection:bg-brand-primary selection:text-bg-main">
      {/* Visual Side Panel (Desktop) */}
      <div className="hidden lg:flex w-7/12 relative overflow-hidden bg-bg-surface border-r border-border-color/10">
        <div className="absolute top-[-10%] left-[-10%] w-150 h-150 bg-brand-primary/10 blur-[150px] rounded-full animate-pulse" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-size-[40px_40px]"></div>

        <div className="relative z-10 w-full flex flex-col justify-between p-16">
          <div className="flex items-center gap-3">
            <img
              src={logoImg}
              alt="Logo"
              className="w-10 h-10 rounded-xl shadow-2xl border border-white/10"
            />
            <h2 className="text-xl font-black tracking-tighter text-text-main uppercase">
              FITNEX
            </h2>
          </div>

          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-brand-primary/20 bg-brand-primary/5 text-brand-primary text-[10px] font-black uppercase tracking-[0.2em]">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-ping" />
              System Status: Optimal
            </div>
            <h3 className="text-7xl xl:text-8xl font-black leading-[0.85] tracking-tighter text-text-main">
              PRECISION <br />
              <span className="text-brand-primary">PERFORMANCE.</span>
            </h3>
            <p className="max-w-md text-text-muted text-lg font-medium leading-relaxed opacity-80">
              The world's most advanced workout engine for professional athletes
              and data-driven trainers.
            </p>
          </div>

          <div className="flex items-center gap-12 text-text-muted font-mono text-[10px] tracking-[0.3em] uppercase opacity-50">
            <div className="flex flex-col gap-1">
              <span className="text-text-main font-black text-xl tracking-tighter">
                128+
              </span>
              <span>Modules</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-text-main font-black text-xl tracking-tighter">
                0.02s
              </span>
              <span>Sync</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-text-main font-black text-xl tracking-tighter">
                AES-256
              </span>
              <span>Encryption</span>
            </div>
          </div>
        </div>
      </div>

      {/* Form Side Panel */}
      <div className="flex-1 flex flex-col relative overflow-hidden h-full">
        {/* MOBILE HEADER: Pinned tightly to notch with w-32 h-32 Logo */}
        <div className="lg:hidden shrink-0 pt-[env(safe-area-inset-top)] flex items-center justify-center">
          <img
            src={logoImg}
            alt="Logo"
            className="w-40 h-40 shadow-xl rounded-2xl"
          />
        </div>

        {/* LoginForm Container: items-center ensures the form stays near the logo block */}
        <div className="flex-1 flex items-center justify-center px-6 md:px-12 overflow-hidden">
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

        {/* Utility Footer */}
        <div className="p-8 flex justify-between items-center border-t border-border-color/10 shrink-0">
          <span className="text-[9px] font-mono text-text-muted/30 uppercase tracking-[0.4em]">
            Protocol v1.0.4 • Local-First
          </span>
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-black text-text-muted/40 uppercase tracking-widest">
              Network Secure
            </span>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
          </div>
        </div>
      </div>
    </div>
  );
};
