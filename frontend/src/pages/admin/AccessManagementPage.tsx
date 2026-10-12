import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import {
  KeyRound,
  Plus,
  Trash2,
  Search,
  User,
  BookOpen,
  Calendar,
  ShieldAlert,
} from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { Skeleton } from '../../components/common/Skeleton';

export const AccessManagementPage: React.FC = () => {
  const { success, error } = useToast();

  const [users, setUsers] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [userGrants, setUserGrants] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal
  const [grantModalOpen, setGrantModalOpen] = useState(false);
  const [grantForm, setGrantForm] = useState({
    userId: '',
    accessType: 'COURSE',
    courseId: '',
    expiryDate: '',
  });

  const [revokeConfirmOpen, setRevokeConfirmOpen] = useState(false);
  const [selectedGrantId, setSelectedGrantId] = useState<string | null>(null);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const [uRes, cRes] = await Promise.all([
        api.users.list({ limit: 100 }),
        api.courses.list(),
      ]);
      if (uRes.success) {
        setUsers(uRes.users);
        if (uRes.users.length > 0) {
          setSelectedUserId(uRes.users[0].id);
        }
      }
      if (cRes.success) setCourses(cRes.courses);
    } catch (err: any) {
      error(err.message || 'Failed to load access data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadUserGrants = async (uid: string) => {
    try {
      const res = await api.access.userAccess(uid);
      if (res.success) setUserGrants(res.grants);
    } catch (err: any) {
      error(err.message || 'Failed to load grants');
    }
  };

  useEffect(() => {
    if (selectedUserId) {
      loadUserGrants(selectedUserId);
    }
  }, [selectedUserId]);

  const handleGrantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.access.grant({
        userId: grantForm.userId || selectedUserId,
        accessType: grantForm.accessType,
        courseId: grantForm.courseId,
        expiryDate: grantForm.expiryDate,
      });

      if (res.success) {
        success('Educational access granted!');
        setGrantModalOpen(false);
        if (selectedUserId) loadUserGrants(selectedUserId);
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
        if (selectedUserId) loadUserGrants(selectedUserId);
      }
    } catch (err: any) {
      error(err.message || 'Failed to revoke grant');
    }
  };

  const activeUser = users.find((u) => u.id === selectedUserId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-5">
        <div>
          <h1 className="text-2xl font-black text-neutral-900 tracking-tight">Access Control & Entitlements</h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            Grant, extend, or revoke individual student access to specific degree programs and syllabus courses.
          </p>
        </div>
        <button
          onClick={() => {
            const d = new Date();
            d.setDate(d.getDate() + 180);
            setGrantForm({
              userId: selectedUserId,
              accessType: 'COURSE',
              courseId: courses[0]?.id || '',
              expiryDate: d.toISOString().split('T')[0],
            });
            setGrantModalOpen(true);
          }}
          className="px-4 py-2 bg-[#FACC15] hover:bg-[#EAB308] text-black font-bold text-xs rounded-xl transition-colors shadow-xs flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Grant New Access</span>
        </button>
      </div>

      {/* Student Selector Bar */}
      <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <label className="text-xs font-bold text-neutral-700 whitespace-nowrap">
          Inspect Student:
        </label>
        <select
          value={selectedUserId}
          onChange={(e) => setSelectedUserId(e.target.value)}
          className="flex-1 px-3 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-900 font-semibold"
        >
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.fullName} (@{u.username}) — Status: {u.status}
            </option>
          ))}
        </select>
      </div>

      {/* Selected Student Active Grants List */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4 border-b border-neutral-100 pb-3">
          <h2 className="text-sm font-bold text-neutral-900 font-mono uppercase flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-[#FACC15]" />
            <span>Assigned Access for {activeUser?.fullName}</span>
          </h2>
          <span className="text-xs text-neutral-500">
            {userGrants.length} Active Records
          </span>
        </div>

        {userGrants.length > 0 ? (
          <div className="divide-y divide-neutral-100">
            {userGrants.map((grant) => (
              <div key={grant.id} className="py-3.5 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-neutral-900 text-sm">
                    {grant.course?.title || grant.subject?.title || 'Educational Content'}
                  </div>
                  <div className="text-neutral-500 text-[11px] font-mono mt-0.5">
                    Code: {grant.course?.code || 'GEN'} • Granted By: {grant.grantedBy || 'Admin'}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <Badge variant={grant.status === 'ACTIVE' ? 'active' : 'expired'}>
                      {grant.status}
                    </Badge>
                    <div className="text-[11px] text-neutral-500 mt-1">
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
          <div className="p-8 text-center text-xs text-neutral-500 bg-neutral-50 rounded-xl">
            This student does not currently have any direct grants assigned. Click "Grant New Access" to assign courses.
          </div>
        )}
      </div>

      {/* Grant Access Modal */}
      <Modal
        isOpen={grantModalOpen}
        onClose={() => setGrantModalOpen(false)}
        title="Grant Academic Course Access"
        maxWidth="md"
      >
        <form onSubmit={handleGrantSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1">Target Student</label>
            <select
              value={grantForm.userId}
              onChange={(e) => setGrantForm({ ...grantForm, userId: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-900"
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.fullName} (@{u.username})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1">Select Course Program</label>
            <select
              required
              value={grantForm.courseId}
              onChange={(e) => setGrantForm({ ...grantForm, courseId: e.target.value })}
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

          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1">Access Expiry Date</label>
            <input
              type="date"
              required
              value={grantForm.expiryDate}
              onChange={(e) => setGrantForm({ ...grantForm, expiryDate: e.target.value })}
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
              Authorize Access
            </button>
          </div>
        </form>
      </Modal>

      {/* Revoke Confirmation */}
      <ConfirmDialog
        isOpen={revokeConfirmOpen}
        onClose={() => setRevokeConfirmOpen(false)}
        onConfirm={handleRevokeGrant}
        title="Revoke Student Access"
        message="Are you sure you want to revoke this student's access to this course? Their protected reader view will be locked."
        confirmText="Revoke Access"
        isDestructive={true}
      />
    </div>
  );
};

