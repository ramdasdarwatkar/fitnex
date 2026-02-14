import { Routes, Route, useLocation } from "react-router-dom";
import { LoginPage } from "../pages/auth/LoginPage";
import { Dashboard } from "../pages/dashboard/Dashboard";

export const AppRoutes = () => {
  const location = useLocation();

  return (
    <div className="page-container">
      <Routes location={location} key={location.pathname}>
        <Route path="/fitnex/dashboard" element={<Dashboard />} />
        <Route path="*" element={<LoginPage />} />
      </Routes>
    </div>
  );
};
