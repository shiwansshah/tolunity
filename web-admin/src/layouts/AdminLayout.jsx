import React, { useState } from 'react';
import clsx from 'clsx';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { Menu, X, LogOut, ChevronRight } from 'lucide-react';

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/users', label: 'Users' },
    { path: '/payments', label: 'Payments' },
    { path: '/visitors', label: 'Visitors' },
    { path: '/alerts', label: 'Alerts' },
    { path: '/fee-config', label: 'Fee Config' },
    { path: '/complaints', label: 'Complaints' },
    { path: '/charity', label: 'Charity' },
    { path: '/activity-log', label: 'Activity Log' },
    { path: '/about-tolunity', label: 'Mobile About' },
  ];

  const activeItem = navItems.find((item) => location.pathname.startsWith(item.path)) || navItems[0];

  const displayDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date());

  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Good morning' : currentHour < 17 ? 'Good afternoon' : 'Good evening';

  /* Breadcrumb segments */
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const breadcrumb = pathSegments.map((seg) => seg.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()));

  const SidebarContent = () => (
    <>
      {/* Brand */}
      <div className="flex items-center gap-2.5 border-b border-slate-200 px-4 py-3.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-slate-50">
          <img src="/logo.png" alt="TolUnity" className="h-5 w-5 object-contain" />
        </div>
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">TolUnity</div>
          <div className="text-[14px] font-semibold leading-tight text-slate-900">Admin</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2.5 py-3">
        <div className="flex flex-col gap-0.5">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                clsx(
                  'flex items-center rounded-md px-2.5 py-[7px] text-[13px] font-medium transition-colors',
                  isActive
                    ? 'border-l-2 border-slate-900 bg-slate-50 pl-2 text-slate-900'
                    : 'border-l-2 border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Account */}
      <div className="border-t border-slate-200 px-3 py-3">
        <div className="mb-2 flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-900 text-[11px] font-semibold text-white">
            {(user?.name || 'A').charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-medium text-slate-800">{user?.name || 'Administrator'}</div>
            <div className="text-[11px] text-slate-400">Admin</div>
          </div>
        </div>
        <button
          className="flex w-full items-center justify-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-medium text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
          onClick={handleLogout}
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign out
        </button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-slate-100 text-[13px] text-slate-700">
      {/* ── Mobile overlay ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar (desktop: static, mobile: slide-in) ── */}
      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-50 flex w-[220px] flex-col border-r border-slate-200 bg-white transition-transform duration-200 md:static md:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <SidebarContent />
      </aside>

      {/* ── Main ── */}
      <main className="min-w-0 flex-1">
        {/* Header */}
        <header className="border-b border-slate-200 bg-white">
          <div className="flex items-center gap-3 px-4 py-3 sm:px-5">
            {/* Hamburger (mobile only) */}
            <button
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-500 md:hidden"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-4 w-4" />
            </button>

            {/* Left: breadcrumb + title */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1 text-[11px] text-slate-400">
                <span>Admin</span>
                {breadcrumb.map((seg, idx) => (
                  <React.Fragment key={idx}>
                    <ChevronRight className="h-3 w-3 text-slate-300" />
                    <span className={idx === breadcrumb.length - 1 ? 'text-slate-600 font-medium' : ''}>
                      {seg}
                    </span>
                  </React.Fragment>
                ))}
              </div>
              <h1 className="mt-0.5 text-[16px] font-semibold tracking-[-0.01em] text-slate-900 leading-tight">
                {activeItem.label}
              </h1>
            </div>

            {/* Right: meta */}
            <div className="hidden items-center gap-3 sm:flex">
              <div className="text-right">
                <div className="text-[11px] text-slate-400">{displayDate}</div>
                <div className="text-[12px] font-medium text-slate-600">
                  {greeting}, {(user?.name || 'Admin').split(' ')[0]}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="overflow-auto p-3 sm:p-4 lg:p-5">
          <div className="mx-auto max-w-[1320px]">
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <Outlet />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
