import { useEffect } from "react";
import { AppRoutes } from "./routes";

/**
 * App.tsx - Root Component
 * Handles global browser behaviors and main route injection.
 */
function App() {
  /**
   * MOBILE UX: Block horizontal edge swipe (Safari/Chrome back gesture)
   * This prevents the browser from "sliding away" the app when users
   * swipe near the edges, keeping the experience native-like.
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

        // If horizontal movement is greater than vertical, block it
        if (dx > dy && dx > 10) {
          // Check if swipe is near the edges (0-30px or screenWidth-30px)
          if (startX < 30 || startX > window.innerWidth - 30) {
            e.preventDefault();
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
