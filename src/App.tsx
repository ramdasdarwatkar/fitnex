import { AppRoutes } from "./routes";
import { useBlockHorizontalSwipe } from "./hooks/useBlockHorizontalSwipe"; // Extracted

/**
 * App.tsx - Root Component
 * Centralizes global logic: Sync, Navigation Guarding, and Route Injection.
 */
function App() {
  // Block browser edge-swipe gestures for a native app feel
  useBlockHorizontalSwipe();

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
