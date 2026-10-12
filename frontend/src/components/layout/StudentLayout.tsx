import React from 'react';
import { Outlet, NavLink, Link } from 'react-router-dom';
import { Navbar } from './Navbar';
import {
  LayoutDashboard,
  BookOpen,
  Search,
  History,
  User,
  HelpCircle,
  FileText,
} from 'lucide-react';

export const StudentLayout: React.FC = () => {
  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/study-notes', label: 'My Notes', icon: FileText },
    { to: '/courses', label: 'My Courses', icon: BookOpen },
    { to: '/search', label: 'Search', icon: Search },
    { to: '/recently-viewed', label: 'Recently Viewed', icon: History },
    { to: '/profile', label: 'Profile', icon: User },
    { to: '/support', label: 'Help / Support', icon: HelpCircle },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F8F6]">
      <Navbar />

      {/* Secondary Student Navigation Sub-bar */}
      <nav className="bg-white border-b border-neutral-200 hidden md:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 py-1.5 overflow-x-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                      isActive
                        ? 'bg-[#111111] text-[#FACC15] shadow-xs'
                        : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                    }`
                  }
                >
                  <Icon className="w-3.5 h-3.5" />
                  {item.label}
                </NavLink>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Student Footer */}
      <footer className="bg-white border-t border-neutral-200 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-500 gap-4">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-neutral-900">Notes Center</span>
            <span>—</span>
            <span>Your Notes. Your Preparation. Your Success.</span>
          </div>
          <div className="flex items-center space-x-6">
            <Link to="/support" className="hover:text-neutral-900 transition-colors">
              Support Center
            </Link>
            <span className="text-neutral-400 text-[11px]">
              Protected Educational Content • 24-Hour Active Session
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

