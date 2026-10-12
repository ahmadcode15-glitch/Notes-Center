import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';
import {
  User,
  Smartphone,
  Shield,
  KeyRound,
  Clock,
  Laptop,
  CheckCircle2,
  Calendar,
  Lock,
} from 'lucide-react';
import { Badge } from '../../components/common/Badge';

export const StudentProfilePage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const { success, error } = useToast();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const [detailedUser, setDetailedUser] = useState<any>(null);

  useEffect(() => {
    api.auth.me().then((res) => {
      if (res.success) setDetailedUser(res.user);
    }).catch(() => {});
  }, []);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      error('New passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      error('New password must be at least 6 characters.');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const res = await api.auth.changePassword({ currentPassword, newPassword });
      if (res.success) {
        success('Password updated successfully.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err: any) {
      error(err.message || 'Failed to update password.');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const sessions = detailedUser?.sessions || user?.sessions || [];
  const userAccess = detailedUser?.userAccess || [];

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="border-b border-neutral-200 pb-5">
        <h1 className="text-2xl font-black text-neutral-900 tracking-tight">Account & Active Sessions</h1>
        <p className="text-xs sm:text-sm text-neutral-500 mt-1">
          Review your enrolled subscriptions, security settings, and authorized devices.
        </p>
      </div>

      {/* Profile Overview Card */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[#111111] text-[#FACC15] flex items-center justify-center font-black text-2xl border border-neutral-800">
              {user?.fullName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-neutral-900">{user?.fullName}</h2>
                <Badge variant={user?.status === 'ACTIVE' ? 'active' : 'expired'}>
                  {user?.status}
                </Badge>
              </div>
              <div className="text-xs font-mono text-neutral-500 mt-0.5">@{user?.username}</div>
              <div className="text-xs text-neutral-500 mt-1">
                Account Role: <span className="font-semibold text-neutral-800">{user?.role}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3 Detail Metric Blocks */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 pt-6 border-t border-neutral-100">
          <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200/70">
            <div className="text-xs text-neutral-500 flex items-center gap-1.5 font-medium">
              <Clock className="w-3.5 h-3.5 text-neutral-400" />
              <span>Access Expiry Date</span>
            </div>
            <div className="mt-1 text-sm font-bold text-neutral-900">
              {user?.accessExpiry
                ? new Date(user.accessExpiry).toLocaleDateString()
                : 'Unlimited Access'}
            </div>
          </div>

          <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200/70">
            <div className="text-xs text-neutral-500 flex items-center gap-1.5 font-medium">
              <Smartphone className="w-3.5 h-3.5 text-neutral-400" />
              <span>Allowed Devices</span>
            </div>
            <div className="mt-1 text-sm font-bold text-neutral-900">
              {user?.maxDevices} {user?.maxDevices === 1 ? 'Device' : 'Devices'} Maximum
            </div>
          </div>

          <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200/70">
            <div className="text-xs text-neutral-500 flex items-center gap-1.5 font-medium">
              <Calendar className="w-3.5 h-3.5 text-neutral-400" />
              <span>Account Created</span>
            </div>
            <div className="mt-1 text-sm font-bold text-neutral-900">
              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
            </div>
          </div>
        </div>
      </div>

      {/* Active Enrolled Grants */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-xs">
        <h3 className="text-base font-bold text-neutral-900 mb-1 flex items-center gap-2">
          <Shield className="w-4 h-4 text-[#FACC15]" />
          <span>Active Course & Module Access</span>
        </h3>
        <p className="text-xs text-neutral-500 mb-4">
          Direct educational permissions assigned to your student profile by the administrator.
        </p>

        {userAccess.length > 0 ? (
          <div className="space-y-2">
            {userAccess.map((grant: any) => (
              <div
                key={grant.id}
                className="p-3 bg-neutral-50 rounded-xl border border-neutral-200/70 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold text-neutral-900">
                    {grant.course?.title || grant.subject?.title || grant.note?.title || 'Educational Content'}
                  </div>
                  <div className="text-neutral-500 text-[11px] font-mono mt-0.5">
                    Type: {grant.accessType} • Granted: {new Date(grant.startDate).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant="active">Active</Badge>
                  <div className="text-[11px] text-neutral-500 mt-1">
                    Expires: {new Date(grant.expiryDate).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 bg-neutral-50 rounded-xl text-center text-xs text-neutral-500">
            No specific custom grants attached. Full access governed by global program status.
          </div>
        )}
      </div>

      {/* Active Devices / Sessions (#7 requirement) */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-xs">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-base font-bold text-neutral-900 flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-neutral-700" />
            <span>Active Authorized Devices ({sessions.length}/{user?.maxDevices})</span>
          </h3>
        </div>
        <p className="text-xs text-neutral-500 mb-4">
          Live device sessions active on your account. Sessions remain valid for up to 24 hours.
        </p>

        <div className="space-y-2">
          {sessions.map((s: any) => (
            <div
              key={s.id}
              className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200/70 flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-3">
                <Laptop className="w-4 h-4 text-neutral-500" />
                <div>
                  <div className="font-bold text-neutral-800">{s.deviceName}</div>
                  <div className="text-[11px] text-neutral-500 font-mono">
                    IP: {s.ipAddress} • Last Active: {new Date(s.lastActiveAt).toLocaleTimeString()}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                  Active
                </span>
                <div className="text-[10px] text-neutral-400 mt-0.5 font-mono">
                  Expires {new Date(s.expiresAt).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Change Password Form */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-xs">
        <h3 className="text-base font-bold text-neutral-900 mb-1 flex items-center gap-2">
          <Lock className="w-4 h-4 text-neutral-700" />
          <span>Change Account Password</span>
        </h3>
        <p className="text-xs text-neutral-500 mb-4">
          Ensure your password is at least 6 characters long and not shared across public devices.
        </p>

        <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Current Password
            </label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#FACC15]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              New Password
            </label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#FACC15]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#FACC15]"
            />
          </div>

          <button
            type="submit"
            disabled={isUpdatingPassword}
            className="px-4 py-2 bg-[#111111] hover:bg-black text-[#FACC15] font-bold text-xs rounded-xl transition-colors disabled:opacity-60"
          >
            {isUpdatingPassword ? 'Updating...' : 'Save New Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

