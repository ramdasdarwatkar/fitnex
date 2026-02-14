import React, { useState } from "react";
import { supabase } from "../../lib/supabase";
import { Input } from "../../components/ui/Input";
import { useNavigate } from "react-router-dom";

const logoImg = "/fitnex/logo.webp";

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

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      navigate("/dashboard", { replace: true });
    }
  };

  return (
    <div className="safe-ios-top h-screen w-full bg-black overflow-hidden animate-login">
      {/* MOBILE + DESKTOP WRAPPER */}
      <div className="h-full w-full flex flex-col lg:flex-row">
        {/* LEFT BRAND (DESKTOP ONLY) */}
        <div className="hidden lg:flex w-1/2 items-center justify-center bg-gradient-to-br from-brand to-brand/70">
          <div className="flex flex-col items-center text-black space-y-3">
            <img src={logoImg} className="w-[300px]" />

            <h1 className="text-4xl font-black tracking-tight">TRACK-FIT</h1>

            <p className="tracking-[0.35em] font-bold opacity-70">
              PRO EDITION
            </p>
          </div>
        </div>

        {/* MOBILE STACKED CENTER */}
        <div className="flex lg:hidden h-full flex-col items-center justify-center px-6">
          <img src={logoImg} className="w-56 mb-6" />

          <div className="w-full max-w-sm">
            <h1 className="text-2xl font-black text-center mb-2">
              Welcome Back
            </h1>

            <p className="text-center text-slate-400 text-sm mb-4">
              Sign in to track your progress
            </p>

            <div className="flex items-center gap-3 mb-6">
              <div className="h-px flex-1 bg-white/10" />
              <div className="w-2 h-2 rounded-full bg-brand" />
              <div className="h-px flex-1 bg-white/10" />
            </div>

            {/* FORM */}
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
        </div>

        {/* DESKTOP RIGHT LOGIN */}
        <div className="hidden lg:flex flex-1 items-center justify-center px-6">
          <div className="w-full max-w-sm">
            <h1 className="text-2xl font-black text-center mb-2">
              Welcome Back
            </h1>

            <p className="text-center text-slate-400 text-sm mb-4">
              Sign in to track your progress
            </p>

            <div className="flex items-center gap-3 mb-6">
              <div className="h-px flex-1 bg-white/10" />
              <div className="w-2 h-2 rounded-full bg-brand" />
              <div className="h-px flex-1 bg-white/10" />
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
        </div>
      </div>
    </div>
  );
};
