import React, { useState, useEffect, useCallback } from 'react';
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
  const { user, isAdmin, isPermitted, logout, refreshUser } = useAuth();
  const [usersList, setUsersList] = useState<User[]>([]);
  const [stats, setStats] = useState<StatsData>({
    totalUsers: 1,
    approvedUsers: 1,
    pendingUsers: 0,
    adminUsers: 1,
  });
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

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

  const handleUpdateStatus = async (email: string, newStatus: 'APPROVED' | 'REJECTED' | 'PENDING') => {
    try {
      const res = await fetch('/api/admin/users/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, status: newStatus }),
      });

      if (res.ok) {
        setActionMessage({
          text: `User ${email} status updated to ${newStatus}`,
          type: 'success',
        });
        await fetchUsersAndStats();
        if (user?.email?.toLowerCase() === email.toLowerCase()) {
          await refreshUser();
        }
      } else {
        const err = await res.json();
        setActionMessage({ text: err.error || 'Failed to update status', type: 'error' });
      }
    } catch (err: any) {
      setActionMessage({ text: err.message || 'Network error', type: 'error' });
    }
    setTimeout(() => setActionMessage(null), 3500);
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
        setActionMessage({ text: err.error || 'Failed to update role', type: 'error' });
      }
    } catch (err: any) {
      setActionMessage({ text: err.message || 'Network error', type: 'error' });
    }
    setTimeout(() => setActionMessage(null), 3500);
  };

  return (
    <div className="dashboard-page-root">
      <div className="dashboard-container">
        {/* Dashboard Header */}
        <div className="dashboard-header-row">
          <div>
            <h1 className="dashboard-title">Platform Dashboard</h1>
            <p className="dashboard-subtitle">
              Role-Based Access Control (RBAC) & User Management
            </p>
          </div>

          <div className="dashboard-header-actions">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={fetchUsersAndStats}
              title="Refresh database"
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
            >
              <LogOut size={14} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {actionMessage && (
          <div className={`action-alert alert-${actionMessage.type}`}>
            {actionMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
            <span>{actionMessage.text}</span>
          </div>
        )}

        {/* User Profile & Studio Status Card */}
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
                <h2>{user?.name || 'Authorized User'}</h2>
                <span className={`role-badge ${isAdmin ? 'role-admin' : 'role-user'}`}>
                  {isAdmin ? <ShieldCheck size={12} /> : <Shield size={12} />}
                  {user?.role}
                </span>
                <span className={`status-badge status-${user?.status.toLowerCase()}`}>
                  {user?.status}
                </span>
              </div>
              <div className="profile-email-row">
                <Mail size={14} className="text-muted" />
                <span>{user?.email}</span>
                <span className="dot-divider">•</span>
                <span className="profile-id-tag">ID: {user?.id}</span>
              </div>
            </div>
          </div>

          <div className="profile-studio-gate">
            {isPermitted ? (
              <div className="studio-access-granted-box">
                <div className="granted-status-pill">
                  <CheckCircle2 size={16} className="text-emerald" />
                  <span>Studio Permission: <strong>APPROVED</strong></span>
                </div>
                <button
                  type="button"
                  className="btn btn-primary btn-launch-studio"
                  onClick={() => onNavigate('studio')}
                >
                  <Video size={16} />
                  <span>Launch Studio Workspace</span>
                </button>
              </div>
            ) : (
              <div className="studio-access-pending-box">
                <div className="pending-status-pill">
                  <Clock size={16} className="text-orange" />
                  <span>Studio Permission: <strong>PENDING APPROVAL</strong></span>
                </div>
                <p className="pending-help-text">
                  Your studio video generation access is pending review by administrator{' '}
                  <strong>Salek Masud Parvez</strong> (<code>sakekmasudparvez@gmail.com</code>).
                </p>
                <div className="pending-actions">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => onNavigate('login')}
                  >
                    Switch to Admin Account
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Admin RBAC Console (Visible to ADMIN) */}
        {isAdmin ? (
          <div className="admin-console-section">
            <div className="admin-section-header">
              <div className="admin-section-title">
                <ShieldCheck size={20} className="text-amber" />
                <h2>Admin RBAC & User Access Console</h2>
              </div>
              <span className="admin-badge">Admin Privileges Active</span>
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

              <div className="stat-card">
                <div className="stat-card-label">Pending Requests</div>
                <div className="stat-card-value text-orange">{stats.pendingUsers}</div>
                <div className="stat-card-footer">Awaiting Administrator Review</div>
              </div>

              <div className="stat-card">
                <div className="stat-card-label">Admin Accounts</div>
                <div className="stat-card-value text-amber">{stats.adminUsers}</div>
                <div className="stat-card-footer">Platform Superusers</div>
              </div>
            </div>

            {/* User Access Management Table */}
            <div className="user-table-wrapper">
              <div className="table-header-bar">
                <h3>Registered Users & Access Permissions</h3>
                <span className="user-count-tag">{usersList.length} Accounts Found</span>
              </div>

              <div className="table-scroll-container">
                <table className="user-table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Registered</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersList.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-6 text-muted">
                          No users registered in database yet.
                        </td>
                      </tr>
                    ) : (
                      usersList.map((u) => {
                        const isTargetAdmin = u.email.toLowerCase() === 'sakekmasudparvez@gmail.com';
                        return (
                          <tr key={u.id} className={u.email === user?.email ? 'current-user-row' : ''}>
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
                              </div>
                            </td>
                            <td>
                              <code className="table-email">{u.email}</code>
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
                                    title="Approve studio access"
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
                                    title="Revoke studio access"
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
              <h3>About CodeStudio 26 Studio Privileges</h3>
              <p>
                CodeStudio 26 requires explicit role permissions to manage server and GPU
                resources responsibly. Only accounts approved by Administrator{' '}
                <strong>Salek Masud Parvez</strong> can render 1080p and 4K code animations.
              </p>
              <div className="guide-contact-box">
                <Mail size={16} className="text-blue" />
                <span>
                  For immediate access review, contact{' '}
                  <a href="mailto:sakekmasudparvez@gmail.com">sakekmasudparvez@gmail.com</a>.
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
