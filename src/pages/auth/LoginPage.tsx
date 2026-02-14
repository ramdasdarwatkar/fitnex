import React, { useState } from "react";
import { supabase } from "../../lib/supabase";
import { Input } from "../../components/ui/Input";

export const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    }
    if (!error) {
      window.location.href = "/fitnex/dashboard";
    }
  };

  return (
    /* 1. Changed bg-black to bg-transparent to see the AppBackground glow */
    /* 2. Changed h-full to flex-1 (or min-h-screen) for perfect vertical centering */
    <div className="flex flex-col justify-center min-h-screen px-8 pt-[env(safe-area-inset-top)] bg-transparent">
      <div className="mb-10 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="w-20 h-20 bg-brand rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg shadow-brand/20">
          <span className="text-3xl font-black italic text-white">TF</span>
        </div>
        <h1 className="text-2xl font-black text-white uppercase tracking-tight">
          Welcome Back
        </h1>
        <p className="text-slate-400 text-sm font-medium">
          Sign in to track your progress
        </p>
      </div>

      <form onSubmit={handleSignIn} className="space-y-4">
        <Input
          label="Email Address"
          type="email"
          value={email}
          onChange={(e: any) => setEmail(e.target.value)}
          placeholder="name@example.com"
          required
        />
        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e: any) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
        />
        {error && (
          <p className="text-red-500 text-[10px] font-black uppercase tracking-widest ml-1 bg-red-500/10 p-2 rounded-lg border border-red-500/20">
            {error}
          </p>
        )}
        <button
          disabled={loading}
          className="w-full h-14 bg-brand text-white font-black uppercase italic rounded-2xl mt-6 active:scale-[0.98] transition-all disabled:opacity-50 shadow-xl shadow-brand/20"
        >
          {loading ? "Authenticating..." : "Sign In"}
        </button>
      </form>
    </div>
  );
};
