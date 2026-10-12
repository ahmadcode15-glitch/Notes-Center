import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import {
  Users,
  Search,
  Plus,
  KeyRound,
  LogOut,
  Smartphone,
  Trash2,
  Edit,
  ExternalLink,
  Shield,
  Clock,
  Filter,
} from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { Skeleton } from '../../components/common/Skeleton';
import { useAuth } from '../../context/AuthContext';

export const UsersManagementPage: React.FC = () => {
  const { success, error } = useToast();
  const { user: currentUser } = useAuth();
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

  const [users, setUsers] = useState<any[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [resetPasswordModalOpen, setResetPasswordModalOpen] = useState(false);
  const [deviceLimitModalOpen, setDeviceLimitModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [forceLogoutConfirmOpen, setForceLogoutConfirmOpen] = useState(false);

  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);

  // Form states
  const [newUser, setNewUser] = useState({
    username: '',
    fullName: '',
    password: '',
    role: 'USER',
    status: 'ACTIVE',
    maxDevices: 1,
    accessExpiryDays: 180,
    courseId: '',
    noteId: '',
  });

  const [editUser, setEditUser] = useState({
    fullName: '',
    role: 'USER',
    status: 'ACTIVE',
    maxDevices: 1,
    accessExpiry: '',
  });

  const [newPasswordValue, setNewPasswordValue] = useState('');
  const [newDeviceLimitValue, setNewDeviceLimitValue] = useState(1);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const res = await api.users.list({
        page,
        limit: 15,
        search,
        role: roleFilter,
        status: statusFilter,
      });
      if (res.success) {
        setUsers(res.users);
        setTotalUsers(res.pagination.total);
      }
    } catch (err: any) {
      error(err.message || 'Failed to fetch users');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [page, roleFilter, statusFilter]);

  useEffect(() => {
    api.courses.list().then((res) => {
      if (res.success) setCourses(res.courses || []);
    }).catch(() => {});
    api.notes.list().then((res) => {
      if (res.success) setNotes(res.notes || []);
    }).catch(() => {});
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadUsers();
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let expiryDate: string | null = null;
      if (newUser.accessExpiryDays > 0) {
        const d = new Date();
        d.setDate(d.getDate() + Number(newUser.accessExpiryDays));
        expiryDate = d.toISOString();
      }

      const res = await api.users.create({
        ...newUser,
        courseId: newUser.courseId || undefined,
        noteId: newUser.noteId || undefined,
        accessExpiry: expiryDate,
      });

      if (res.success) {
        success(`User @${newUser.username} created successfully!`);
        setCreateModalOpen(false);
        setNewUser({
          username: '',
          fullName: '',
          password: '',
          role: 'USER',
          status: 'ACTIVE',
          maxDevices: 1,
          accessExpiryDays: 180,
          courseId: '',
          noteId: '',
        });
        loadUsers();
      }
    } catch (err: any) {
      error(err.message || 'Failed to create user');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      const res = await api.users.update(selectedUser.id, editUser);
      if (res.success) {
        success('User details updated.');
        setEditModalOpen(false);
        loadUsers();
      }
    } catch (err: any) {
      error(err.message || 'Failed to update user');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !newPasswordValue) return;
    try {
      const res = await api.users.resetPassword(selectedUser.id, newPasswordValue);
      if (res.success) {
        success(res.message);
        setResetPasswordModalOpen(false);
        setNewPasswordValue('');
        loadUsers();
      }
    } catch (err: any) {
      error(err.message || 'Failed to reset password');
    }
  };

  const handleDeviceLimitUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      const res = await api.users.update(selectedUser.id, { maxDevices: Number(newDeviceLimitValue) });
      if (res.success) {
        success(`Device limit updated to ${newDeviceLimitValue} devices.`);
        setDeviceLimitModalOpen(false);
        loadUsers();
      }
    } catch (err: any) {
      error(err.message || 'Failed to update device limit');
    }
  };

  const handleForceLogout = async () => {
    if (!selectedUser) return;
    try {
      const res = await api.users.forceLogout(selectedUser.id);
      if (res.success) {
        success(res.message);
        setForceLogoutConfirmOpen(false);
        loadUsers();
      }
    } catch (err: any) {
      error(err.message || 'Failed to force logout user');
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    try {
      const res = await api.users.delete(selectedUser.id);
      if (res.success) {
        success(res.message);
        setDeleteConfirmOpen(false);
        loadUsers();
      }
    } catch (err: any) {
      error(err.message || 'Failed to delete user');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-5">
        <div>
          <h1 className="text-2xl font-black text-neutral-900 tracking-tight">User & Student Management</h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            Create students, adjust device limits, inspect active sessions, and configure access expiry.
          </p>
        </div>
        <button
          onClick={() => setCreateModalOpen(true)}
          className="px-4 py-2 bg-[#FACC15] hover:bg-[#EAB308] text-black font-bold text-xs rounded-xl transition-colors shadow-xs flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create New User</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-xs flex flex-col md:flex-row items-center gap-3 justify-between">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full md:max-w-md">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by username or student full name..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#FACC15]"
          />
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto">
          {isSuperAdmin && (
            <select
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
              className="px-2.5 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-700"
            >
              <option value="">All Roles</option>
              <option value="USER">Students (USER)</option>
              <option value="ADMIN">Admins</option>
              <option value="SUPER_ADMIN">Super Admins</option>
            </select>
          )}

          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-2.5 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-700"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="EXPIRED">EXPIRED</option>
            <option value="SUSPENDED">SUSPENDED</option>
            <option value="DISABLED">DISABLED</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8F8F6] border-b border-neutral-200 text-neutral-600 font-bold uppercase tracking-wider font-mono">
              <tr>
                <th className="py-3 px-4">Student / User</th>
                {isSuperAdmin && <th className="py-3 px-4">Managed By Admin</th>}
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Device Limit</th>
                <th className="py-3 px-4">Access Expiry</th>
                <th className="py-3 px-4">Last Login</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {isLoading ? (
                <tr>
                  <td colSpan={isSuperAdmin ? 8 : 7} className="p-8 text-center">
                    <Skeleton className="h-6 w-1/3 mx-auto" />
                  </td>
                </tr>
              ) : users.length > 0 ? (
                users.map((u) => {
                  const activeSessionsCount = u._count?.sessions || 0;
                  return (
                    <tr key={u.id} className="hover:bg-neutral-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <Link
                          to={`/admin/users/${u.id}`}
                          className="font-bold text-neutral-900 hover:underline flex items-center gap-1.5"
                        >
                          <span>{u.fullName}</span>
                          <ExternalLink className="w-3 h-3 text-neutral-400" />
                        </Link>
                        <div className="text-[11px] font-mono text-neutral-500">@{u.username}</div>
                      </td>
                      {isSuperAdmin && (
                        <td className="py-3 px-4">
                          {u.createdBy ? (
                            <div>
                              <span className="font-semibold text-neutral-800">{u.createdBy.fullName}</span>
                              <div className="text-[10px] text-neutral-400 font-mono">@{u.createdBy.username}</div>
                            </div>
                          ) : (
                            <span className="text-neutral-400 italic">Super Admin / System</span>
                          )}
                        </td>
                      )}
                      <td className="py-3 px-4">
                        <span className="font-mono font-semibold text-neutral-700">
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={
                            u.status === 'ACTIVE'
                              ? 'active'
                              : u.status === 'EXPIRED'
                              ? 'expired'
                              : 'suspended'
                          }
                        >
                          {u.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => {
                            setSelectedUser(u);
                            setNewDeviceLimitValue(u.maxDevices);
                            setDeviceLimitModalOpen(true);
                          }}
                          className="font-semibold text-neutral-800 hover:text-black flex items-center gap-1"
                          title="Click to change device limit"
                        >
                          <span>{u.maxDevices} max</span>
                          <span className="text-[10px] text-neutral-400 font-normal">
                            ({activeSessionsCount} active)
                          </span>
                        </button>
                      </td>
                      <td className="py-3 px-4 text-neutral-600">
                        {u.accessExpiry
                          ? new Date(u.accessExpiry).toLocaleDateString()
                          : 'Lifetime'}
                      </td>
                      <td className="py-3 px-4 text-neutral-500 font-mono text-[11px]">
                        {u.lastLoginAt
                          ? new Date(u.lastLoginAt).toLocaleDateString()
                          : 'Never'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Approve Access Direct Button */}
                          <Link
                            to={`/admin/users/${u.id}`}
                            className="px-2.5 py-1 text-xs font-bold bg-[#111111] text-[#FACC15] hover:bg-neutral-800 rounded-lg flex items-center gap-1 transition-colors"
                            title="Approve & Manage Courses/Notes Access"
                          >
                            <Shield className="w-3.5 h-3.5" />
                            <span>Approve Access</span>
                          </Link>
                          {/* Force Logout */}
                          <button
                            onClick={() => {
                              setSelectedUser(u);
                              setForceLogoutConfirmOpen(true);
                            }}
                            title="Force Logout / Revoke Active Sessions"
                            className="p-1.5 text-neutral-500 hover:text-amber-600 hover:bg-neutral-100 rounded-lg"
                          >
                            <LogOut className="w-4 h-4" />
                          </button>

                          {/* Reset Password */}
                          <button
                            onClick={() => {
                              setSelectedUser(u);
                              setNewPasswordValue('');
                              setResetPasswordModalOpen(true);
                            }}
                            title="Reset Password"
                            className="p-1.5 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg"
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>

                          {/* Edit Details */}
                          <button
                            onClick={() => {
                              setSelectedUser(u);
                              setEditUser({
                                fullName: u.fullName,
                                role: u.role,
                                status: u.status,
                                maxDevices: u.maxDevices,
                                accessExpiry: u.accessExpiry ? u.accessExpiry.split('T')[0] : '',
                              });
                              setEditModalOpen(true);
                            }}
                            title="Edit Details"
                            className="p-1.5 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          {/* Delete User */}
                          {u.role !== 'SUPER_ADMIN' && (
                            <button
                              onClick={() => {
                                setSelectedUser(u);
                                setDeleteConfirmOpen(true);
                              }}
                              title="Delete User"
                              className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-xs text-neutral-500">
                    No users matching the filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create User Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create Student or Staff Account"
        maxWidth="md"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1">
              Username *
            </label>
            <input
              type="text"
              required
              value={newUser.username}
              onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
              placeholder="e.g. sara_khan"
              className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#FACC15]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={newUser.fullName}
              onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
              placeholder="e.g. Sara Khan"
              className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#FACC15]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1">
              Initial Password *
            </label>
            <input
              type="password"
              required
              value={newUser.password}
              onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
              placeholder="Minimum 6 characters"
              className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#FACC15]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">Role</label>
              {isSuperAdmin ? (
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-900"
                >
                  <option value="USER">Student (USER)</option>
                  <option value="ADMIN">Academic Admin</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                </select>
              ) : (
                <div className="w-full px-3 py-2 text-xs bg-neutral-100 border border-neutral-200 rounded-lg text-neutral-700 font-semibold flex items-center justify-between">
                  <span>Student (USER)</span>
                  <span className="text-[10px] text-neutral-400">Assigned to you</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                Max Devices (#7)
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={newUser.maxDevices}
                onChange={(e) => setNewUser({ ...newUser, maxDevices: parseInt(e.target.value, 10) || 1 })}
                className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1">
              Access Duration (Days)
            </label>
            <input
              type="number"
              min="0"
              value={newUser.accessExpiryDays}
              onChange={(e) => setNewUser({ ...newUser, accessExpiryDays: parseInt(e.target.value, 10) || 0 })}
              className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-900"
            />
            <span className="text-[11px] text-neutral-400 mt-1 block">
              0 means unlimited lifetime access. 180 days is standard 1-semester duration.
            </span>
          </div>

          {/* Educational Access Approval by Admin */}
          <div className="p-3 bg-amber-50/70 border border-amber-200/70 rounded-xl space-y-2.5">
            <div className="text-xs font-bold text-neutral-900 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-amber-600" />
              <span>Initial Content Approval (Optional)</span>
            </div>
            <p className="text-[11px] text-neutral-600">
              Select which course and specific note this student is approved to access upon creation.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                  Approve Course Access
                </label>
                <select
                  value={newUser.courseId}
                  onChange={(e) => setNewUser({ ...newUser, courseId: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-neutral-300 rounded-lg text-neutral-900"
                >
                  <option value="">-- No Initial Course --</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} - {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                  Approve Specific Note Access
                </label>
                <select
                  value={newUser.noteId}
                  onChange={(e) => setNewUser({ ...newUser, noteId: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-neutral-300 rounded-lg text-neutral-900"
                >
                  <option value="">-- No Initial Note --</option>
                  {notes.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-neutral-100">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-black bg-[#FACC15] hover:bg-[#EAB308] rounded-lg"
            >
              Create Account
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title={`Edit User: @${selectedUser?.username}`}
        maxWidth="md"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1">Full Name</label>
            <input
              type="text"
              required
              value={editUser.fullName}
              onChange={(e) => setEditUser({ ...editUser, fullName: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">Role</label>
              {isSuperAdmin ? (
                <select
                  value={editUser.role}
                  onChange={(e) => setEditUser({ ...editUser, role: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-900"
                >
                  <option value="USER">Student (USER)</option>
                  <option value="ADMIN">Academic Admin</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                </select>
              ) : (
                <div className="w-full px-3 py-2 text-xs bg-neutral-100 border border-neutral-200 rounded-lg text-neutral-700 font-semibold">
                  Student (USER)
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">Status</label>
              <select
                value={editUser.status}
                onChange={(e) => setEditUser({ ...editUser, status: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-900"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="EXPIRED">EXPIRED</option>
                <option value="SUSPENDED">SUSPENDED</option>
                <option value="DISABLED">DISABLED</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                Max Allowed Devices
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={editUser.maxDevices}
                onChange={(e) => setEditUser({ ...editUser, maxDevices: parseInt(e.target.value, 10) || 1 })}
                className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                Access Expiry Date
              </label>
              <input
                type="date"
                value={editUser.accessExpiry}
                onChange={(e) => setEditUser({ ...editUser, accessExpiry: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-900"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-neutral-100">
            <button
              type="button"
              onClick={() => setEditModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-black bg-[#FACC15] hover:bg-[#EAB308] rounded-lg"
            >
              Save Changes
            </button>
          </div>
        </form>
      </Modal>

      {/* Reset Password Modal */}
      <Modal
        isOpen={resetPasswordModalOpen}
        onClose={() => setResetPasswordModalOpen(false)}
        title={`Reset Password: @${selectedUser?.username}`}
        maxWidth="sm"
      >
        <form onSubmit={handleResetPassword} className="space-y-4">
          <p className="text-xs text-neutral-600">
            Enter a new password for this student. For security, all currently active sessions for this account will be automatically terminated.
          </p>
          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1">
              New Password
            </label>
            <input
              type="password"
              required
              value={newPasswordValue}
              onChange={(e) => setNewPasswordValue(e.target.value)}
              placeholder="Minimum 6 characters"
              className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-900"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setResetPasswordModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-neutral-700 bg-neutral-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-black hover:bg-neutral-800 rounded-lg"
            >
              Reset & Revoke Sessions
            </button>
          </div>
        </form>
      </Modal>

      {/* Device Limit Modal */}
      <Modal
        isOpen={deviceLimitModalOpen}
        onClose={() => setDeviceLimitModalOpen(false)}
        title={`Configure Device Limit: @${selectedUser?.username}`}
        maxWidth="sm"
      >
        <form onSubmit={handleDeviceLimitUpdate} className="space-y-4">
          <p className="text-xs text-neutral-600">
            Set the maximum number of simultaneous devices this student can log in from before encountering the "Device Limit Reached" restriction.
          </p>
          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1">
              Max Devices Allowed (#7 requirement)
            </label>
            <input
              type="number"
              min="1"
              max="10"
              required
              value={newDeviceLimitValue}
              onChange={(e) => setNewDeviceLimitValue(parseInt(e.target.value, 10) || 1)}
              className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-900"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setDeviceLimitModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-neutral-700 bg-neutral-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-black bg-[#FACC15] hover:bg-[#EAB308] rounded-lg"
            >
              Update Limit
            </button>
          </div>
        </form>
      </Modal>

      {/* Force Logout Confirm Dialog */}
      <ConfirmDialog
        isOpen={forceLogoutConfirmOpen}
        onClose={() => setForceLogoutConfirmOpen(false)}
        onConfirm={handleForceLogout}
        title="Force Logout User"
        message={`Are you sure you want to revoke all active sessions for @${selectedUser?.username}? They will be forced to log in again on their next request.`}
        confirmText="Revoke Sessions"
        isDestructive={true}
      />

      {/* Delete User Confirm Dialog (#33 requirement) */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDeleteUser}
        title="Delete User Account"
        message={`Are you sure you want to permanently delete user @${selectedUser?.username}? This action cannot be undone.`}
        confirmText="Delete User"
        isDestructive={true}
      />
    </div>
  );
};

