import React from "react";
import { Lock, Clock, ArrowRight, LogIn } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

interface StudioGatekeeperProps {
  children: React.ReactNode;
  onNavigate: (view: "home" | "studio" | "dashboard" | "login") => void;
}

export const StudioGatekeeper: React.FC<StudioGatekeeperProps> = ({
  children,
  onNavigate,
}) => {
  const { user, isAuthenticated, isPermitted } = useAuth();

  // Permitted users and admins have direct access
  if (isAuthenticated && isPermitted) {
    return <>{children}</>;
  }

  // If not logged in at all
  if (!isAuthenticated || !user) {
    return (
      <div className="gatekeeper-root">
        <div className="gatekeeper-card">
          <div className="gatekeeper-icon-box lock-icon-box">
            <Lock size={32} />
          </div>

          <h2 className="gatekeeper-title">Studio Access Restricted</h2>
          <p className="gatekeeper-desc">
            CodeStudio 26 requires an authorized account to render
            high-resolution 1080p and 4K code animations.
          </p>

          <div className="gatekeeper-notice-box">
            <span className="notice-title">
              RBAC Policy (Role-Based Access Control):
            </span>
            <p>
              Only permitted <code>USER</code> accounts with{" "}
              <code>APPROVED</code> status or administrators can access the
              Studio workspace.
            </p>
          </div>

          <div className="gatekeeper-actions">
            <button
              type="button"
              className="btn btn-primary btn-block"
              onClick={() => onNavigate("login")}
            >
              <LogIn size={16} />
              <span>Sign In with Auth0</span>
              <ArrowRight size={16} />
            </button>

            <button
              type="button"
              className="btn btn-secondary btn-block"
              onClick={() => onNavigate("home")}
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Logged in, but status is PENDING or REJECTED
  return (
    <div className="gatekeeper-root">
      <div className="gatekeeper-card">
        <div className="gatekeeper-icon-box pending-icon-box">
          <Clock size={32} />
        </div>

        <h2 className="gatekeeper-title">Access Request Pending Approval</h2>
        <p className="gatekeeper-desc">
          Your account is currently waiting for administrator authorization to
          use the CodeStudio workspace.
        </p>

        <div className="gatekeeper-user-details">
          <div className="detail-row">
            <span className="detail-label">Account:</span>
            <span className="detail-value">
              {user.name} ({user.email})
            </span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Current Status:</span>
            <span
              className={`status-badge status-${user.status.toLowerCase()}`}
            >
              {user.status}
            </span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Reviewing Admin:</span>
            <span className="detail-value">
              Salek Masud Parvez (<code>smp23997@gmail.com</code>)
            </span>
          </div>
        </div>

        <div className="gatekeeper-notice-box">
          <button
            type="button"
            className="btn btn-primary btn-block"
            onClick={() => onNavigate("dashboard")}
          >
            Go to Dashboard & Manage Access Packages
          </button>
        </div>
      </div>
    </div>
  );
};
