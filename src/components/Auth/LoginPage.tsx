import React, { useState } from 'react';
import {
  ShieldCheck,
  Shield,
  Lock,
  ArrowRight,
  UserCheck,
  UserPlus,
  AlertCircle,
  Video,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface LoginPageProps {
  onNavigate: (view: 'home' | 'studio' | 'dashboard' | 'login') => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate }) => {
  const {
    user,
    isAuthenticated,
    auth0Domain,
    login,
    loginWithAuth0,
    loginAsAdmin,
    loginAsDemoUser,
    loginAsPendingUser,
  } = useAuth();
  const [emailInput, setEmailInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleCustomLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput || !emailInput.includes('@')) {
      setErrorMessage('Please enter a valid email address');
      return;
    }
    setErrorMessage('');
    setIsSubmitting(true);
    try {
      await login({
        email: emailInput.trim(),
        name: nameInput.trim() || emailInput.split('@')[0],
      });
      onNavigate('dashboard');
    } catch (err: any) {
      setErrorMessage(err.message || 'Login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAdminLogin = async () => {
    setIsSubmitting(true);
    await loginAsAdmin();
    setIsSubmitting(false);
    onNavigate('dashboard');
  };

  const handleDemoUserLogin = async () => {
    setIsSubmitting(true);
    await loginAsDemoUser();
    setIsSubmitting(false);
    onNavigate('studio');
  };

  const handlePendingUserLogin = async () => {
    setIsSubmitting(true);
    await loginAsPendingUser();
    setIsSubmitting(false);
    onNavigate('dashboard');
  };

  return (
    <div className="login-page-root">
      <div className="login-card-container">
        {/* Auth Header */}
        <div className="login-header text-center">
          <div className="login-brand-logo">
            <img src="/logo.svg" alt="CodeStudio 26 Logo" />
          </div>
          <h2 className="login-title">Sign In to CodeStudio 26</h2>
          <p className="login-subtitle">
            Role-Based Access Control (RBAC) System with Auth0 & PostgreSQL
          </p>
        </div>

        {isAuthenticated && user ? (
          <div className="already-authenticated-box">
            <div className="auth-user-summary">
              <span className="summary-title">You are currently signed in as:</span>
              <div className="summary-row">
                <strong>{user.name}</strong> ({user.email})
              </div>
              <div className="summary-badges">
                <span className={`role-badge ${user.role === 'ADMIN' ? 'role-admin' : 'role-user'}`}>
                  {user.role}
                </span>
                <span className={`status-badge status-${user.status.toLowerCase()}`}>
                  {user.status}
                </span>
              </div>
            </div>

            <div className="auth-redirect-actions">
              <button
                type="button"
                className="btn btn-primary btn-block"
                onClick={() => onNavigate('dashboard')}
              >
                Go to Dashboard
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-block"
                onClick={() => onNavigate('studio')}
              >
                <Video size={15} />
                <span>Go to Studio</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Direct Email / Auth0 Sign In Form */}
            <form onSubmit={handleCustomLogin} className="login-form">
              {errorMessage && (
                <div className="login-error-alert">
                  <AlertCircle size={15} />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="form-group">
                <label htmlFor="auth-email">Email Address</label>
                <input
                  id="auth-email"
                  type="email"
                  className="form-input"
                  placeholder="name@example.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="auth-name">Your Full Name (Optional)</label>
                <input
                  id="auth-name"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Salek Masud Parvez"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-block btn-auth-submit"
                disabled={isSubmitting}
              >
                <Lock size={15} />
                <span>{isSubmitting ? 'Authenticating...' : 'Sign In with Email'}</span>
                <ArrowRight size={15} />
              </button>

              {auth0Domain && (
                <button
                  type="button"
                  className="btn btn-secondary btn-block btn-auth0-oauth"
                  onClick={loginWithAuth0}
                  title={`Redirect to Auth0 (${auth0Domain})`}
                >
                  <img
                    src="https://cdn.auth0.com/website/press/resources/auth0-logo-monogram.svg"
                    alt="Auth0"
                    width="15"
                    height="15"
                    onError={(e) => ((e.target as HTMLElement).style.display = 'none')}
                  />
                  <span>Continue with Auth0 Universal Login</span>
                </button>
              )}
            </form>

            {auth0Domain && (
              <div className="auth0-env-indicator">
                <span className="env-dot" />
                <span>Tenant: <code>{auth0Domain}</code></span>
              </div>
            )}

            <div className="login-divider">
              <span>OR USE INSTANT ROLE PROFILES</span>
            </div>

            {/* Fast Quick-Switch RBAC Demo Logins */}
            <div className="quick-login-grid">
              <button
                type="button"
                className="quick-login-card admin-card"
                onClick={handleAdminLogin}
                disabled={isSubmitting}
              >
                <div className="quick-card-icon">
                  <ShieldCheck size={20} className="text-amber" />
                </div>
                <div className="quick-card-content">
                  <div className="quick-card-title">
                    <span>Admin Profile</span>
                    <span className="role-badge role-admin">ADMIN</span>
                  </div>
                  <div className="quick-card-desc">
                    Salek Masud Parvez (<code>sakekmasudparvez@gmail.com</code>)
                  </div>
                  <span className="quick-card-action">Full access & user approval console →</span>
                </div>
              </button>

              <button
                type="button"
                className="quick-login-card user-card"
                onClick={handleDemoUserLogin}
                disabled={isSubmitting}
              >
                <div className="quick-card-icon">
                  <UserCheck size={20} className="text-cyan" />
                </div>
                <div className="quick-card-content">
                  <div className="quick-card-title">
                    <span>Permitted User</span>
                    <span className="status-badge status-approved">APPROVED</span>
                  </div>
                  <div className="quick-card-desc">
                    Alex Developer (<code>developer.alex@gmail.com</code>)
                  </div>
                  <span className="quick-card-action">Direct studio access with export →</span>
                </div>
              </button>

              <button
                type="button"
                className="quick-login-card pending-card"
                onClick={handlePendingUserLogin}
                disabled={isSubmitting}
              >
                <div className="quick-card-icon">
                  <UserPlus size={20} className="text-orange" />
                </div>
                <div className="quick-card-content">
                  <div className="quick-card-title">
                    <span>New User</span>
                    <span className="status-badge status-pending">PENDING</span>
                  </div>
                  <div className="quick-card-desc">
                    Test access gatekeeping & approval request workflow
                  </div>
                  <span className="quick-card-action">Simulate pending user state →</span>
                </div>
              </button>
            </div>
          </>
        )}

        {/* Security & RBAC Footer Info */}
        <div className="login-security-notice">
          <Shield size={14} className="text-blue" />
          <span>
            Studio access is strictly role-governed. Unapproved accounts cannot render canvas videos until reviewed by Administrator Salek Masud Parvez.
          </span>
        </div>
      </div>
    </div>
  );
};
