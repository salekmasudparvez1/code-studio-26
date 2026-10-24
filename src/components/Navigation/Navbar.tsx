import React from "react";
import {
  Sparkles,
  Shield,
  ShieldCheck,
  User as UserIcon,
  LogOut,
  LogIn,
  Video,
  Lock,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

interface NavbarProps {
  currentView: "home" | "studio" | "dashboard" | "login";
  onNavigate: (view: "home" | "studio" | "dashboard" | "login") => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate }) => {
  const { user, isAuthenticated, isPermitted, logout } = useAuth();

  return (
    <header className="global-navbar">
      <div className="navbar-container">
        {/* Brand / Logo */}
        <div
          className="navbar-brand"
          onClick={() => onNavigate("home")}
          role="button"
          tabIndex={0}
        >
          <img
            src="/logo.svg"
            alt="CodeStudio 26 Logo"
            className="navbar-logo-img"
          />
        </div>

        {/* Center Nav Links */}
        <nav className="navbar-links">
          <button
            type="button"
            className={`nav-link ${currentView === "home" ? "active" : ""}`}
            onClick={() => onNavigate("home")}
          >
            Home
          </button>

          <button
            type="button"
            className="nav-link"
            onClick={() => {
              if (currentView !== "home") {
                onNavigate("home");
                setTimeout(() => {
                  document
                    .getElementById("features-section")
                    ?.scrollIntoView({ behavior: "smooth" });
                }, 100);
              } else {
                document
                  .getElementById("features-section")
                  ?.scrollIntoView({ behavior: "smooth" });
              }
            }}
          >
            Features
          </button>

          <button
            type="button"
            className="nav-link"
            onClick={() => {
              if (currentView !== "home") {
                onNavigate("home");
                setTimeout(() => {
                  document
                    .getElementById("about-creator-section")
                    ?.scrollIntoView({ behavior: "smooth" });
                }, 100);
              } else {
                document
                  .getElementById("about-creator-section")
                  ?.scrollIntoView({ behavior: "smooth" });
              }
            }}
          >
            About Creator
          </button>

          <button
            type="button"
            className={`nav-link ${currentView === "studio" ? "active" : ""}`}
            onClick={() => onNavigate("studio")}
          >
            Studio
            {!isPermitted && <Lock size={12} className="nav-lock-icon" />}
          </button>

          {isAuthenticated && (
            <button
              type="button"
              className={`nav-link ${currentView === "dashboard" ? "active" : ""}`}
              onClick={() => onNavigate("dashboard")}
            >
              Dashboard
            </button>
          )}
        </nav>

        {/* Right Action / Auth Controls */}
        <div className="navbar-actions">
          {isAuthenticated && user ? (
            <div className="navbar-user-menu">
              <div
                className="user-profile-pill"
                onClick={() => onNavigate("dashboard")}
                title="Open Dashboard"
              >
                <div className="user-avatar-circle">
                  {user.picture ? (
                    <img src={user.picture} alt={user.name} />
                  ) : (
                    <UserIcon size={14} />
                  )}
                </div>
                <div className="user-meta-info">
                  <span className="user-display-name">{user.name}</span>
                  <div className="user-tag-row">
                    <span
                      className={`role-badge ${user.role === "ADMIN" ? "role-admin" : "role-user"}`}
                    >
                      {user.role === "ADMIN" ? (
                        <>
                          <ShieldCheck size={10} /> ADMIN
                        </>
                      ) : (
                        <>
                          <Shield size={10} /> USER
                        </>
                      )}
                    </span>
                    <span
                      className={`status-badge status-${user.status.toLowerCase()}`}
                      title={`Access Status: ${user.status}`}
                    >
                      {user.status}
                    </span>
                  </div>
                </div>
              </div>

              {currentView !== "studio" && (
                <button
                  type="button"
                  className="btn btn-primary btn-sm btn-studio-cta"
                  onClick={() => onNavigate("studio")}
                >
                  <Video size={13} />
                  <span>Launch Studio</span>
                </button>
              )}

              <button
                type="button"
                className="btn btn-secondary btn-sm btn-logout"
                onClick={logout}
                title="Sign out"
              >
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <div className="navbar-auth-buttons">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => onNavigate("login")}
              >
                <LogIn size={14} />
                <span>Sign In</span>
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => onNavigate("studio")}
              >
                <Sparkles size={14} />
                <span>Open Studio</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
