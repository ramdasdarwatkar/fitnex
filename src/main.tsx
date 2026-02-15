import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { BrowserRouter } from "react-router-dom";
import { registerSW } from "virtual:pwa-register";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { WorkoutProvider } from "./context/WorkoutContext";

/**
 * iOS real viewport height fix
 */
function setAppHeight() {
  const height = window.visualViewport?.height || window.innerHeight;
  document.documentElement.style.setProperty("--app-height", `${height}px`);
}

setAppHeight();
window.visualViewport?.addEventListener("resize", setAppHeight);
window.addEventListener("orientationchange", setAppHeight);

/* ========================= */
/* REAL AUTO UPDATE LOGIC   */
/* ========================= */

const updateSW = registerSW({
  immediate: true,

  onNeedRefresh() {
    // Force activate new worker
    updateSW(true);
  },

  onOfflineReady() {
    console.log("App ready offline");
  },
});

/* Hard reload AFTER SW activates */
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    window.location.reload();
  });
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter basename="/fitnex">
      <AuthProvider>
        <ThemeProvider>
          <WorkoutProvider>
            <App />
          </WorkoutProvider>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
