import React from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { CalendarDays, CreditCard, Flag, Heart, Info, LayoutDashboard, LogOut, QrCode, ScrollText, Settings, TriangleAlert, Users } from 'lucide-react';
import { useAuth } from '../context/useAuth';
import './AdminLayout.css';

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/users', icon: Users, label: 'User Management' },
    { path: '/payments', icon: CreditCard, label: 'Community Payments' },
    { path: '/visitors', icon: QrCode, label: 'Visitors Log' },
    { path: '/alerts', icon: TriangleAlert, label: 'Emergency Alerts' },
    { path: '/fee-config', icon: Settings, label: 'Fee Configuration' },
    { path: '/complaints', icon: Flag, label: 'Complaints' },
    { path: '/charity', icon: Heart, label: 'Charity Fund' },
    { path: '/activity-log', icon: ScrollText, label: 'Activity Log' },
    { path: '/about-tolunity', icon: Info, label: 'Mobile About' },
  ];

  const activeItem = navItems.find((item) => location.pathname.startsWith(item.path)) || navItems[0];
  const displayDate = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date());
  const initials = user?.name
    ?.split(' ')
    .map((segment) => segment.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'AD';

  return (
    <div className="admin-container">
      <aside className="sidebar glass-panel">
        <div className="sidebar-header">
          <img src="/logo.png" alt="TolUnity" className="brand-logo" />
          <div>
            <p className="brand-kicker">TolUnity</p>
            <h2>Admin Console</h2>
          </div>
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
            <div className="avatar">{initials}</div>
            <div className="user-info">
              <p className="name">{user?.name}</p>
              <p className="role">Administrator Session</p>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar glass-panel">
          <div className="topbar-main">
            <p className="topbar-kicker">Operations / {activeItem.label}</p>
            <div className="topbar-title-row">
              <h1>{activeItem.label}</h1>
              <span className="topbar-divider" />
              <p className="topbar-user">Signed in as {user?.name}</p>
            </div>
          </div>
          <div className="topbar-meta">
            <CalendarDays size={16} />
            <span>{displayDate}</span>
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
