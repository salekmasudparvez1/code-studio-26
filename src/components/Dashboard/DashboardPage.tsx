import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ShieldCheck,
  Shield,
  CheckCircle2,
  XCircle,
  Clock,
  Video,
  RefreshCw,
  LogOut,
  Mail,
  AlertTriangle,
  Sparkles,
  Zap,
  Cpu,
  Award,
  ArrowRight,
  Search,
  MessageSquare,
  X,
  Send,
  Database,
  Activity,
  Trash2,
} from 'lucide-react';
import { useAuth, User } from '../../context/AuthContext';

interface DashboardPageProps {
  onNavigate: (view: 'home' | 'studio' | 'dashboard' | 'login') => void;
}

interface StatsData {
  totalUsers: number;
  approvedUsers: number;
  pendingUsers: number;
  adminUsers: number;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const { user, isAdmin, isPermitted, logout, refreshUser, requestAccess, deleteMyAccount } = useAuth();
  const [usersList, setUsersList] = useState<User[]>([]);
  const [stats, setStats] = useState<StatsData>({
    totalUsers: 1,
    approvedUsers: 1,
    pendingUsers: 0,
    adminUsers: 1,
  });
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');

  // Request Modal State
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [selectedPlanForRequest, setSelectedPlanForRequest] = useState<'PRO' | 'ENTERPRISE' | 'FREE'>('PRO');
  const [requestUseCase, setRequestUseCase] = useState('Computer Vision / AI / ML Visualization');
  const [requestNote, setRequestNote] = useState('');
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);

  const [actionMessage, setActionMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(
    null
  );

  const fetchUsersAndStats = useCallback(async () => {
    setIsLoadingUsers(true);
    try {
      const [usersRes, statsRes] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/stats'),
      ]);

      if (usersRes.ok) {
        const uData = await usersRes.json();
        if (uData.users) {
          setUsersList(uData.users);
        }
      }

      if (statsRes.ok) {
        const sData = await statsRes.json();
        setStats(sData);
      }
    } catch (err) {
      console.warn('Failed to load admin data:', err);
    } finally {
      setIsLoadingUsers(false);
    }
  }, []);

  useEffect(() => {
    fetchUsersAndStats();
  }, [fetchUsersAndStats]);

  const handleUpdateStatus = async (
    email: string,
    newStatus: 'APPROVED' | 'REJECTED' | 'PENDING'
  ) => {
    try {
      const res = await fetch('/api/admin/users/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, status: newStatus }),
      });

      if (res.ok) {
        setActionMessage({
          text: `User ${email} access status updated to ${newStatus}`,
          type: 'success',
        });
        await fetchUsersAndStats();
        if (user?.email?.toLowerCase() === email.toLowerCase()) {
          await refreshUser();
        }
      } else {
        const err = await res.json();
        setActionMessage({ text: err.error || 'Failed to update user status', type: 'error' });
      }
    } catch (err: any) {
      setActionMessage({ text: err.message || 'Network error occurred', type: 'error' });
    }
    setTimeout(() => setActionMessage(null), 4000);
  };

  const handleDeleteUser = async (email: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete user account: ${email}? This action cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch('/api/admin/users/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setActionMessage({
          text: `User ${email} has been permanently deleted from database.`,
          type: 'success',
        });
        await fetchUsersAndStats();
        if (user?.email?.toLowerCase() === email.toLowerCase()) {
          logout();
          onNavigate('home');
        }
      } else {
        const err = await res.json();
        setActionMessage({ text: err.error || 'Failed to delete user', type: 'error' });
      }
    } catch (err: any) {
      setActionMessage({ text: err.message || 'Network error occurred', type: 'error' });
    }
    setTimeout(() => setActionMessage(null), 4000);
  };

  const handleDeleteMyAccount = async () => {
    if (!window.confirm("Are you sure you want to permanently delete your account? All your studio records will be wiped.")) {
      return;
    }
    try {
      await deleteMyAccount();
      onNavigate('home');
    } catch (err: any) {
      setActionMessage({ text: err.message || 'Could not delete account', type: 'error' });
      setTimeout(() => setActionMessage(null), 4000);
    }
  };

  const handleUpdateRole = async (email: string, newRole: 'USER' | 'ADMIN') => {
    try {
      const res = await fetch('/api/admin/users/role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role: newRole }),
      });

      if (res.ok) {
        setActionMessage({
          text: `User ${email} role updated to ${newRole}`,
          type: 'success',
        });
        await fetchUsersAndStats();
        if (user?.email?.toLowerCase() === email.toLowerCase()) {
          await refreshUser();
        }
      } else {
        const err = await res.json();
        setActionMessage({ text: err.error || 'Failed to update user role', type: 'error' });
      }
    } catch (err: any) {
      setActionMessage({ text: err.message || 'Network error occurred', type: 'error' });
    }
    setTimeout(() => setActionMessage(null), 4000);
  };

  const openRequestModal = (plan: 'PRO' | 'ENTERPRISE' | 'FREE') => {
    setSelectedPlanForRequest(plan);
    setIsRequestModalOpen(true);
  };

  const submitAccessRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingRequest(true);
    const combinedNote = `[${requestUseCase}] ${requestNote.trim()}`;

    try {
      const res = await requestAccess(selectedPlanForRequest, combinedNote);
      setActionMessage({
        text: res.message || `Your request for the ${selectedPlanForRequest} package has been recorded in PostgreSQL.`,
        type: 'success',
      });
      setIsRequestModalOpen(false);
      setRequestNote('');
      await fetchUsersAndStats();
      await refreshUser();
    } catch (err: any) {
      setActionMessage({
        text: err.message || 'Could not submit access request.',
        type: 'error',
      });
    } finally {
      setIsSubmittingRequest(false);
      setTimeout(() => setActionMessage(null), 5000);
    }
  };

  // Filtered users for Admin table
  const filteredUsers = useMemo(() => {
    return usersList.filter((u) => {
      const matchesSearch =
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || u.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [usersList, searchQuery, statusFilter]);

  return (
    <div className="dashboard-page-root">
      <div className="dashboard-container">
        {/* Dashboard Top Header Bar */}
        <div className="dashboard-header-row">
          <div>
            <div className="dashboard-badge-row">
              <span className="live-pill">
                <span className="live-dot" /> Production Control Center
              </span>
              <span className="platform-tag">PostgreSQL 17.2 Active</span>
            </div>
            <h1 className="dashboard-title">Platform Dashboard</h1>
            <p className="dashboard-subtitle">
              Developer Control Center • Role-Based Access Control (RBAC), Packages & Telemetry
            </p>
          </div>

          <div className="dashboard-header-actions">
            {isPermitted && (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => onNavigate('studio')}
              >
                <Video size={14} />
                <span>Launch Studio</span>
              </button>
            )}
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={fetchUsersAndStats}
              title="Refresh database state"
            >
              <RefreshCw size={14} className={isLoadingUsers ? 'spin' : ''} />
              <span>Refresh</span>
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm btn-logout"
              onClick={() => {
                logout();
                onNavigate('home');
              }}
              title="Sign out of CodeStudio"
            >
              <LogOut size={14} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Global Toast Alert */}
        {actionMessage && (
          <div className={`action-alert alert-${actionMessage.type}`} role="alert">
            {actionMessage.type === 'success' ? (
              <CheckCircle2 size={16} />
            ) : (
              <AlertTriangle size={16} />
            )}
            <span>{actionMessage.text}</span>
          </div>
        )}

        {/* Profile Hero Card */}
        <div className="profile-hero-card">
          <div className="profile-main-info">
            <div className="profile-avatar-circle">
              {user?.picture ? (
                <img src={user.picture} alt={user.name} />
              ) : (
                <span>{user?.name?.slice(0, 2).toUpperCase() || 'U'}</span>
              )}
            </div>
            <div className="profile-text">
              <div className="profile-name-row">
                <h2>{user?.name || 'Authenticated Developer'}</h2>
                <span className={`role-badge ${isAdmin ? 'role-admin' : 'role-user'}`}>
                  {isAdmin ? <ShieldCheck size={12} /> : <Shield size={12} />}
                  {user?.role}
                </span>
                <span className={`status-badge status-${user?.status?.toLowerCase() || 'pending'}`}>
                  {user?.status}
                </span>
                {user?.requested_plan && (
                  <span className="plan-pill">{user.requested_plan} PACKAGE</span>
                )}
              </div>
              <div className="profile-email-row">
                <Mail size={14} className="text-muted" />
                <span>{user?.email}</span>
                <span className="dot-divider">•</span>
                <span className="profile-id-tag">ID: {user?.id}</span>
                {!isAdmin && (
                  <>
                    <span className="dot-divider">•</span>
                    <button
                      type="button"
                      className="btn-self-delete"
                      onClick={handleDeleteMyAccount}
                      title="Permanently delete your account"
                    >
                      Delete Account
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="profile-studio-gate">
            {isPermitted ? (
              <div className="studio-access-granted-box">
                <div className="granted-status-pill">
                  <CheckCircle2 size={16} className="text-emerald" />
                  <span>
                    Studio Permission: <strong>APPROVED & UNLOCKED</strong>
                  </span>
                </div>
                <button
                  type="button"
                  className="btn btn-primary btn-launch-studio"
                  onClick={() => onNavigate('studio')}
                >
                  <Video size={16} />
                  <span>Launch Studio Workspace</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            ) : (
              <div className="studio-access-pending-box">
                <div className="pending-status-pill">
                  <Clock size={16} className="text-orange" />
                  <span>
                    Studio Permission: <strong>PENDING REVIEW</strong>
                  </span>
                </div>
                <p className="pending-help-text">
                  Your Studio video rendering access is awaiting administrator review by{' '}
                  <strong>Salek Masud Parvez</strong> (<code>smp23997@gmail.com</code>).
                </p>
                <div className="pending-actions">
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => openRequestModal('PRO')}
                  >
                    <Sparkles size={14} />
                    <span>Request Studio Access</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => onNavigate('login')}
                  >
                    Switch Account
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* PACKAGES & ACCESS TIERS SECTION */}
        <div className="packages-section-container">
          <div className="section-header-wrap">
            <div>
              <div className="section-eyebrow">
                <Zap size={14} className="text-amber" />
                <span>STUDIO RENDERING TIERS</span>
              </div>
              <h2 className="section-title">Studio Access Packages & Permissions</h2>
              <p className="section-desc">
                Select an access package below to submit your official access request to Administrator Salek Masud
                Parvez.
              </p>
            </div>
          </div>

          <div className="packages-grid">
            {/* Package 1: Community Starter */}
            <div className="package-card tier-free">
              <div className="package-card-header">
                <div className="package-tier-label">Community Starter</div>
                <div className="package-price-wrap">
                  <span className="price-val">$0</span>
                  <span className="price-freq">/ lifetime</span>
                </div>
                <p className="package-desc">
                  Essential access for developers learning AI/ML concepts and basic graphs.
                </p>
              </div>

              <div className="package-features-list">
                <div className="feature-item">
                  <CheckCircle2 size={15} className="feat-check" />
                  <span>2 Basic Visualizers (Linear Regression & Matplotlib)</span>
                </div>
                <div className="feature-item">
                  <CheckCircle2 size={15} className="feat-check" />
                  <span>720p 30fps canvas preview</span>
                </div>
                <div className="feature-item">
                  <CheckCircle2 size={15} className="feat-check" />
                  <span>Interactive timeline scrubbing</span>
                </div>
                <div className="feature-item feature-disabled">
                  <XCircle size={15} className="feat-cross" />
                  <span>4K 60fps Native MP4 export</span>
                </div>
                <div className="feature-item feature-disabled">
                  <XCircle size={15} className="feat-cross" />
                  <span>YOLOv8 & Deep Neural Visualizers</span>
                </div>
              </div>

              <div className="package-card-action">
                <button
                  type="button"
                  className="btn btn-secondary btn-block"
                  onClick={() => openRequestModal('FREE')}
                >
                  {user?.requested_plan === 'FREE' && user.status === 'PENDING'
                    ? 'Free Plan Selected'
                    : 'Select Free Tier'}
                </button>
              </div>
            </div>

            {/* Package 2: Pro Studio Pass (RECOMMENDED) */}
            <div className="package-card tier-pro recommended">
              <div className="recommended-pill">
                <Sparkles size={13} />
                <span>RECOMMENDED ACCESS</span>
              </div>

              <div className="package-card-header">
                <div className="package-tier-label">Pro Studio Pass</div>
                <div className="package-price-wrap">
                  <span className="price-val">$29</span>
                  <span className="price-freq">/ month or Developer Grant</span>
                </div>
                <p className="package-desc">
                  Full unrestricted access to all 9 AI/ML canvas visualizers and 4K MP4 export.
                </p>
              </div>

              <div className="package-features-list">
                <div className="feature-item">
                  <CheckCircle2 size={15} className="feat-check-pro" />
                  <span>
                    <strong>All 9 Deep Learning Visualizers</strong> (CNN, RNN, LSTM, YOLOv8, SVM,
                    ANN)
                  </span>
                </div>
                <div className="feature-item">
                  <CheckCircle2 size={15} className="feat-check-pro" />
                  <span>
                    <strong>Native 4K & 1080p 60fps MP4 (AVC1)</strong> hardware export
                  </span>
                </div>
                <div className="feature-item">
                  <CheckCircle2 size={15} className="feat-check-pro" />
                  <span>
                    <strong>Photoshop CC Layer Styling</strong> with real-time eye toggles
                  </span>
                </div>
                <div className="feature-item">
                  <CheckCircle2 size={15} className="feat-check-pro" />
                  <span>
                    <strong>Fullscreen HUD Presentation</strong> with keyboard arrow controls
                  </span>
                </div>
                <div className="feature-item">
                  <CheckCircle2 size={15} className="feat-check-pro" />
                  <span>Priority GPU rendering worker thread</span>
                </div>
              </div>

              <div className="package-card-action">
                {isPermitted ? (
                  <div className="unlocked-action-wrap">
                    <div className="unlocked-status">
                      <CheckCircle2 size={16} className="text-emerald" />
                      <span>Pro Studio Pass Active & Unlocked</span>
                    </div>
                    <button
                      type="button"
                      className="btn btn-primary btn-block"
                      onClick={() => onNavigate('studio')}
                    >
                      <Video size={15} />
                      <span>Launch Pro Studio</span>
                    </button>
                  </div>
                ) : user?.status === 'PENDING' ? (
                  <div className="pending-request-box">
                    <div className="pending-alert-badge">
                      <Clock size={15} className="spin-slow" />
                      <span>Request Submitted (Pending Review)</span>
                    </div>
                    <button
                      type="button"
                      className="btn btn-secondary btn-block"
                      onClick={() => openRequestModal('PRO')}
                    >
                      <span>Update Request Note</span>
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="btn btn-primary btn-block btn-request-access-cta"
                    onClick={() => openRequestModal('PRO')}
                  >
                    <Sparkles size={16} />
                    <span>Request Studio Access</span>
                    <ArrowRight size={16} />
                  </button>
                )}
              </div>
            </div>

            {/* Package 3: Enterprise & Research Lab */}
            <div className="package-card tier-enterprise">
              <div className="package-card-header">
                <div className="package-tier-label">Enterprise & Research</div>
                <div className="package-price-wrap">
                  <span className="price-val">Custom</span>
                  <span className="price-freq">/ Institutional Grant</span>
                </div>
                <p className="package-desc">
                  Tailored GPU clusters, custom ML weights importer, and dedicated admin SLA.
                </p>
              </div>

              <div className="package-features-list">
                <div className="feature-item">
                  <CheckCircle2 size={15} className="feat-check" />
                  <span>Unlimited multi-track video export queue</span>
                </div>
                <div className="feature-item">
                  <CheckCircle2 size={15} className="feat-check" />
                  <span>Custom neural layer weights & checkpoint import</span>
                </div>
                <div className="feature-item">
                  <CheckCircle2 size={15} className="feat-check" />
                  <span>Dedicated PostgreSQL connection pooling</span>
                </div>
                <div className="feature-item">
                  <CheckCircle2 size={15} className="feat-check" />
                  <span>24/7 Priority support with creator</span>
                </div>
                <div className="feature-item">
                  <CheckCircle2 size={15} className="feat-check" />
                  <span>Custom branded canvas export watermarks</span>
                </div>
              </div>

              <div className="package-card-action">
                <button
                  type="button"
                  className="btn btn-secondary btn-block"
                  onClick={() => openRequestModal('ENTERPRISE')}
                >
                  <Award size={15} />
                  <span>
                    {user?.requested_plan === 'ENTERPRISE' && user.status === 'PENDING'
                      ? 'Enterprise Request Pending'
                      : 'Request Enterprise Access'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Admin RBAC Console (Visible to ADMIN) */}
        {isAdmin ? (
          <div className="admin-console-section">
            <div className="admin-section-header">
              <div className="admin-section-title">
                <ShieldCheck size={22} className="text-amber" />
                <div>
                  <h2>Admin RBAC & User Access Console</h2>
                  <p className="admin-section-sub">
                    Approve pending package access requests and manage user roles in PostgreSQL.
                  </p>
                </div>
              </div>
              <span className="admin-badge">
                <ShieldCheck size={13} />
                <span>Superadmin Access Active</span>
              </span>
            </div>

            {/* Metrics Grid */}
            <div className="stats-metric-grid">
              <div className="stat-card">
                <div className="stat-card-label">Total Users</div>
                <div className="stat-card-value">{stats.totalUsers}</div>
                <div className="stat-card-footer">Registered in PostgreSQL</div>
              </div>

              <div className="stat-card">
                <div className="stat-card-label">Permitted Users</div>
                <div className="stat-card-value text-emerald">{stats.approvedUsers}</div>
                <div className="stat-card-footer">Studio Video Creators</div>
              </div>

              <div className="stat-card highlight-pending">
                <div className="stat-card-label">Pending Requests</div>
                <div className="stat-card-value text-orange">{stats.pendingUsers}</div>
                <div className="stat-card-footer">Awaiting Your Approval</div>
              </div>

              <div className="stat-card">
                <div className="stat-card-label">Admin Accounts</div>
                <div className="stat-card-value text-amber">{stats.adminUsers}</div>
                <div className="stat-card-footer">Platform Superusers</div>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="admin-table-controls">
              <div className="admin-search-box">
                <Search size={15} className="search-icon" />
                <input
                  type="text"
                  placeholder="Search user name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
              </div>

              <div className="admin-status-tabs">
                <button
                  type="button"
                  className={`status-filter-btn ${statusFilter === 'ALL' ? 'active' : ''}`}
                  onClick={() => setStatusFilter('ALL')}
                >
                  All ({usersList.length})
                </button>
                <button
                  type="button"
                  className={`status-filter-btn ${statusFilter === 'PENDING' ? 'active pending-active' : ''}`}
                  onClick={() => setStatusFilter('PENDING')}
                >
                  Pending ({usersList.filter((u) => u.status === 'PENDING').length})
                </button>
                <button
                  type="button"
                  className={`status-filter-btn ${statusFilter === 'APPROVED' ? 'active' : ''}`}
                  onClick={() => setStatusFilter('APPROVED')}
                >
                  Approved ({usersList.filter((u) => u.status === 'APPROVED').length})
                </button>
              </div>
            </div>

            {/* User Access Management Table */}
            <div className="user-table-wrapper">
              <div className="table-header-bar">
                <div className="table-header-title-wrap">
                  <h3>Registered Users & Studio Access Requests</h3>
                  <span className="user-count-tag">{filteredUsers.length} Displayed</span>
                </div>
                <div className="table-header-legend">
                  <span className="legend-dot dot-approved" /> Approved
                  <span className="legend-dot dot-pending" /> Pending Request
                  <span className="legend-dot dot-rejected" /> Rejected
                </div>
              </div>

              <div className="table-scroll-container">
                <table className="user-table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Email</th>
                      <th>Requested Package</th>
                      <th>Use Case / Note</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Registered</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-6 text-muted">
                          No users matching current filters found.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => {
                        const isTargetAdmin =
                          u.email.toLowerCase() === 'smp23997@gmail.com' ||
                          u.email.toLowerCase() === 'sakekmasudparvez@gmail.com';
                        const isPending = u.status === 'PENDING';

                        return (
                          <tr
                            key={u.id}
                            className={`${u.email === user?.email ? 'current-user-row' : ''} ${
                              isPending ? 'pending-user-row' : ''
                            }`}
                          >
                            <td>
                              <div className="user-name-cell">
                                <span className="table-avatar">
                                  {u.name?.slice(0, 2).toUpperCase() || 'U'}
                                </span>
                                <div className="table-name-wrap">
                                  <span className="table-user-name">{u.name}</span>
                                  {u.email === user?.email && (
                                    <span className="you-pill">You</span>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  className="btn-action-delete"
                                  disabled={isTargetAdmin}
                                  onClick={() => handleDeleteUser(u.email)}
                                  title={isTargetAdmin ? "Root admin cannot be deleted" : "Delete user permanently"}
                                >
                                  <Trash2 size={13} />
                                  <span>Delete</span>
                                </button>
                              </div>
                            </td>
                            <td>
                              <code className="table-email">{u.email}</code>
                            </td>
                            <td>
                              <span className="requested-plan-badge">
                                {u.requested_plan || 'PRO'} PASS
                              </span>
                            </td>
                            <td className="table-note-cell">
                              {u.request_note ? (
                                <span className="note-text" title={u.request_note}>
                                  <MessageSquare size={12} className="inline-note-icon" />
                                  {u.request_note.length > 35
                                    ? u.request_note.substring(0, 35) + '...'
                                    : u.request_note}
                                </span>
                              ) : (
                                <span className="text-muted">—</span>
                              )}
                            </td>
                            <td>
                              <select
                                className="role-select"
                                value={u.role}
                                disabled={isTargetAdmin}
                                onChange={(e) =>
                                  handleUpdateRole(u.email, e.target.value as 'USER' | 'ADMIN')
                                }
                              >
                                <option value="USER">USER</option>
                                <option value="ADMIN">ADMIN</option>
                              </select>
                            </td>
                            <td>
                              <span className={`status-badge status-${u.status.toLowerCase()}`}>
                                {u.status}
                              </span>
                            </td>
                            <td className="table-date">
                              {u.created_at
                                ? new Date(u.created_at).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                  })
                                : 'Recent'}
                            </td>
                            <td>
                              <div className="table-actions-cell">
                                {u.status !== 'APPROVED' ? (
                                  <button
                                    type="button"
                                    className="btn-action-approve"
                                    onClick={() => handleUpdateStatus(u.email, 'APPROVED')}
                                    title="Approve Studio Access"
                                  >
                                    <CheckCircle2 size={13} />
                                    <span>Approve</span>
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    className="btn-action-revoke"
                                    disabled={isTargetAdmin}
                                    onClick={() => handleUpdateStatus(u.email, 'REJECTED')}
                                    title="Revoke Studio Access"
                                  >
                                    <XCircle size={13} />
                                    <span>Revoke</span>
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="user-standard-dashboard">
            <div className="user-guide-card">
              <div className="guide-header">
                <Cpu size={20} className="text-cyan" />
                <h3>About CodeStudio 26 Studio Privileges</h3>
              </div>
              <p>
                CodeStudio 26 requires explicit role permissions to manage server GPU and WebWorker
                resources responsibly. Only accounts approved by Administrator{' '}
                <strong>Salek Masud Parvez</strong> can render 1080p and 4K code animations.
              </p>
              <div className="guide-contact-box">
                <Mail size={16} className="text-blue" />
                <span>
                  For urgent review of access requests, contact Administrator directly at{' '}
                  <a href="mailto:smp23997@gmail.com">smp23997@gmail.com</a>.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* System & Hardware Health Bar */}
        <div className="system-telemetry-bar">
          <div className="telemetry-item">
            <span className="telemetry-dot dot-green" />
            <Database size={13} className="telemetry-icon" />
            <span className="telemetry-label">PostgreSQL 17.2:</span>
            <span className="telemetry-val">Accelerated Pool Online</span>
          </div>
          <div className="telemetry-item">
            <span className="telemetry-dot dot-green" />
            <ShieldCheck size={13} className="telemetry-icon" />
            <span className="telemetry-label">RBAC Security Policy:</span>
            <span className="telemetry-val">Enforced</span>
          </div>
          <div className="telemetry-item">
            <span className="telemetry-dot dot-green" />
            <Activity size={13} className="telemetry-icon" />
            <span className="telemetry-label">WebCodecs Hardware MP4:</span>
            <span className="telemetry-val">AVC1 / H.264 Ready</span>
          </div>
          <div className="telemetry-item">
            <span className="telemetry-label">Superadmin:</span>
            <span className="telemetry-val">Salek Masud Parvez</span>
          </div>
        </div>
      </div>

      {/* Interactive Access Request Modal */}
      {isRequestModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsRequestModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-row">
                <Sparkles size={20} className="text-cyan" />
                <h3>Request Studio Access • {selectedPlanForRequest} Pass</h3>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsRequestModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={submitAccessRequest} className="modal-form">
              <p className="modal-intro">
                Submit an official access request for the <strong>{selectedPlanForRequest} Pass</strong> to Administrator Salek Masud Parvez.
              </p>

              <div className="form-group">
                <label htmlFor="req-usecase">Primary Intended Use Case</label>
                <select
                  id="req-usecase"
                  className="form-input"
                  value={requestUseCase}
                  onChange={(e) => setRequestUseCase(e.target.value)}
                >
                  <option value="Computer Vision / AI / ML Visualization">Computer Vision / AI / ML Visualization</option>
                  <option value="Technical Education / YouTube / Documentation">Technical Education / YouTube / Documentation</option>
                  <option value="Academic Research Paper / Thesis Presentation">Academic Research Paper / Thesis Presentation</option>
                  <option value="Commercial Software Demonstration">Commercial Software Demonstration</option>
                  <option value="Open Source Deep Learning Community">Open Source Deep Learning Community</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="req-note">Project Details or Justification (Optional)</label>
                <textarea
                  id="req-note"
                  rows={3}
                  className="form-input textarea-input"
                  placeholder="Describe the neural architectures or code animations you plan to render..."
                  value={requestNote}
                  onChange={(e) => setRequestNote(e.target.value)}
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsRequestModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-submit-req"
                  disabled={isSubmittingRequest}
                >
                  <Send size={15} />
                  <span>{isSubmittingRequest ? 'Submitting to PostgreSQL...' : 'Submit Official Access Request'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
