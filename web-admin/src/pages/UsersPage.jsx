import React, { useEffect, useMemo, useState } from 'react';
import { Download, Filter, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  Badge,
  Banner,
  Button,
  Field,
  PageHeader,
  ToolbarIconButton,
  inputClass,
  tableCellClass,
  tableHeaderClass,
} from '../components/UI';
import api from '../services/api';
import { getApiErrorMessage } from '../services/apiError';

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [banner, setBanner] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [showFilters, setShowFilters] = useState(false);
  const [passwordUser, setPasswordUser] = useState(null);
  const [passwordForm, setPasswordForm] = useState({ newPassword: '', confirmPassword: '' });
  const [passwordError, setPasswordError] = useState(null);
  const [resettingPassword, setResettingPassword] = useState(false);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/admin/users');
      setUsers(Array.isArray(response.data) ? response.data : []);
      setError(null);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Failed to load users'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleStatus = async (id) => {
    try {
      await api.put(`/admin/users/${id}/status`);
      setUsers((currentUsers) =>
        currentUsers.map((user) =>
          user.id === id ? { ...user, activeFlg: !user.activeFlg } : user
        )
      );
      setBanner({ tone: 'success', text: 'User status updated.' });
    } catch (requestError) {
      setBanner({
        tone: 'error',
        text: getApiErrorMessage(requestError, 'Failed to update user status'),
      });
    }
  };

  const isResettableUser = (user) =>
    user.role !== 'ADMIN' && ['OWNER', 'TENANT', 'SECURITY'].includes(user.userType || '');

  const openPasswordModal = (user) => {
    setPasswordUser(user);
    setPasswordForm({ newPassword: '', confirmPassword: '' });
    setPasswordError(null);
  };

  const closePasswordModal = (force = false) => {
    if (resettingPassword && !force) {
      return;
    }

    setPasswordUser(null);
    setPasswordForm({ newPassword: '', confirmPassword: '' });
    setPasswordError(null);
  };

  const handlePasswordFieldChange = (field, value) => {
    setPasswordForm((current) => ({ ...current, [field]: value }));
    if (passwordError) {
      setPasswordError(null);
    }
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();

    const newPassword = passwordForm.newPassword.trim();
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }

    if (newPassword !== passwordForm.confirmPassword.trim()) {
      setPasswordError('Passwords do not match.');
      return;
    }

    if (!passwordUser) {
      return;
    }

    try {
      setResettingPassword(true);
      await api.put(`/admin/users/${passwordUser.id}/password`, { newPassword });
      setBanner({
        tone: 'success',
        text: `Password reset for ${passwordUser.name || passwordUser.email}.`,
      });
      closePasswordModal(true);
    } catch (requestError) {
      setPasswordError(getApiErrorMessage(requestError, 'Failed to reset user password'));
    } finally {
      setResettingPassword(false);
    }
  };

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return users.filter((user) => {
      const typeMatch = typeFilter === 'ALL' || (user.userType || 'UNKNOWN') === typeFilter;
      const statusMatch =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' ? Boolean(user.activeFlg) : !user.activeFlg);
      const queryMatch =
        !query ||
        [user.name, user.email, user.phoneNumber, user.role]
          .some((value) => value?.toLowerCase().includes(query));
      return typeMatch && statusMatch && queryMatch;
    });
  }, [users, search, statusFilter, typeFilter]);

  const exportCSV = () => {
    const header = 'Name,Email,Phone,Type,Role,Status,Deleted';
    const lines = filteredUsers.map((user) =>
      [
        `"${user.name || ''}"`,
        `"${user.email || ''}"`,
        `"${user.phoneNumber || ''}"`,
        user.userType || '',
        user.role || '',
        user.activeFlg ? 'Active' : 'Locked',
        user.delFlg ? 'Yes' : 'No',
      ].join(',')
    );
    const blob = new Blob([[header, ...lines].join('\n')], { type: 'text/csv' });
    const link = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(blob),
      download: 'users.csv',
    });
    link.click();
    URL.revokeObjectURL(link.href);
  };

  if (loading) {
    return <div className="px-3 py-4 text-[13px] text-slate-500">Loading user data...</div>;
  }

  return (
    <div className="text-[13px]">
      <PageHeader
        eyebrow="Accounts"
        title="User Management"
        subtitle="Search, filter, export, and lock registered user accounts."
        actions={
          <Link to="/manual-user-registration">
            <Button variant="secondary">Manual Registration</Button>
          </Link>
        }
      />

      {error && <Banner>{error}</Banner>}
      {banner && <Banner tone={banner.tone}>{banner.text}</Banner>}

      <div className="grid border-b border-slate-200 md:grid-cols-3">
        {[
          ['Total Users', users.length],
          ['Active', users.filter((user) => user.activeFlg).length],
          ['Locked', users.filter((user) => !user.activeFlg).length],
        ].map(([label, value], index, rows) => (
          <div
            key={label}
            className={
              index < rows.length - 1
                ? 'border-b border-slate-200 px-5 py-4 md:border-b-0 md:border-r'
                : 'px-5 py-4'
            }
          >
            <div className="text-[11px] uppercase tracking-widest text-slate-500">{label}</div>
            <div className="mt-0.5 font-mono text-[13px] text-slate-900">{value}</div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-4">
        <div className="w-full max-w-xs">
          <input
            className={inputClass}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name, email, phone, or role"
          />
        </div>
        <div className="ml-auto flex items-center gap-1">
          <ToolbarIconButton title="Filter" onClick={() => setShowFilters((current) => !current)} active={showFilters}>
            <Filter className="h-4 w-4 stroke-[1.5]" />
          </ToolbarIconButton>
          <ToolbarIconButton title="Export" onClick={exportCSV}>
            <Download className="h-4 w-4 stroke-[1.5]" />
          </ToolbarIconButton>
          <ToolbarIconButton title="Refresh" onClick={fetchUsers}>
            <RefreshCw className="h-4 w-4 stroke-[1.5]" />
          </ToolbarIconButton>
        </div>
      </div>

      {showFilters && (
        <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 md:flex-row md:items-end">
          <div className="w-full md:w-48">
            <div className="mb-1 text-[11px] uppercase tracking-widest text-slate-500">Status</div>
            <select className={inputClass} value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="ALL">All</option>
              <option value="ACTIVE">Active</option>
              <option value="LOCKED">Locked</option>
            </select>
          </div>
          <div className="w-full md:w-48">
            <div className="mb-1 text-[11px] uppercase tracking-widest text-slate-500">Type</div>
            <select className={inputClass} value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
              <option value="ALL">All</option>
              <option value="OWNER">OWNER</option>
              <option value="TENANT">TENANT</option>
              <option value="SECURITY">SECURITY</option>
              <option value="UNKNOWN">UNKNOWN</option>
            </select>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className={tableHeaderClass}>User</th>
              <th className={tableHeaderClass}>Type</th>
              <th className={tableHeaderClass}>Role</th>
              <th className={tableHeaderClass}>Email</th>
              <th className={tableHeaderClass}>Phone</th>
              <th className={tableHeaderClass}>Status</th>
              <th className={tableHeaderClass}>Flags</th>
              <th className={tableHeaderClass}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id}>
                <td className={tableCellClass}>
                  <div className="font-semibold text-slate-900">{user.name}</div>
                  <div className="font-mono text-[12px] text-slate-500">#{user.id}</div>
                </td>
                <td className={tableCellClass}>
                  <Badge
                    variant={
                      user.userType === 'OWNER'
                        ? 'blue'
                        : user.userType === 'SECURITY'
                          ? 'amber'
                          : 'slate'
                    }
                  >
                    {user.userType || 'N/A'}
                  </Badge>
                </td>
                <td className={tableCellClass}>{user.role || 'N/A'}</td>
                <td className={`${tableCellClass} font-mono text-[12px]`}>{user.email || '-'}</td>
                <td className={`${tableCellClass} font-mono text-[12px]`}>{user.phoneNumber || '-'}</td>
                <td className={tableCellClass}>
                  <Badge variant={user.activeFlg ? 'green' : 'red'}>
                    {user.activeFlg ? 'ACTIVE' : 'LOCKED'}
                  </Badge>
                </td>
                <td className={tableCellClass}>{user.delFlg ? 'Deleted flag' : '-'}</td>
                <td className={tableCellClass}>
                  <div className="flex min-w-32 flex-col gap-2">
                    <Button
                      variant={user.activeFlg ? 'danger' : 'success'}
                      onClick={() => handleToggleStatus(user.id)}
                      disabled={user.role === 'ADMIN'}
                    >
                      {user.activeFlg ? 'Lock Access' : 'Unlock'}
                    </Button>
                    {isResettableUser(user) && (
                      <Button variant="secondary" onClick={() => openPasswordModal(user)}>
                        Reset Password
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filteredUsers.length === 0 && (
              <tr>
                <td colSpan="8" className="px-3 py-8 text-center text-[13px] text-slate-500">
                  No users match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {passwordUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-6"
          onClick={closePasswordModal}
        >
          <div
            className="w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="border-b border-slate-200 px-5 py-4">
              <div className="text-[11px] uppercase tracking-[0.12em] text-slate-400">Admin Reset</div>
              <h3 className="mt-0.5 text-[16px] font-semibold text-slate-900">Reset User Password</h3>
              <p className="mt-1 text-[13px] text-slate-500">
                Set a new password for {passwordUser.name || passwordUser.email}. Their previous password is not required.
              </p>
            </div>

            <form className="space-y-4 px-5 py-4" onSubmit={handleResetPassword}>
              {passwordError && (
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">
                  {passwordError}
                </div>
              )}

              <Field label="New Password">
                <input
                  className={inputClass}
                  type="password"
                  autoComplete="new-password"
                  value={passwordForm.newPassword}
                  onChange={(event) => handlePasswordFieldChange('newPassword', event.target.value)}
                  placeholder="Enter a new password"
                />
              </Field>

              <Field label="Confirm Password">
                <input
                  className={inputClass}
                  type="password"
                  autoComplete="new-password"
                  value={passwordForm.confirmPassword}
                  onChange={(event) => handlePasswordFieldChange('confirmPassword', event.target.value)}
                  placeholder="Re-enter the new password"
                />
              </Field>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <Button type="button" variant="secondary" onClick={closePasswordModal} disabled={resettingPassword}>
                  Cancel
                </Button>
                <Button type="submit" isLoading={resettingPassword}>
                  Save Password
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;
