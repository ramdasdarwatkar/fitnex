import { useEffect } from "react";
import { AppRoutes } from "./routes";

function App() {
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

  useBlockHorizontalSwipe();
  return (
    <div className="app-root">
      <AppRoutes />
    </div>
  );
}

export default App;
