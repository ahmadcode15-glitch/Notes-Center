import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import {
  Laptop,
  Smartphone,
  LogOut,
  AlertTriangle,
  Search,
  Clock,
  ShieldAlert,
} from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { Skeleton } from '../../components/common/Skeleton';

export const SessionsManagementPage: React.FC = () => {
  const { success, error } = useToast();

  const [sessions, setSessions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Revoke individual
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [revokeConfirmOpen, setRevokeConfirmOpen] = useState(false);

  // Revoke all
  const [revokeAllConfirmOpen, setRevokeAllConfirmOpen] = useState(false);

  const loadSessions = async () => {
    setIsLoading(true);
    try {
      const res = await api.sessions.active();
      if (res.success) setSessions(res.sessions);
    } catch (err: any) {
      error(err.message || 'Failed to fetch active sessions');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const handleRevokeSession = async () => {
    if (!selectedSessionId) return;
    try {
      const res = await api.sessions.revoke(selectedSessionId);
      if (res.success) {
        success('Session revoked successfully.');
        setRevokeConfirmOpen(false);
        loadSessions();
      }
    } catch (err: any) {
      error(err.message || 'Failed to revoke session');
    }
  };

  const handleRevokeAll = async () => {
    try {
      const res = await api.sessions.revokeAll();
      if (res.success) {
        success(res.message);
        setRevokeAllConfirmOpen(false);
        loadSessions();
      }
    } catch (err: any) {
      error(err.message || 'Failed to revoke all sessions');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-5">
        <div>
          <h1 className="text-2xl font-black text-neutral-900 tracking-tight">Active Device Sessions</h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            Real-time server-side tracking of logged-in student and staff devices. 24-hour validity limit.
          </p>
        </div>
        <button
          onClick={() => setRevokeAllConfirmOpen(true)}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl transition-colors shadow-xs flex items-center gap-1.5 self-start sm:self-auto"
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Force Logout All Users</span>
        </button>
      </div>

      {/* Summary Box */}
      <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-neutral-900 text-[#FACC15] flex items-center justify-center">
            <Laptop className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-mono font-bold text-neutral-500 uppercase">
              Current Platform Concurrency
            </div>
            <div className="text-lg font-black text-neutral-900">
              {sessions.length} Live Active Device {sessions.length === 1 ? 'Session' : 'Sessions'}
            </div>
          </div>
        </div>
      </div>

      {/* Sessions Table */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8F8F6] border-b border-neutral-200 text-neutral-600 font-bold uppercase tracking-wider font-mono">
              <tr>
                <th className="py-3 px-4">Student / User</th>
                <th className="py-3 px-4">Device & Operating System</th>
                <th className="py-3 px-4">IP Address</th>
                <th className="py-3 px-4">Last Activity</th>
                <th className="py-3 px-4">Expires In</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center">
                    <Skeleton className="h-6 w-1/3 mx-auto" />
                  </td>
                </tr>
              ) : sessions.length > 0 ? (
                sessions.map((s) => {
                  const now = new Date();
                  const exp = new Date(s.expiresAt);
                  const remainingHours = Math.max(0, Math.round((exp.getTime() - now.getTime()) / (1000 * 60 * 60)));

                  return (
                    <tr key={s.id} className="hover:bg-neutral-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-neutral-900">{s.user?.fullName}</div>
                        <div className="text-[11px] font-mono text-neutral-500">
                          @{s.user?.username} • Limit: {s.user?.maxDevices}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-neutral-800">{s.deviceName}</div>
                        <div className="text-[11px] text-neutral-400 font-mono">
                          ID: {s.deviceIdentifier?.substring(0, 12)}...
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-neutral-600">
                        {s.ipAddress}
                      </td>
                      <td className="py-3 px-4 text-neutral-600 font-mono text-[11px]">
                        {new Date(s.lastActiveAt).toLocaleTimeString()}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono font-semibold text-neutral-800">
                          ~{remainingHours}h remaining
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedSessionId(s.id);
                            setRevokeConfirmOpen(true);
                          }}
                          className="px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-200"
                        >
                          Revoke Session
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-xs text-neutral-500">
                    No active sessions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Revoke Individual Session Dialog */}
      <ConfirmDialog
        isOpen={revokeConfirmOpen}
        onClose={() => setRevokeConfirmOpen(false)}
        onConfirm={handleRevokeSession}
        title="Revoke Device Session"
        message="Are you sure you want to terminate this device session? The student will be disconnected immediately and prompted to sign in again."
        confirmText="Revoke Session"
        isDestructive={true}
      />

      {/* Revoke All Sessions Dialog */}
      <ConfirmDialog
        isOpen={revokeAllConfirmOpen}
        onClose={() => setRevokeAllConfirmOpen(false)}
        onConfirm={handleRevokeAll}
        title="Emergency Force Logout All Users"
        message="Are you sure you want to revoke ALL active sessions across the entire platform? Every student and staff member will be required to re-authenticate."
        confirmText="Disconnect Everyone"
        isDestructive={true}
      />
    </div>
  );
};

