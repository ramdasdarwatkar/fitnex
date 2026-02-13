import { Routes, Route } from "react-router-dom";
import { LoginPage } from "../LoginPage";

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="*" element={<LoginPage />} />
    </Routes>
  );
};
