import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

import { LoginPage } from "../pages/auth/LoginPage";
import { OnboardingPage } from "../pages/onboarding/OnboardingPage";
import { Dashboard } from "../pages/dashboard/Dashboard";

import { AppLayout } from "../components/layout/AppLayout";
import { CacheDataLoader } from "../components/ui/CacheDataLoader";

import { ProfileHome } from "../pages/profile/ProfileHome";
import { ProfileDetails } from "../pages/profile/ProfileDetails";
import { ProfileMetrics } from "../pages/profile/ProfileMetrics";
import { ProfileLevel } from "../pages/profile/ProfileLevel";
import { ProfileTheme } from "../pages/profile/ProfileTheme";
import { Library } from "../pages/library/Library";
import { AddMuscle } from "../pages/library/muscles/AddMuscle";
import { MuscleDetail } from "../pages/library/muscles/MuscleDetail";
import { AddExercise } from "../pages/library/exercises/AddExercise";
import { ExerciseDetail } from "../pages/library/exercises/ExerciseDetails";
import { AddRoutine } from "../pages/library/routines/AddRoutine";
import { RoutineDetail } from "../pages/library/routines/RoutineDetail";
import { ActiveWorkout } from "../pages/workout/ActiveWorkout";

export const AppRoutes = () => {
  const { user_id, athlete, loading } = useAuth();

  // 1. FULL SCREEN BARRIER
  // Prevents "Route Flashing" while initializing
  if (loading) {
    return (
      <div className="h-screen w-full bg-[var(--bg-main)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[var(--brand-primary)] border-t-transparent rounded-full animate-spin" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-muted)] animate-pulse">
            Establishing Link...
          </p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* CASE 1: NOT LOGGED IN */}
      {!user_id && (
        <>
          <Route path="/login" element={<LoginPage />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </>
      )}

      {/* CASE 2: LOGGED IN BUT NEEDS ONBOARDING */}
      {user_id && !athlete && (
        <>
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="*" element={<Navigate to="/onboarding" replace />} />
        </>
      )}

      {/* CASE 3: AUTHENTICATED & READY */}
      {user_id && athlete && (
        <Route element={<CacheDataLoader />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<ProfileHome />} />
            <Route path="/library" element={<Library />} />
          </Route>

          <Route path="/profile/details" element={<ProfileDetails />} />
          <Route path="/profile/metrics" element={<ProfileMetrics />} />
          <Route path="/profile/level" element={<ProfileLevel />} />
          <Route path="/profile/theme" element={<ProfileTheme />} />
          <Route path="/library/muscles/add" element={<AddMuscle />} />
          <Route path="/library/muscles/:id" element={<MuscleDetail />} />
          <Route path="/library/exercises/add" element={<AddExercise />} />
          <Route path="/library/exercises/:id" element={<ExerciseDetail />} />
          <Route path="/library/routines/add" element={<AddRoutine />} />
          <Route path="/library/routines/:id" element={<RoutineDetail />} />
          <Route path="/workout/active" element={<ActiveWorkout />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      )}
    </Routes>
  );
};
