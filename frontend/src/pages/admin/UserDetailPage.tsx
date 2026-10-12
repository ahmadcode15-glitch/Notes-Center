import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import {
  ArrowLeft,
  User,
  Shield,
  Smartphone,
  Calendar,
  Clock,
  Laptop,
  Plus,
  Trash2,
  KeyRound,
  CreditCard,
} from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { Skeleton } from '../../components/common/Skeleton';

export const UserDetailPage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const { success, error } = useToast();

  const [user, setUser] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Grant Access Modal
  const [grantModalOpen, setGrantModalOpen] = useState(false);
  const [grantData, setGrantData] = useState({
    accessType: 'COURSE',
    courseId: '',
    subjectId: '',
    noteId: '',
    expiryDate: '',
  });

  const [revokeConfirmOpen, setRevokeConfirmOpen] = useState(false);
  const [selectedGrantId, setSelectedGrantId] = useState<string | null>(null);

  const loadUserDetails = async () => {
    if (!userId) return;
    try {
      const [uRes, cRes, nRes] = await Promise.all([
        api.users.get(userId),
        api.courses.list(),
        api.notes.list(),
      ]);
      if (uRes.success) setUser(uRes.user);
      if (cRes.success) setCourses(cRes.courses);
      if (nRes.success) setNotes(nRes.notes);
    } catch (err: any) {
      error(err.message || 'Failed to load user details');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUserDetails();
  }, [userId]);

  const handleGrantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    try {
      const res = await api.access.grant({
        userId,
        accessType: grantData.accessType,
        courseId: grantData.accessType === 'COURSE' ? grantData.courseId : null,
        subjectId: grantData.accessType === 'SUBJECT' ? grantData.subjectId : null,
        noteId: grantData.accessType === 'NOTE' ? grantData.noteId : null,
        expiryDate: grantData.expiryDate || new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
      });

      if (res.success) {
        success('Educational access approved & granted successfully.');
        setGrantModalOpen(false);
        loadUserDetails();
      }
    } catch (err: any) {
      error(err.message || 'Failed to grant access');
    }
  };

  const handleRevokeGrant = async () => {
    if (!selectedGrantId) return;
    try {
      const res = await api.access.revoke(selectedGrantId);
      if (res.success) {
        success('Access grant revoked.');
        setRevokeConfirmOpen(false);
        loadUserDetails();
      }
    } catch (err: any) {
      error(err.message || 'Failed to revoke access');
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    try {
      const res = await api.sessions.revoke(sessionId);
      if (res.success) {
        success('Device session revoked.');
        loadUserDetails();
      }
    } catch (err: any) {
      error(err.message || 'Failed to revoke session');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/4" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-8 text-center text-sm text-neutral-500 bg-white rounded-xl">
        User not found.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        to="/admin/users"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-600 hover:text-black transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Users Table
      </Link>

      {/* User Header Profile Card */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#111111] text-[#FACC15] flex items-center justify-center font-bold text-xl">
              {user.fullName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-neutral-900">{user.fullName}</h1>
                <Badge variant={user.status === 'ACTIVE' ? 'active' : 'expired'}>
                  {user.status}
                </Badge>
              </div>
              <div className="text-xs font-mono text-neutral-500 mt-0.5">@{user.username}</div>
            </div>
          </div>

          <button
            onClick={() => {
              const d = new Date();
              d.setDate(d.getDate() + 180);
              setGrantData({
                accessType: 'COURSE',
                courseId: courses[0]?.id || '',
                subjectId: '',
                noteId: '',
                expiryDate: d.toISOString().split('T')[0],
              });
              setGrantModalOpen(true);
            }}
            className="px-4 py-2 bg-[#FACC15] hover:bg-[#EAB308] text-black font-bold text-xs rounded-xl transition-colors shadow-xs flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Assign Course / Access</span>
          </button>
        </div>

        {/* Status bar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8 pt-6 border-t border-neutral-100 text-xs">
          <div>
            <div className="text-neutral-500">System Role</div>
            <div className="font-bold text-neutral-900 mt-0.5">{user.role}</div>
          </div>
          <div>
            <div className="text-neutral-500">Max Allowed Devices</div>
            <div className="font-bold text-neutral-900 mt-0.5">{user.maxDevices} Devices</div>
          </div>
          <div>
            <div className="text-neutral-500">Global Access Expiry</div>
            <div className="font-bold text-neutral-900 mt-0.5">
              {user.accessExpiry ? new Date(user.accessExpiry).toLocaleDateString() : 'Lifetime'}
            </div>
          </div>
          <div>
            <div className="text-neutral-500">Last Active Session</div>
            <div className="font-bold text-neutral-900 mt-0.5">
              {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Never'}
            </div>
          </div>
        </div>
      </div>

      {/* Assigned Access Grants Section (#16 requirement) */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-900 font-mono flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-[#FACC15]" />
            <span>Assigned Course & Subject Grants ({user.userAccess?.length || 0})</span>
          </h2>
        </div>

        {user.userAccess && user.userAccess.length > 0 ? (
          <div className="divide-y divide-neutral-100">
            {user.userAccess.map((grant: any) => (
              <div key={grant.id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-neutral-900">
                    {grant.course?.title || grant.subject?.title || grant.note?.title || 'Educational Content'}
                  </div>
                  <div className="text-neutral-500 text-[11px] font-mono mt-0.5">
                    Type: <span className="font-semibold text-neutral-800">{grant.accessType}</span> • Granted By: {grant.grantedBy || 'Admin'}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <Badge variant={grant.status === 'ACTIVE' ? 'active' : 'expired'}>
                      {grant.status}
                    </Badge>
                    <div className="text-[10px] text-neutral-400 mt-0.5">
                      Expires: {new Date(grant.expiryDate).toLocaleDateString()}
                    </div>
                  </div>
                  {grant.status === 'ACTIVE' && (
                    <button
                      onClick={() => {
                        setSelectedGrantId(grant.id);
                        setRevokeConfirmOpen(true);
                      }}
                      className="p-1.5 text-neutral-400 hover:text-red-600 rounded-lg"
                      title="Revoke Access"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center text-xs text-neutral-500 bg-neutral-50 rounded-xl">
            No specific course or subject grants assigned yet. Click "Assign Course / Access" to enroll student.
          </div>
        )}
      </div>

      {/* Active Device Sessions for this user (#7 requirement) */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-xs">
        <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-900 font-mono mb-4 flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-neutral-700" />
          <span>Active Device Sessions ({user.sessions?.length || 0} / {user.maxDevices} Allowed)</span>
        </h2>

        {user.sessions && user.sessions.length > 0 ? (
          <div className="space-y-2">
            {user.sessions.map((s: any) => (
              <div
                key={s.id}
                className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200/70 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-3">
                  <Laptop className="w-4 h-4 text-neutral-500" />
                  <div>
                    <div className="font-bold text-neutral-800">{s.deviceName}</div>
                    <div className="text-[11px] text-neutral-500 font-mono">
                      IP: {s.ipAddress} • Last Active: {new Date(s.lastActiveAt).toLocaleString()}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleRevokeSession(s.id)}
                  className="px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-200"
                >
                  Revoke Device
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center text-xs text-neutral-500 bg-neutral-50 rounded-xl">
            No currently active sessions.
          </div>
        )}
      </div>

      {/* Payment History for this user (#25 requirement) */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-xs">
        <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-900 font-mono mb-4 flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-neutral-700" />
          <span>Payment & Receipt Records</span>
        </h2>

        {user.payments && user.payments.length > 0 ? (
          <div className="divide-y divide-neutral-100">
            {user.payments.map((p: any) => (
              <div key={p.id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-neutral-900">
                    {p.package?.name || 'Manual Course Fee'}
                  </div>
                  <div className="text-[11px] text-neutral-500 mt-0.5">
                    {p.paymentMethod} • Ref: {p.transactionRef} • {new Date(p.paymentDate).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-neutral-900 text-sm">
                    ${p.amount.toFixed(2)}
                  </span>
                  <div>
                    <Badge variant={p.status === 'PAID' ? 'paid' : 'pending'}>
                      {p.status}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center text-xs text-neutral-500 bg-neutral-50 rounded-xl">
            No payments recorded for this user yet.
          </div>
        )}
      </div>

      {/* Grant Access Modal */}
      <Modal
        isOpen={grantModalOpen}
        onClose={() => setGrantModalOpen(false)}
        title="Assign Educational Access"
        maxWidth="md"
      >
        <form onSubmit={handleGrantSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1">
              Access Type
            </label>
            <select
              value={grantData.accessType}
              onChange={(e) => setGrantData({ ...grantData, accessType: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-900"
            >
              <option value="COURSE">Course-Level Access (Approve all notes under course)</option>
              <option value="NOTE">Individual Note Access (Approve specific note)</option>
            </select>
          </div>

          {grantData.accessType === 'COURSE' && (
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                Select Course to Approve
              </label>
              <select
                required
                value={grantData.courseId}
                onChange={(e) => setGrantData({ ...grantData, courseId: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-900"
              >
                <option value="">-- Choose Course --</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} - {c.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {grantData.accessType === 'NOTE' && (
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                Select Educational Note to Approve
              </label>
              <select
                required
                value={grantData.noteId}
                onChange={(e) => setGrantData({ ...grantData, noteId: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-900"
              >
                <option value="">-- Choose Note --</option>
                {notes.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.title} ({n.course?.code || 'Curriculum'})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1">
              Access Expiry Date
            </label>
            <input
              type="date"
              required
              value={grantData.expiryDate}
              onChange={(e) => setGrantData({ ...grantData, expiryDate: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-900"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-neutral-100">
            <button
              type="button"
              onClick={() => setGrantModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-neutral-700 bg-neutral-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-black bg-[#FACC15] hover:bg-[#EAB308] rounded-lg"
            >
              Grant Access
            </button>
          </div>
        </form>
      </Modal>

      {/* Revoke Confirm Dialog */}
      <ConfirmDialog
        isOpen={revokeConfirmOpen}
        onClose={() => setRevokeConfirmOpen(false)}
        onConfirm={handleRevokeGrant}
        title="Revoke Content Access"
        message="Are you sure you want to revoke this student's access grant? They will no longer be able to open notes under this item."
        confirmText="Revoke Grant"
        isDestructive={true}
      />
    </div>
  );
};

