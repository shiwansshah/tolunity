import React, { useEffect, useState } from 'react';
import { ShieldAlert, ShieldCheck, Mail, Phone, TriangleAlert } from 'lucide-react';
import { PageHeader, Card, Badge, Button } from '../components/UI';
import api from '../services/api';
import { getApiErrorMessage } from '../services/apiError';

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/admin/users');
      setUsers(response.data);
    } catch (error) {
      setError(getApiErrorMessage(error, 'Failed to load users'));
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
    } catch (error) {
      alert(getApiErrorMessage(error, 'Failed to update user status'));
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-muted">Loading user data...</div>;
  }

  return (
    <div className="fade-in">
      <PageHeader
        title="User Management"
        subtitle="View and manage system access for all registered users"
      />

      {error && <div className="error-banner">{error}</div>}

      <Card>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>User Details</th>
                <th>Type / Role</th>
                <th>Contact</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className={!user.activeFlg ? 'row-disabled' : ''}>
                  <td>
                    <div className="font-bold flex items-center gap-2">
                      {user.delFlg && <TriangleAlert size={14} color="red" />}
                      {user.name}
                    </div>
                  </td>
                  <td>
                    <div>
                      <Badge variant={user.userType === 'OWNER' ? 'primary' : 'gray'}>
                        {user.userType || 'N/A'}
                      </Badge>
                      <div className="text-sm text-muted mt-1">{user.role}</div>
                    </div>
                  </td>
                  <td>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 text-sm">
                        <Mail size={14} className="text-muted" />
                        {user.email}
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Phone size={14} className="text-muted" />
                        {user.phoneNumber}
                      </div>
                    </div>
                  </td>
                  <td>
                    <Badge variant={user.activeFlg ? 'success' : 'danger'}>
                      {user.activeFlg ? 'Active' : 'Locked'}
                    </Badge>
                  </td>
                  <td>
                    <Button
                      variant={user.activeFlg ? 'danger' : 'success'}
                      onClick={() => handleToggleStatus(user.id)}
                      disabled={user.role === 'ADMIN'}
                    >
                      {user.activeFlg ? (
                        <>
                          <ShieldAlert size={14} />
                          Lock Access
                        </>
                      ) : (
                        <>
                          <ShieldCheck size={14} />
                          Unlock
                        </>
                      )}
                    </Button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-muted">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default UsersPage;
