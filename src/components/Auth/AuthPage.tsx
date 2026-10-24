import React, { useState } from 'react';
import {
  ShieldCheck,
  Shield,
  Lock,
  ArrowRight,
  AlertCircle,
  Video,
  Eye,
  EyeOff,
  CheckCircle2,
  Mail,
  User,
  KeyRound,
  Terminal,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface AuthPageProps {
  onNavigate?: (view: 'home' | 'studio' | 'dashboard' | 'login') => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onNavigate }) => {
  const {
    user,
    isAuthenticated,
    login,
    signup,
    loginWithGoogle,
    loginAsAdmin,
    loginAsDemoUser,
    loginAsPendingUser,
  } = useAuth();

  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showDevProfiles, setShowDevProfiles] = useState(true);

  const navigateTo = (view: 'home' | 'studio' | 'dashboard' | 'login') => {
    if (onNavigate) {
      onNavigate(view);
    } else {
      window.location.pathname = view === 'home' ? '/' : `/${view}`;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput || !emailInput.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (!passwordInput || passwordInput.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    if (mode === 'signup' && passwordInput !== confirmPasswordInput) {
      setErrorMessage('Passwords do not match. Please re-enter.');
      return;
    }

    setErrorMessage('');
    setSuccessMessage('');
    setIsSubmitting(true);

    try {
      if (mode === 'signup') {
        const u = await signup(nameInput, emailInput, passwordInput);
        setSuccessMessage(`Account created for ${u.name}! Redirecting to control center...`);
        setTimeout(() => {
          navigateTo('dashboard');
        }, 400);
      } else {
        const u = await login(emailInput, passwordInput);
        setSuccessMessage(`Welcome back, ${u.name}! Redirecting...`);
        setTimeout(() => {
          navigateTo('dashboard');
        }, 400);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAdminQuickLogin = async () => {
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      await loginAsAdmin();
      navigateTo('dashboard');
    } catch (err: any) {
      setErrorMessage(err.message || 'Admin authentication failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoUserQuickLogin = async () => {
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      await loginAsDemoUser();
      navigateTo('studio');
    } catch (err: any) {
      setErrorMessage(err.message || 'User login failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePendingUserQuickLogin = async () => {
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      await loginAsPendingUser();
      navigateTo('dashboard');
    } catch (err: any) {
      setErrorMessage(err.message || 'Pending login failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-page-root">
      <div className="login-card-container">
        {/* Brand Header */}
        <div className="login-header text-center">
          <div className="login-brand-logo">
            <img src="/logo.svg" alt="CodeStudio 26 Logo" className="navbar-logo-img" />
          </div>
          <h2 className="login-title">Sign In to CodeStudio 26</h2>
          <p className="login-subtitle">
            Enterprise Video Animation Studio & Role-Based Access Control (RBAC)
          </p>
        </div>

        {isAuthenticated && user ? (
          <div className="already-authenticated-box">
            <div className="auth-user-summary">
              <span className="summary-title">Active Authorized Session:</span>
              <div className="summary-row">
                <strong>{user.name}</strong> (<code>{user.email}</code>)
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
                onClick={() => navigateTo('dashboard')}
              >
                Go to Control Dashboard
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-block"
                onClick={() => navigateTo('studio')}
              >
                <Video size={15} />
                <span>Go to Studio Workspace</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Mode Switcher */}
            <div className="auth-mode-tabs">
              <button
                type="button"
                className={`auth-mode-tab ${mode === 'login' ? 'active' : ''}`}
                onClick={() => {
                  setMode('login');
                  setErrorMessage('');
                  setSuccessMessage('');
                }}
              >
                Sign In
              </button>
              <button
                type="button"
                className={`auth-mode-tab ${mode === 'signup' ? 'active' : ''}`}
                onClick={() => {
                  setMode('signup');
                  setErrorMessage('');
                  setSuccessMessage('');
                }}
              >
                Create Account
              </button>
            </div>

            {/* Error & Success Feedback */}
            {errorMessage && (
              <div className="login-error-alert" role="alert">
                <AlertCircle size={16} />
                <span>{errorMessage}</span>
              </div>
            )}
            {successMessage && (
              <div className="login-success-alert" role="status">
                <CheckCircle2 size={16} />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="login-form">
              {mode === 'signup' && (
                <div className="form-group">
                  <label htmlFor="auth-name">
                    <User size={13} className="inline-icon" /> Full Name
                  </label>
                  <input
                    id="auth-name"
                    type="text"
                    className="form-input"
                    placeholder="e.g. Salek Masud Parvez"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    required
                  />
                </div>
              )}

              <div className="form-group">
                <label htmlFor="auth-email">
                  <Mail size={13} className="inline-icon" /> Email Address
                </label>
                <input
                  id="auth-email"
                  type="email"
                  className="form-input"
                  placeholder="name@example.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>

              <div className="form-group">
                <div className="form-label-row">
                  <label htmlFor="auth-password">
                    <KeyRound size={13} className="inline-icon" /> Password
                  </label>
                  {emailInput.toLowerCase() === 'smp23997@gmail.com' && (
                    <span className="admin-hint-tag">Superadmin Credentials</span>
                  )}
                </div>
                <div className="password-input-wrapper">
                  <input
                    id="auth-password"
                    type={showPassword ? 'text' : 'password'}
                    className="form-input"
                    placeholder={mode === 'signup' ? 'At least 6 characters' : 'Enter your account password'}
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {mode === 'signup' && (
                <div className="form-group">
                  <label htmlFor="auth-confirm-password">
                    <KeyRound size={13} className="inline-icon" /> Confirm Password
                  </label>
                  <input
                    id="auth-confirm-password"
                    type={showPassword ? 'text' : 'password'}
                    className="form-input"
                    placeholder="Re-enter your password"
                    value={confirmPasswordInput}
                    onChange={(e) => setConfirmPasswordInput(e.target.value)}
                    autoComplete="new-password"
                    required
                  />
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary btn-block btn-auth-submit"
                disabled={isSubmitting}
              >
                <Lock size={15} />
                <span>
                  {isSubmitting
                    ? 'Authenticating...'
                    : mode === 'login'
                    ? 'Sign In with Email'
                    : 'Create Account & Request Studio Access'}
                </span>
                <ArrowRight size={15} />
              </button>

              <button
                type="button"
                className="btn btn-secondary btn-block btn-auth0-oauth"
                onClick={loginWithGoogle}
                title="Single Sign-On with Google via Auth0"
              >
                <span className="google-icon-monogram">G</span>
                <span>Continue with Google / Auth0 Universal Login</span>
              </button>
            </form>

            {/* Quick Access Card Row (Automated Testing & Fast Admin Access) */}
            <div className="developer-bypass-section">
              <button
                type="button"
                className="dev-toggle-link"
                onClick={() => setShowDevProfiles(!showDevProfiles)}
              >
                <Terminal size={12} />
                <span>{showDevProfiles ? 'Hide Developer Quick Profiles' : 'Developer & Test Profiles'}</span>
              </button>

              <div
                className="quick-login-grid"
                style={{ display: showDevProfiles ? 'flex' : 'none' }}
              >
                <button
                  type="button"
                  className="quick-login-card admin-card"
                  onClick={handleAdminQuickLogin}
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
                      Salek Masud Parvez (<code>smp23997@gmail.com</code>)
                    </div>
                    <span className="quick-card-action">Full access & user approval console →</span>
                  </div>
                </button>

                <button
                  type="button"
                  className="quick-login-card user-card"
                  onClick={handleDemoUserQuickLogin}
                  disabled={isSubmitting}
                >
                  <div className="quick-card-icon">
                    <User size={20} className="text-cyan" />
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
                  onClick={handlePendingUserQuickLogin}
                  disabled={isSubmitting}
                >
                  <div className="quick-card-icon">
                    <Lock size={20} className="text-orange" />
                  </div>
                  <div className="quick-card-content">
                    <div className="quick-card-title">
                      <span>New User</span>
                      <span className="status-badge status-pending">PENDING</span>
                    </div>
                    <div className="quick-card-desc">
                      Simulate pending user state & access approval workflow
                    </div>
                    <span className="quick-card-action">Test gatekeeping →</span>
                  </div>
                </button>
              </div>
            </div>
          </>
        )}

        {/* Security & RBAC Footer Info */}
        <div className="login-security-notice">
          <Shield size={14} className="text-blue" />
          <span>
            Studio GPU rendering access is governed by Role-Based Access Control (RBAC).
            Accounts are reviewed and approved by Administrator Salek Masud Parvez.
          </span>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
