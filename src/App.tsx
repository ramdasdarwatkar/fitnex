import { useEffect } from "react";
import { AppRoutes } from "./routes";

function App() {
  /**
   * Block horizontal edge swipe (Safari back gesture)
   */
  function useBlockHorizontalSwipe() {
    useEffect(() => {
      let startX = 0;

      const handleTouchStart = (e: TouchEvent) => {
        startX = e.touches[0].clientX;
      };

      const handleTouchMove = (e: TouchEvent) => {
        const diffX = e.touches[0].clientX - startX;

        // If swipe starts near edge and moves horizontally
        if (startX < 20 || startX > window.innerWidth - 20) {
          if (Math.abs(diffX) > 10) {
            e.preventDefault();
          }
        }
      };

      document.addEventListener("touchstart", handleTouchStart, {
        passive: false,
      });
      document.addEventListener("touchmove", handleTouchMove, {
        passive: false,
      });

      return () => {
        document.removeEventListener("touchstart", handleTouchStart);
        document.removeEventListener("touchmove", handleTouchMove);
      };
    }, []);
  }

  /**
   * Kill iOS rubber bounce on scroll container (.no-bounce)
   */
  function usePreventIOSBounce() {
    useEffect(() => {
      let startY = 0;

      const onTouchStart = (e: TouchEvent) => {
        startY = e.touches[0].clientY;
      };

      const onTouchMove = (e: TouchEvent) => {
        const el = document.querySelector(".no-bounce") as HTMLElement;
        if (!el) return;

        const diffY = e.touches[0].clientY - startY;

        const atTop = el.scrollTop === 0;
        const atBottom = el.scrollHeight - el.scrollTop === el.clientHeight;

        if ((atTop && diffY > 0) || (atBottom && diffY < 0)) {
          e.preventDefault(); // 🔥 stop rubber band
        }
      };

      document.addEventListener("touchstart", onTouchStart, {
        passive: false,
      });
      document.addEventListener("touchmove", onTouchMove, {
        passive: false,
      });

      return () => {
        document.removeEventListener("touchstart", onTouchStart);
        document.removeEventListener("touchmove", onTouchMove);
      };
    }, []);
  }

  useBlockHorizontalSwipe();
  usePreventIOSBounce();

  return (
    <div className="app-root">
      <AppRoutes />
    </div>
  );
}

export default App;
