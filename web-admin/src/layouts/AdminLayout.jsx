import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, CreditCard, LogOut, Shield, Settings, Heart, Flag, ScrollText } from 'lucide-react';
import { useAuth } from '../context/useAuth';
import './AdminLayout.css';

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/users', icon: Users, label: 'User Management' },
    { path: '/payments', icon: CreditCard, label: 'Community Payments' },
    { path: '/fee-config', icon: Settings, label: 'Fee Configuration' },
    { path: '/complaints', icon: Flag, label: 'Complaints' },
    { path: '/charity', icon: Heart, label: 'Charity Fund' },
    { path: '/activity-log', icon: ScrollText, label: 'Activity Log' },
  ];

  return (
    <div className="admin-container">
      {/* Sidebar */}
      <aside className="sidebar glass-panel">
        <div className="sidebar-header">
          <Shield className="logo-icon" size={32} />
          <h2>TolUnity Admin</h2>
        </div>
        
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="avatar">{user?.name?.charAt(0) || 'A'}</div>
            <div className="user-info">
              <p className="name">{user?.name}</p>
              <p className="role">Administrator</p>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <header className="topbar glass-panel">
          <div className="breadcrumb">
             <span className="text-muted">Welcome back, </span>
             <strong>{user?.name}</strong>
          </div>
        </header>
        
        <div className="content-wrapper fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
