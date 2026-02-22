import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { registerSW } from "virtual:pwa-register";
import { AppProviders } from "./providers/AppProviders";
import { SyncManager } from "./services/SyncManager";

/**
 * iOS real viewport height fix
 * KEPT EXACTLY AS PER YOUR ORIGINAL CODE
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
    updateSW(true);
  },
  onOfflineReady() {
    console.log("App ready offline");
  },
});

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    window.location.reload();
  });
}

// Sync whenever the user comes back online
window.addEventListener("online", () => {
  SyncManager.reconcile();
});

// Rendering only - Component logic moved to AppProviders.tsx
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </React.StrictMode>,
);
