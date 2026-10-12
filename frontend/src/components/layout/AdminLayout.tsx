import React, { useState } from 'react';
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Logo } from '../common/Logo';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  FileText,
  KeyRound,
  Laptop,
  CreditCard,
  Package,
  Megaphone,
  Share2,
  Settings,
  ClipboardList,
  ExternalLink,
  LogOut,
  Menu,
  X,
  Shield,
} from 'lucide-react';

interface MenuItem {
  to: string;
  label: string;
  icon: any;
  end?: boolean;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

export const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const menuSections: MenuSection[] = isSuperAdmin
    ? [
        {
          title: 'OVERVIEW',
          items: [
            { to: '/admin', end: true, label: 'Dashboard', icon: LayoutDashboard },
          ],
        },
        {
          title: 'USERS & ACCESS',
          items: [
            { to: '/admin/users', label: 'Users & Admins', icon: Users },
            { to: '/admin/access', label: 'Access Control', icon: KeyRound },
            { to: '/admin/sessions', label: 'Active Sessions', icon: Laptop },
          ],
        },
        {
          title: 'CURRICULUM & CONTENT',
          items: [
            { to: '/admin/courses', label: 'Courses & Hierarchy', icon: BookOpen },
            { to: '/admin/notes', label: 'Educational Notes', icon: FileText },
          ],
        },
        {
          title: 'FINANCE & COMMERCE',
          items: [
            { to: '/admin/payments', label: 'Payments / Purchases', icon: CreditCard },
            { to: '/admin/packages', label: 'Packages', icon: Package },
          ],
        },
        {
          title: 'SYSTEM & ENGAGEMENT',
          items: [
            { to: '/admin/announcements', label: 'Announcements', icon: Megaphone },
            { to: '/admin/social-links', label: 'Social Links', icon: Share2 },
            { to: '/admin/activity-logs', label: 'Activity Logs', icon: ClipboardList },
            { to: '/admin/settings', label: 'System Settings', icon: Settings },
          ],
        },
      ]
    : [
        {
          title: 'OVERVIEW',
          items: [
            { to: '/admin', end: true, label: 'Dashboard', icon: LayoutDashboard },
          ],
        },
        {
          title: 'STUDENTS MANAGEMENT',
          items: [
            { to: '/admin/users', label: 'My Students', icon: Users },
          ],
        },
        {
          title: 'CURRICULUM & CONTENT',
          items: [
            { to: '/admin/courses', label: 'My Courses', icon: BookOpen },
            { to: '/admin/notes', label: 'Educational Notes', icon: FileText },
          ],
        },
      ];

  return (
    <div className="min-h-screen flex bg-[#F8F8F6]">
      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Admin Sidebar - Clean White Design */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-neutral-200 text-neutral-800 flex flex-col transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-0 -translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-neutral-200 bg-white">
          <Link to="/admin" className="flex items-center">
            <Logo variant="full" size="sm" theme="light" />
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1 rounded-md text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Admin Role Pill */}
        <div className="px-5 py-3 bg-[#FBFBFA] border-b border-neutral-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[#FACC15] flex items-center justify-center text-neutral-950">
              <Shield className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-semibold text-neutral-800">
              {user?.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Academic Admin'}
            </span>
          </div>
          <span className="text-[10px] font-mono text-neutral-400">@{user?.username}</span>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {menuSections.map((section) => (
            <div key={section.title}>
              <div className="px-3 mb-1.5 text-[10px] font-bold tracking-wider text-neutral-400 uppercase font-mono">
                {section.title}
              </div>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      onClick={() => setSidebarOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-xl transition-all ${
                          isActive
                            ? 'bg-[#FACC15] text-neutral-950 font-bold shadow-xs'
                            : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                        }`
                      }
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <span>{item.label}</span>
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Sidebar Footer Controls */}
        <div className="p-3 border-t border-neutral-200 bg-white space-y-1">
          <Link
            to="/dashboard"
            className="flex items-center justify-between px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-100 rounded-xl transition-colors"
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5 text-neutral-500" />
              Student Portal
            </span>
            <span className="text-[10px] bg-neutral-100 px-1.5 py-0.5 rounded text-neutral-500 font-medium">
              View
            </span>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors text-left"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Admin Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-neutral-200 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 rounded-lg text-neutral-700 hover:bg-neutral-100 lg:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-sm font-bold text-neutral-900 tracking-tight flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-neutral-100 text-neutral-700 text-xs font-mono">
                ADMIN CONSOLE
              </span>
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <Link
              to="/dashboard"
              className="text-xs font-semibold text-neutral-700 hover:text-black flex items-center gap-1.5 px-3 py-1.5 rounded-md hover:bg-neutral-100 transition-colors border border-neutral-200"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              View Student View
            </Link>
            <div className="h-4 w-px bg-neutral-200" />
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-[#111111] text-[#FACC15] flex items-center justify-center font-bold text-xs">
                {user?.fullName.charAt(0).toUpperCase()}
              </div>
              <span className="text-xs font-bold text-neutral-900 hidden sm:inline">
                {user?.fullName}
              </span>
            </div>
          </div>
        </header>

        {/* Admin Content Route */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
