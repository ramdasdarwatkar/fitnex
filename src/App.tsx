import { useEffect } from "react";
import { AppRoutes } from "./routes";
import { SyncManager } from "./services/SyncManager";
import { useAuth } from "./context/AuthContext";
import { useBlockHorizontalSwipe } from "./hooks/useBlockHorizontalSwipe"; // Extracted

/**
 * App.tsx - Root Component
 * Centralizes global logic: Sync, Navigation Guarding, and Route Injection.
 */
function App() {
  const { user_id } = useAuth();

  // Block browser edge-swipe gestures for a native app feel
  useBlockHorizontalSwipe();

  /**
   * GLOBAL SYNC RECONCILIATION
   */
  useEffect(() => {
    if (user_id) {
      // Setup network listener to retry sync when coming back online
      SyncManager.watchConnection();
      // Attempt to push any "dirty" offline records to Supabase
      SyncManager.reconcile();
    }
  }, [user_id]);

  return (
    /* The app-root uses our CSS variables. 
      selection:bg-brand-primary ensures the brand color is used when highlighting text.
    */
    <div className="app-root min-h-screen bg-bg-main text-text-main overflow-x-hidden selection:bg-brand-primary selection:text-bg-main">
      <AppRoutes />
    </div>
  );
}

export default App;
