import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Package as PackageIcon, Plus, Trash2, Edit, CheckCircle } from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { Skeleton } from '../../components/common/Skeleton';

export const PackagesManagementPage: React.FC = () => {
  const { success, error } = useToast();

  const [packages, setPackages] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [packageForm, setPackageForm] = useState({
    name: '',
    description: '',
    price: '',
    durationDays: 180,
    courseIds: [] as string[],
    status: 'ACTIVE',
  });

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<any>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [pkgRes, cRes] = await Promise.all([
        api.packages.list(),
        api.courses.list(),
      ]);
      if (pkgRes.success) setPackages(pkgRes.packages);
      if (cRes.success) setCourses(cRes.courses);
    } catch (err: any) {
      error(err.message || 'Failed to load packages');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.packages.create(packageForm);
      if (res.success) {
        success('Educational package created!');
        setCreateModalOpen(false);
        setPackageForm({
          name: '',
          description: '',
          price: '',
          durationDays: 180,
          courseIds: [],
          status: 'ACTIVE',
        });
        loadData();
      }
    } catch (err: any) {
      error(err.message || 'Failed to create package');
    }
  };

  const handleDeletePackage = async () => {
    if (!selectedPackage) return;
    try {
      const res = await api.packages.delete(selectedPackage.id);
      if (res.success) {
        success('Package deleted.');
        setDeleteConfirmOpen(false);
        loadData();
      }
    } catch (err: any) {
      error(err.message || 'Failed to delete package');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-5">
        <div>
          <h1 className="text-2xl font-black text-neutral-900 tracking-tight">Educational Packages</h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            Bundle syllabus courses into purchasable term licenses (e.g. "Semester 1 Full Access", "MDCAT High Yield").
          </p>
        </div>
        <button
          onClick={() => setCreateModalOpen(true)}
          className="px-4 py-2 bg-[#FACC15] hover:bg-[#EAB308] text-black font-bold text-xs rounded-xl transition-colors shadow-xs flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Package</span>
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : packages.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Badge variant={pkg.status === 'ACTIVE' ? 'active' : 'suspended'}>
                    {pkg.status}
                  </Badge>
                  <span className="font-mono font-bold text-xs text-neutral-500">
                    {pkg.durationDays} Days Duration
                  </span>
                </div>

                <h3 className="text-lg font-bold text-neutral-900">{pkg.name}</h3>
                <p className="text-xs text-neutral-600 mt-1.5 leading-relaxed">
                  {pkg.description || 'Full curriculum study access.'}
                </p>

                <div className="mt-4 pt-4 border-t border-neutral-100 space-y-1 text-xs">
                  <div className="font-bold text-neutral-800">Included Courses:</div>
                  {pkg.courses && pkg.courses.length > 0 ? (
                    pkg.courses.map((c: any) => (
                      <div key={c.courseId} className="text-neutral-600 text-[11px] flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-[#FACC15]" />
                        <span>{c.course?.title} ({c.course?.code})</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-neutral-400 text-[11px]">All general curriculum courses</div>
                  )}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-neutral-100 flex items-center justify-between">
                <div className="font-mono font-black text-xl text-neutral-950">
                  ${pkg.price.toFixed(2)}
                </div>
                <button
                  onClick={() => {
                    setSelectedPackage(pkg);
                    setDeleteConfirmOpen(true);
                  }}
                  className="p-1.5 text-neutral-400 hover:text-red-600 rounded-lg"
                  title="Delete Package"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-12 bg-white rounded-2xl border border-neutral-200 text-center text-sm text-neutral-500">
          No packages created yet. Click "Create New Package" to get started!
        </div>
      )}

      {/* Create Package Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create Educational Subscription Package"
        maxWidth="md"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1">Package Name *</label>
            <input
              type="text"
              required
              value={packageForm.name}
              onChange={(e) => setPackageForm({ ...packageForm, name: e.target.value })}
              placeholder="e.g. BSCS Semester 1 Full Access"
              className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1">Description</label>
            <textarea
              rows={2}
              value={packageForm.description}
              onChange={(e) => setPackageForm({ ...packageForm, description: e.target.value })}
              placeholder="Summary of included lecture notes, chapters, and past questions."
              className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">Price ($) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={packageForm.price}
                onChange={(e) => setPackageForm({ ...packageForm, price: e.target.value })}
                placeholder="49.99"
                className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">Duration (Days)</label>
              <input
                type="number"
                min="1"
                value={packageForm.durationDays}
                onChange={(e) => setPackageForm({ ...packageForm, durationDays: parseInt(e.target.value, 10) || 30 })}
                className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1">Attach Course(s)</label>
            <div className="space-y-1.5 max-h-40 overflow-y-auto p-2 bg-neutral-50 rounded-lg border border-neutral-200">
              {courses.map((c) => {
                const isSelected = packageForm.courseIds.includes(c.id);
                return (
                  <label key={c.id} className="flex items-center gap-2 text-xs text-neutral-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setPackageForm({ ...packageForm, courseIds: [...packageForm.courseIds, c.id] });
                        } else {
                          setPackageForm({ ...packageForm, courseIds: packageForm.courseIds.filter((id) => id !== c.id) });
                        }
                      }}
                    />
                    <span>{c.code} - {c.title}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-neutral-100">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-neutral-700 bg-neutral-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-black bg-[#FACC15] hover:bg-[#EAB308] rounded-lg"
            >
              Create Package
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDeletePackage}
        title="Delete Educational Package"
        message={`Are you sure you want to remove package '${selectedPackage?.name}'? Existing user access records will remain unaffected.`}
        confirmText="Delete Package"
        isDestructive={true}
      />
    </div>
  );
};

