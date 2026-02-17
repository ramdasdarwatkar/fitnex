import { useEffect } from "react";
import { AppRoutes } from "./routes";
import { SyncManager } from "./services/SyncManager";
import { useAuth } from "./context/AuthContext";

/**
 * App.tsx - Root Component
 * Handles global browser behaviors, sync reconciliation, and main route injection.
 */
function App() {
  const { user_id } = useAuth();

  /**
   * GLOBAL SYNC: Initialize the background sync manager.
   * Runs reconciliation on mount if a user is logged in and sets up
   * event listeners for network restoration.
   */
  useEffect(() => {
    if (user_id) {
      // 2. Listen for 'online' events to retry sync automatically
      SyncManager.watchConnection();
      // 1. Initial attempt to sync any "dirty" local records
      SyncManager.reconcile();
    }
  }, [user_id]);

  /**
   * MOBILE UX: Block horizontal edge swipe (Safari/Chrome back gesture)
   */
  function useBlockHorizontalSwipe() {
    useEffect(() => {
      let startX = 0;
      let startY = 0;

      const onTouchStart = (e: TouchEvent) => {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
      };

      const onTouchMove = (e: TouchEvent) => {
        const dx = Math.abs(e.touches[0].clientX - startX);
        const dy = Math.abs(e.touches[0].clientY - startY);

        if (dx > dy && dx > 10) {
          if (startX < 30 || startX > window.innerWidth - 30) {
            // Block edge swipe to keep navigation internal
            if (e.cancelable) e.preventDefault();
          }
        }
      };

      document.addEventListener("touchstart", onTouchStart, { passive: false });
      document.addEventListener("touchmove", onTouchMove, { passive: false });

      return () => {
        document.removeEventListener("touchstart", onTouchStart);
        document.removeEventListener("touchmove", onTouchMove);
      };
    }, []);
  }

  // Trigger the swipe block
  useBlockHorizontalSwipe();

  return (
    /* Global Wrapper:
       Using var(--bg-main) here is critical to prevent white "seams" 
       or flashes during route transitions.
    */
    <div className="app-root min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] overflow-x-hidden selection:bg-[var(--brand-primary)] selection:text-[var(--bg-main)]">
      <AppRoutes />
    </div>
  );
}

export default App;
