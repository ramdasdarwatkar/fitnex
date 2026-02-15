import { useEffect } from "react";
import { AppRoutes } from "./routes";

function App() {
  /**
   * Block horizontal edge swipe (Safari back gesture)
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

        // Horizontal swipe = block everywhere
        if (dx > dy && dx > 10) {
          e.preventDefault();
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

  useBlockHorizontalSwipe();

  return (
    <div className="app-root">
      <AppRoutes />
    </div>
  );
}

export default App;
