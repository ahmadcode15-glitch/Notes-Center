import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import {
  CreditCard,
  Plus,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  Trash2,
  Edit,
} from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { Skeleton } from '../../components/common/Skeleton';

export const PaymentsManagementPage: React.FC = () => {
  const { success, error } = useToast();

  const [payments, setPayments] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [totalPayments, setTotalPayments] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Record Payment Modal
  const [recordModalOpen, setRecordModalOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    userId: '',
    packageId: '',
    amount: '',
    paymentMethod: 'Bank Transfer',
    transactionRef: '',
    status: 'PAID',
    expiryDays: 180,
    notes: '',
  });

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [pRes, uRes, pkgRes] = await Promise.all([
        api.payments.list({ page, limit: 15, search, status: statusFilter }),
        api.users.list({ limit: 100 }),
        api.packages.list(),
      ]);

      if (pRes.success) {
        setPayments(pRes.payments);
        setTotalPayments(pRes.pagination.total);
      }
      if (uRes.success) setUsers(uRes.users);
      if (pkgRes.success) setPackages(pkgRes.packages);
    } catch (err: any) {
      error(err.message || 'Failed to load payments');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, statusFilter]);

  const handleRecordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const exp = new Date();
      exp.setDate(exp.getDate() + Number(paymentForm.expiryDays));

      const res = await api.payments.create({
        ...paymentForm,
        expiryDate: exp.toISOString(),
      });

      if (res.success) {
        success('Payment recorded successfully. Student access extended!');
        setRecordModalOpen(false);
        setPaymentForm({
          userId: '',
          packageId: '',
          amount: '',
          paymentMethod: 'Bank Transfer',
          transactionRef: '',
          status: 'PAID',
          expiryDays: 180,
          notes: '',
        });
        loadData();
      }
    } catch (err: any) {
      error(err.message || 'Failed to record payment');
    }
  };

  const handleStatusChange = async (paymentId: string, newStatus: string) => {
    try {
      const res = await api.payments.updateStatus(paymentId, { status: newStatus });
      if (res.success) {
        success(`Payment status set to ${newStatus}.`);
        loadData();
      }
    } catch (err: any) {
      error(err.message || 'Failed to update status');
    }
  };

  const handleDeletePayment = async () => {
    if (!selectedPayment) return;
    try {
      const res = await api.payments.delete(selectedPayment.id);
      if (res.success) {
        success('Payment record removed.');
        setDeleteConfirmOpen(false);
        loadData();
      }
    } catch (err: any) {
      error(err.message || 'Failed to delete payment');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-5">
        <div>
          <h1 className="text-2xl font-black text-neutral-900 tracking-tight">Payment & Purchase Records</h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            Track manual student fee transactions, bank transfers, receipt slips, and subscription terms.
          </p>
        </div>
        <button
          onClick={() => {
            if (users.length > 0) setPaymentForm((p) => ({ ...p, userId: users[0].id }));
            setRecordModalOpen(true);
          }}
          className="px-4 py-2 bg-[#FACC15] hover:bg-[#EAB308] text-black font-bold text-xs rounded-xl transition-colors shadow-xs flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Record Manual Payment</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-xs flex flex-col md:flex-row items-center gap-3 justify-between">
        <form onSubmit={(e) => { e.preventDefault(); setPage(1); loadData(); }} className="relative flex-1 w-full md:max-w-md">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student name or transaction ref..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#FACC15]"
          />
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-700"
          >
            <option value="">All Statuses</option>
            <option value="PAID">PAID</option>
            <option value="PENDING">PENDING</option>
            <option value="REFUNDED">REFUNDED</option>
            <option value="FAILED">FAILED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8F8F6] border-b border-neutral-200 text-neutral-600 font-bold uppercase tracking-wider font-mono">
              <tr>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Package / Course</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Payment Method</th>
                <th className="py-3 px-4">Transaction Ref</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center">
                    <Skeleton className="h-6 w-1/3 mx-auto" />
                  </td>
                </tr>
              ) : payments.length > 0 ? (
                payments.map((p) => (
                  <tr key={p.id} className="hover:bg-neutral-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-neutral-900">{p.user?.fullName}</div>
                      <div className="text-[11px] font-mono text-neutral-500">@{p.user?.username}</div>
                    </td>
                    <td className="py-3 px-4 text-neutral-800 font-semibold">
                      {p.package?.name || 'Manual Enrollment'}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-sm text-neutral-900">
                      ${p.amount.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-neutral-700">
                      {p.paymentMethod}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-neutral-600">
                      {p.transactionRef}
                    </td>
                    <td className="py-3 px-4 text-neutral-500 font-mono text-[11px]">
                      {new Date(p.paymentDate).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={p.status}
                        onChange={(e) => handleStatusChange(p.id, e.target.value)}
                        className="px-2 py-1 text-xs font-semibold rounded bg-neutral-100 border border-neutral-300 text-neutral-800"
                      >
                        <option value="PAID">PAID</option>
                        <option value="PENDING">PENDING</option>
                        <option value="REFUNDED">REFUNDED</option>
                        <option value="CANCELLED">CANCELLED</option>
                        <option value="FAILED">FAILED</option>
                      </select>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedPayment(p);
                          setDeleteConfirmOpen(true);
                        }}
                        className="p-1.5 text-neutral-400 hover:text-red-600 rounded-lg"
                        title="Delete Record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-xs text-neutral-500">
                    No payment records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Modal */}
      <Modal
        isOpen={recordModalOpen}
        onClose={() => setRecordModalOpen(false)}
        title="Record Manual Payment / Fee Receipt"
        maxWidth="md"
      >
        <form onSubmit={handleRecordSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1">Student Account *</label>
            <select
              required
              value={paymentForm.userId}
              onChange={(e) => setPaymentForm({ ...paymentForm, userId: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-900"
            >
              <option value="">-- Choose Student --</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.fullName} (@{u.username})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">Package (Optional)</label>
              <select
                value={paymentForm.packageId}
                onChange={(e) => {
                  const pkgId = e.target.value;
                  const pkg = packages.find((p) => p.id === pkgId);
                  setPaymentForm({
                    ...paymentForm,
                    packageId: pkgId,
                    amount: pkg ? String(pkg.price) : paymentForm.amount,
                    expiryDays: pkg ? pkg.durationDays : paymentForm.expiryDays,
                  });
                }}
                className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-900"
              >
                <option value="">-- Custom Manual Fee --</option>
                {packages.map((pkg) => (
                  <option key={pkg.id} value={pkg.id}>
                    {pkg.name} (${pkg.price})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">Amount ($) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={paymentForm.amount}
                onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                placeholder="e.g. 49.99"
                className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">Payment Method *</label>
              <select
                value={paymentForm.paymentMethod}
                onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-900"
              >
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="JazzCash">JazzCash</option>
                <option value="EasyPaisa">EasyPaisa</option>
                <option value="Manual / Cash">Manual / Cash</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">Transaction Ref / Slip # *</label>
              <input
                type="text"
                required
                value={paymentForm.transactionRef}
                onChange={(e) => setPaymentForm({ ...paymentForm, transactionRef: e.target.value })}
                placeholder="e.g. TXN-849201"
                className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1">Access Duration (Days)</label>
            <input
              type="number"
              min="1"
              value={paymentForm.expiryDays}
              onChange={(e) => setPaymentForm({ ...paymentForm, expiryDays: parseInt(e.target.value, 10) || 30 })}
              className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1">Verification Notes</label>
            <textarea
              rows={2}
              value={paymentForm.notes}
              onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
              placeholder="e.g. Receipt verified via WhatsApp screenshot from branch."
              className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-900"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-neutral-100">
            <button
              type="button"
              onClick={() => setRecordModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-neutral-700 bg-neutral-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-black bg-[#FACC15] hover:bg-[#EAB308] rounded-lg"
            >
              Record & Grant Access
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDeletePayment}
        title="Delete Payment Record"
        message="Are you sure you want to remove this payment entry? Historical financial records should generally be retained for audit purposes."
        confirmText="Delete Record"
        isDestructive={true}
      />
    </div>
  );
};

