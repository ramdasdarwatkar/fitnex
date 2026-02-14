import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LoginPage } from "../pages/auth/LoginPage";
import { OnboardingPage } from "../pages/onboarding/OnboardingPage";
import { Dashboard } from "../pages/dashboard/Dashboard";
import { AppLayout } from "../components/layout/AppLayout";
import { CacheDataLoader } from "../components/ui/CacheDataLoader";
import { Profile } from "../pages/profile/Profile";

export const AppRoutes = () => {
  const { user_id, profile, loading } = useAuth();

  if (loading) return null;

  return (
    <Routes>
      {/* Not logged in */}
      {!user_id && <Route path="*" element={<LoginPage />} />}

      {/* Onboarding */}
      {user_id && !profile && <Route path="*" element={<OnboardingPage />} />}

      {/* Authenticated App */}
      {user_id && profile && (
        <Route element={<CacheDataLoader />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Route>
      )}
    </Routes>
  );
};
