import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

// Layouts & System
import { AppLayout } from "../components/layout/AppLayout";
import { CacheDataLoader } from "../components/ui/CacheDataLoader";
import { SplashScreen } from "../components/ui/SplashScreen";

// Pages
import { LoginPage } from "../pages/auth/LoginPage";
import { OnboardingPage } from "../pages/onboarding/OnboardingPage";
import { Dashboard } from "../pages/dashboard/Dashboard";
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
import { EditExercise } from "../pages/library/exercises/EditExercise";
import { AddRoutine } from "../pages/library/routines/AddRoutine";
import { RoutineDetail } from "../pages/library/routines/RoutineDetail";
import { ActiveWorkout } from "../pages/workout/ActiveWorkout";
import { WorkoutHistory } from "../pages/workout/components/WorkoutHistory";
import { ProgressPage } from "../pages/progress/ProgressPage";
import { ExerciseProgressPage } from "../pages/progress/ExerciseProgressPage";

export const AppRoutes = () => {
  const { user_id, athlete, loading } = useAuth();

  // 1. THE SPLASH BARRIER
  // If we are initializing, nothing else exists.
  if (loading) return <SplashScreen />;

  // 2. UNAUTHENTICATED
  if (!user_id) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // 3. AUTHENTICATED
  return (
    <Routes>
      {!athlete ? (
        // CASE: TRULY NEW USER (Athlete is null after hydration)
        <>
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="*" element={<Navigate to="/onboarding" replace />} />
        </>
      ) : (
        // CASE: RETURNING USER
        <Route element={<CacheDataLoader />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<ProfileHome />} />
            <Route path="/library" element={<Library />} />
            <Route path="/progress" element={<ProgressPage />} />
          </Route>

          {/* All Paths Restored Below */}
          <Route path="/profile/details" element={<ProfileDetails />} />
          <Route path="/profile/metrics" element={<ProfileMetrics />} />
          <Route path="/profile/level" element={<ProfileLevel />} />
          <Route path="/profile/theme" element={<ProfileTheme />} />

          <Route path="/library/muscles/add" element={<AddMuscle />} />
          <Route path="/library/muscles/:id" element={<MuscleDetail />} />
          <Route path="/library/exercises/add" element={<AddExercise />} />
          <Route path="/library/exercises/:id" element={<ExerciseDetail />} />
          <Route
            path="/library/exercises/edit/:id"
            element={<EditExercise />}
          />
          <Route path="/library/routines/add" element={<AddRoutine />} />
          <Route path="/library/routines/:id" element={<RoutineDetail />} />

          <Route path="/workout/active" element={<ActiveWorkout />} />
          <Route path="/workout/history" element={<WorkoutHistory />} />
          <Route
            path="/progress/exercise/:id"
            element={<ExerciseProgressPage />}
          />

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      )}
    </Routes>
  );
};
