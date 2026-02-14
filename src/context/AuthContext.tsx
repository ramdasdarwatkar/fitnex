import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { db } from "../db/database";
import type { UserProfile } from "../types/database.types";

interface AuthContextType {
  user_id: string | null;
  profile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  setProfile: (profile: UserProfile | null) => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user_id, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const runDataLoader = async (uid: string) => {
    // Only trigger global loading if we have no profile in memory
    if (!profile) setLoading(true);

    try {
      let localProfile = await db.user_profile.get(uid);

      if (!localProfile) {
        const { data } = await supabase
          .from("user_profile")
          .select("*")
          .eq("user_id", uid)
          .single();

        if (data) {
          await db.user_profile.put(data);
          localProfile = data;
        }
      }
      setProfile(localProfile || null);
    } catch (err) {
      console.error("Data Loader Error:", err);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUserId(session.user.id);
        await runDataLoader(session.user.id);
      } else {
        setUserId(null);
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshProfile = async () => {
    if (user_id) await runDataLoader(user_id);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    await db.delete();
    window.location.href = "/fitnex/login";
  };

  return (
    <AuthContext.Provider
      value={{
        user_id,
        profile,
        loading,
        signOut,
        setProfile,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
