import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { db } from "../db/database";
import { AthleteService } from "../services/AthleteService";
import type { AthleteSummary } from "../types/database.types";

interface AuthContextType {
  user_id: string | null;
  athlete: AthleteSummary | null;
  loading: boolean;
  error: string | null;
  signOut: () => Promise<{ success: boolean; message?: string }>;
  refreshAthlete: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user_id, setUserId] = useState<string | null>(null);
  const [athlete, setAthlete] = useState<AthleteSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAthleteData = async (uid: string, forceRefresh = false) => {
    setError(null);
    setLoading(true); // Barrier ON
    try {
      if (!forceRefresh) {
        const localData = await db.athlete_summary.get(uid);
        if (localData) {
          setAthlete(localData);
          setLoading(false); // Barrier OFF (Success Local)
          return;
        }
      }

      const data = await AthleteService.syncSummary(uid);
      setAthlete(data);
    } catch (err: any) {
      console.error("Fitnex Auth Error:", err);
      setError(err.message || "Failed to sync athlete data");
      setAthlete(null);
    } finally {
      setLoading(false); // Barrier OFF (Final)
    }
  };

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUserId(session.user.id);
        await fetchAthleteData(session.user.id);
      } else {
        setUserId(null);
        setAthlete(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const refreshAthlete = async () => {
    if (user_id) {
      await fetchAthleteData(user_id, true);
    }
  };

  const signOut = async () => {
    try {
      const unsynced = await db.workout_logs
        .where("is_synced")
        .equals(0)
        .count();
      if (unsynced > 0) {
        return {
          success: false,
          message: `Wait! ${unsynced} sets are not synced.`,
        };
      }
      await supabase.auth.signOut();
      await db.delete();
      window.location.href = "/fitnex/login";
      return { success: true };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  };

  return (
    <AuthContext.Provider
      value={{ user_id, athlete, loading, error, signOut, refreshAthlete }}
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
