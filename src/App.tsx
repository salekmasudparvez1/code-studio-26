import React, { useState, useEffect, useCallback } from "react";
import { AuthProvider } from "./context/AuthContext";
import { Navbar } from "./components/Navigation/Navbar";
import { LandingPage } from "./components/Landing/LandingPage";

import { DashboardPage } from "./components/Dashboard/DashboardPage";
import { StudioGatekeeper } from "./components/Studio/StudioGatekeeper";
import { StudioWorkspace } from "./components/Studio/StudioWorkspace";
import AuthPage from "./components/Auth/AuthPage";

export type AppView = "home" | "studio" | "dashboard" | "login";

function parseViewFromPath(pathname: string): AppView {
  const cleanPath = pathname.replace(/\/$/, "");
  if (cleanPath === "/studio") return "studio";
  if (cleanPath === "/dashboard") return "dashboard";
  if (cleanPath === "/login") return "login";
  return "home";
}

function pathForView(view: AppView): string {
  if (view === "studio") return "/studio";
  if (view === "dashboard") return "/dashboard";
  if (view === "login") return "/login";
  return "/";
}

const AppContent: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(() =>
    parseViewFromPath(window.location.pathname),
  );

  const navigateTo = useCallback((view: AppView) => {
    setCurrentView(view);
    const targetPath = pathForView(view);
    if (window.location.pathname !== targetPath) {
      window.history.pushState({}, "", targetPath);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // Listen to browser Back / Forward buttons
  useEffect(() => {
    const handlePopState = () => {
      setCurrentView(parseViewFromPath(window.location.pathname));
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  return (
    <div className="site-root-layout">
      <Navbar currentView={currentView} onNavigate={navigateTo} />

      <main className="site-main-viewport">
        {currentView === "home" && <LandingPage onNavigate={navigateTo} />}

        {currentView === "login" && (
          <AuthPage onNavigate={navigateTo} />
        )}

        {currentView === "dashboard" && (
          <DashboardPage onNavigate={navigateTo} />
        )}

        {currentView === "studio" && (
          <StudioGatekeeper onNavigate={navigateTo}>
            <StudioWorkspace />
          </StudioGatekeeper>
        )}
      </main>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
