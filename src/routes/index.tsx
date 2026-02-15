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

export const AppRoutes = () => {
  const { user_id, profile, loading } = useAuth();

  if (loading) return null;

  return (
    <Routes>
      {/* NOT LOGGED IN */}
      {!user_id && <Route path="*" element={<LoginPage />} />}

      {/* ONBOARDING */}
      {user_id && !profile && <Route path="*" element={<OnboardingPage />} />}

      {/* AUTHENTICATED */}
      {user_id && profile && (
        <Route element={<CacheDataLoader />}>
          {/* MAIN APP (HAS BOTTOM NAV) */}
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<ProfileHome />} />
          </Route>

          {/* PROFILE SUB PAGES (NO BOTTOM NAV) */}
          <Route path="/profile/details" element={<ProfileDetails />} />
          <Route path="/profile/metrics" element={<ProfileMetrics />} />
          <Route path="/profile/level" element={<ProfileLevel />} />
          <Route path="/profile/theme" element={<ProfileTheme />} />

          {/* FALLBACK */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      )}
    </Routes>
  );
};
