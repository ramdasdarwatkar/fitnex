import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { BrowserRouter } from "react-router-dom";
import { registerSW } from "virtual:pwa-register";
import { AuthProvider } from "./context/AuthContext";

/**
 * Fix iOS full-height + home-indicator gap
 * Uses REAL visual viewport instead of broken vh units
 */
function setAppHeight() {
  const height = window.visualViewport?.height || window.innerHeight;
  document.documentElement.style.setProperty("--app-height", `${height}px`);
}

// Run once on startup
setAppHeight();

// Update on resize / rotation / toolbar collapse
window.visualViewport?.addEventListener("resize", setAppHeight);
window.addEventListener("orientationchange", setAppHeight);

// Auto update PWA
registerSW({
  immediate: true,
  onNeedRefresh() {
    window.location.reload();
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter basename="/fitnex">
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
