import { useEffect } from "react";

/**
 * Prevents iOS/Android browser edge-swipe navigation (Back/Forward).
 * This ensures the user stays within the Fitnex app navigation flow.
 */
export const useBlockHorizontalSwipe = () => {
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

      // Detect horizontal movement near the screen edges (within 30px)
      if (dx > dy && dx > 10) {
        if (startX < 30 || startX > window.innerWidth - 30) {
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
};
