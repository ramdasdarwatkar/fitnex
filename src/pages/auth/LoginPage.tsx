import React, { useState, type ChangeEvent } from "react";
import { supabase } from "../../lib/supabase";
import { Input } from "../../components/ui/Input";
import { useNavigate } from "react-router-dom";

const logoImg = "/fitnex/logo.webp";

/**
 * 1. DECLARE OUTSIDE OF RENDER
 * This prevents the component from being re-created on every render cycle.
 */
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
  <div className="w-full max-w-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
    <div className="text-center mb-8">
      <h1 className="text-4xl font-black italic uppercase tracking-tighter leading-none">
        Welcome <span className="text-brand-primary">Back</span>
      </h1>
      <p className="text-text-muted text-sm mt-2 italic font-medium">
        Sign in to track your progress
      </p>
    </div>

    <div className="flex items-center gap-3 mb-8">
      <div className="h-px flex-1 bg-border-color/40" />
      <div className="w-2 h-2 rounded-full bg-brand-primary animate-pulse" />
      <div className="h-px flex-1 bg-border-color/40" />
    </div>

    <form onSubmit={onSubmit} className="space-y-5">
      <Input
        label="Email Address"
        type="email"
        value={email}
        onChange={(e: ChangeEvent<HTMLInputElement>) =>
          setEmail(e.target.value)
        }
        placeholder="name@example.com"
        autoComplete="email"
        required
      />

      <Input
        label="Password"
        type="password"
        value={password}
        onChange={(e: ChangeEvent<HTMLInputElement>) =>
          setPassword(e.target.value)
        }
        placeholder="••••••••"
        autoComplete="current-password"
        required
      />

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl">
          <p className="text-red-500 text-[10px] font-black uppercase tracking-widest text-center">
            {error}
          </p>
        </div>
      )}

      <button
        disabled={loading}
        className="w-full h-14 bg-brand-primary text-white font-black uppercase italic rounded-2xl mt-4 
                   active:scale-[0.98] transition-all disabled:opacity-50 shadow-xl 
                   shadow-brand-primary/20 flex items-center justify-center"
      >
        {loading ? (
          <span className="flex items-center gap-3">
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Authenticating...
          </span>
        ) : (
          "Sign In"
        )}
      </button>
    </form>
  </div>
);

/**
 * 2. MAIN PAGE COMPONENT
 */
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
    <div className="h-screen w-full bg-bg-main text-text-main overflow-hidden">
      <div className="h-full w-full flex flex-col lg:flex-row">
        {/* DESKTOP LEFT SIDE */}
        <div className="hidden lg:flex w-1/2 items-center justify-center bg-bg-surface relative overflow-hidden border-r border-border-color">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-150 bg-brand-primary/5 rounded-full blur-[120px]" />
          <div className="relative flex flex-col items-center space-y-6 z-10 text-center">
            <img
              src={logoImg}
              className="w-[320px] drop-shadow-2xl"
              alt="Fitnex Logo"
            />
            <div>
              <h2 className="text-6xl font-black tracking-tighter italic">
                FIT<span className="text-brand-primary">NEX</span>
              </h2>
              <p className="tracking-[0.5em] text-[11px] font-black text-text-muted uppercase mt-3">
                Professional Workout Engine
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE / FORM CONTAINER */}
        <div className="flex flex-1 items-center justify-center px-8 relative">
          <div className="lg:hidden absolute top-12 left-0 right-0 flex flex-col items-center">
            <img src={logoImg} className="w-32 opacity-90 mb-2" alt="Logo" />
            <h2 className="text-2xl font-black tracking-tighter italic leading-none">
              FIT<span className="text-brand-primary">NEX</span>
            </h2>
          </div>

          {/* Use the standalone component here */}
          <LoginForm
            email={email}
            setEmail={setEmail}
            password={password}
            setPassword={setPassword}
            loading={loading}
            error={error}
            onSubmit={handleSignIn}
          />

          <div className="absolute bottom-8 text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted opacity-30">
              Build v1.0.4 • Local-First Architecture
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
