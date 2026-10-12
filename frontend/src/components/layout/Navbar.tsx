import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Logo } from '../common/Logo';
import {
  LogOut,
  User as UserIcon,
  Search,
  Shield,
  Smartphone,
  Menu,
  X,
  Clock,
  HelpCircle,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const activeSessionsCount = user?.sessions?.length || 1;

  // Format expiry date
  const formatExpiry = (expiry: string | null | undefined) => {
    if (!expiry) return 'Unlimited Access';
    const date = new Date(expiry);
    const now = new Date();
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return 'Access Expired';
    if (diffDays === 0) return 'Expires Today';
    return `${diffDays} days left (${date.toLocaleDateString()})`;
  };

  return (
    <header className="bg-white border-b border-neutral-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link to={isAdmin ? "/admin" : "/dashboard"} className="flex items-center">
            <Logo variant="full" size="md" />
          </Link>

          {/* Desktop Central Quick Search */}
          {user && (
            <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
              <div
                onClick={() => navigate('/search')}
                className="w-full flex items-center px-3.5 py-2 text-sm text-neutral-400 bg-neutral-100 hover:bg-neutral-200/80 rounded-lg cursor-pointer border border-neutral-200 transition-colors"
              >
                <Search className="w-4 h-4 mr-2.5 text-neutral-500" />
                <span>Search courses, subjects, or notes...</span>
                <kbd className="ml-auto text-xs font-mono bg-white px-1.5 py-0.5 rounded border border-neutral-300 text-neutral-600">
                  /
                </kbd>
              </div>
            </div>
          )}

          {/* User Controls & Navigation */}
          {user ? (
            <div className="hidden md:flex items-center gap-4">
              {/* Admin Portal Switch */}
              {isAdmin && (
                <Link
                  to="/admin"
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#111111] bg-[#FACC15] hover:bg-[#EAB308] rounded-lg transition-colors shadow-xs"
                >
                  <Shield className="w-3.5 h-3.5" />
                  Admin Panel
                </Link>
              )}

              {/* Active Devices Indicator */}
              <div
                title={`Allowed devices: ${user.maxDevices}`}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-neutral-600 bg-neutral-100 rounded-md border border-neutral-200"
              >
                <Smartphone className="w-3.5 h-3.5 text-neutral-500" />
                <span>Device Limit: {user.maxDevices}</span>
              </div>

              {/* User Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-neutral-100 transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-full bg-neutral-900 text-white font-bold text-xs flex items-center justify-center border border-neutral-800">
                    {user.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div className="hidden lg:block">
                    <div className="text-xs font-bold text-neutral-900 leading-tight">
                      {user.fullName}
                    </div>
                    <div className="text-[10px] text-neutral-500 font-mono">@{user.username}</div>
                  </div>
                </button>

                {userDropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-neutral-200 py-2 z-40"
                    onMouseLeave={() => setUserDropdownOpen(false)}
                  >
                    <div className="px-4 py-2 border-b border-neutral-100">
                      <p className="text-xs font-bold text-neutral-900">{user.fullName}</p>
                      <p className="text-[11px] text-neutral-500">@{user.username}</p>
                      <div className="mt-2 flex items-center gap-1 text-[11px] text-neutral-600 bg-amber-50 px-2 py-1 rounded border border-amber-200">
                        <Clock className="w-3 h-3 text-amber-700" />
                        <span className="font-medium text-amber-900 truncate">
                          {formatExpiry(user.accessExpiry)}
                        </span>
                      </div>
                    </div>

                    <Link
                      to="/profile"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-100"
                    >
                      <UserIcon className="w-4 h-4 text-neutral-500" />
                      My Account & Devices
                    </Link>

                    <Link
                      to="/support"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-100"
                    >
                      <HelpCircle className="w-4 h-4 text-neutral-500" />
                      Help & Support
                    </Link>

                    <div className="border-t border-neutral-100 my-1" />

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-50 text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="px-4 py-2 text-xs font-bold text-black bg-[#FACC15] hover:bg-[#EAB308] rounded-lg transition-colors"
              >
                Student Login
              </Link>
            </div>
          )}

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-neutral-700 hover:bg-neutral-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6 text-neutral-900" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-neutral-200 bg-white px-4 pt-3 pb-5 space-y-3">
          {user ? (
            <>
              <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                <div className="font-bold text-sm text-neutral-900">{user.fullName}</div>
                <div className="text-xs text-neutral-500">@{user.username}</div>
                <div className="mt-2 text-xs text-neutral-600">
                  Access: {formatExpiry(user.accessExpiry)}
                </div>
              </div>

              <div className="flex flex-col space-y-2">
                <Link
                  to="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-100 rounded-lg"
                >
                  Dashboard
                </Link>
                <Link
                  to="/courses"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-100 rounded-lg"
                >
                  My Courses
                </Link>
                <Link
                  to="/search"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-100 rounded-lg"
                >
                  Search Notes
                </Link>
                <Link
                  to="/recently-viewed"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-100 rounded-lg"
                >
                  Recently Viewed
                </Link>
                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-100 rounded-lg"
                >
                  Profile & Sessions
                </Link>
                <Link
                  to="/support"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-100 rounded-lg"
                >
                  Help & Support
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-3 py-2 text-sm font-bold text-black bg-[#FACC15] hover:bg-[#EAB308] rounded-lg"
                  >
                    Switch to Admin Panel
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg"
                >
                  Sign Out
                </button>
              </div>
            </>
          ) : (
            <Link
              to="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-center py-2.5 font-bold text-black bg-[#FACC15] rounded-lg"
            >
              Student Login
            </Link>
          )}
        </div>
      )}
    </header>
  );
};

