import React from "react";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "../context/AuthContext";
import { ThemeProvider } from "../context/ThemeProvider";
import { WorkoutProvider } from "../context/WorkoutProvider";

interface AppProvidersProps {
  children: React.ReactNode;
}

export const AppProviders = ({ children }: AppProvidersProps) => {
  return (
    <BrowserRouter basename="/fitnex">
      <AuthProvider>
        <ThemeProvider>
          <WorkoutProvider>{children}</WorkoutProvider>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};
