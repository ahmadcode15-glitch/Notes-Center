import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Megaphone, Plus, Trash2, Edit, CheckCircle, AlertCircle } from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { Skeleton } from '../../components/common/Skeleton';

export const AnnouncementsPage: React.FC = () => {
  const { success, error } = useToast();

  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [annForm, setAnnForm] = useState({
    title: '',
    content: '',
    type: 'INFO',
    isActive: true,
  });

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedAnn, setSelectedAnn] = useState<any>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await api.announcements.list();
      if (res.success) setAnnouncements(res.announcements);
    } catch (err: any) {
      error(err.message || 'Failed to fetch announcements');
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
      const res = await api.announcements.create(annForm);
      if (res.success) {
        success('Announcement published!');
        setCreateModalOpen(false);
        setAnnForm({ title: '', content: '', type: 'INFO', isActive: true });
        loadData();
      }
    } catch (err: any) {
      error(err.message || 'Failed to create announcement');
    }
  };

  const handleToggleActive = async (ann: any) => {
    try {
      const res = await api.announcements.update(ann.id, { isActive: !ann.isActive });
      if (res.success) {
        success('Announcement status updated.');
        loadData();
      }
    } catch (err: any) {
      error(err.message || 'Failed to update announcement');
    }
  };

  const handleDelete = async () => {
    if (!selectedAnn) return;
    try {
      const res = await api.announcements.delete(selectedAnn.id);
      if (res.success) {
        success('Announcement deleted.');
        setDeleteConfirmOpen(false);
        loadData();
      }
    } catch (err: any) {
      error(err.message || 'Failed to delete announcement');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-5">
        <div>
          <h1 className="text-2xl font-black text-neutral-900 tracking-tight">Platform Announcements</h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            Publish notices to students regarding new syllabus notes, exam schedules, or scheduled maintenance.
          </p>
        </div>
        <button
          onClick={() => setCreateModalOpen(true)}
          className="px-4 py-2 bg-[#FACC15] hover:bg-[#EAB308] text-black font-bold text-xs rounded-xl transition-colors shadow-xs flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Announcement</span>
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : announcements.length > 0 ? (
        <div className="space-y-3">
          {announcements.map((ann) => (
            <div
              key={ann.id}
              className="bg-white p-5 rounded-xl border border-neutral-200 shadow-xs flex items-start justify-between gap-4"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-neutral-100 text-neutral-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Megaphone className="w-4 h-4 text-[#FACC15]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-neutral-900">{ann.title}</h3>
                    <Badge variant={ann.isActive ? 'active' : 'disabled'}>
                      {ann.isActive ? 'Active on Student Dashboard' : 'Inactive'}
                    </Badge>
                  </div>
                  <p className="text-xs text-neutral-600 mt-1 leading-relaxed max-w-2xl">
                    {ann.content}
                  </p>
                  <div className="text-[10px] text-neutral-400 font-mono mt-2">
                    Published: {new Date(ann.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggleActive(ann)}
                  className="px-2.5 py-1 text-xs font-semibold rounded bg-neutral-100 hover:bg-neutral-200 text-neutral-700"
                >
                  {ann.isActive ? 'Hide' : 'Activate'}
                </button>
                <button
                  onClick={() => {
                    setSelectedAnn(ann);
                    setDeleteConfirmOpen(true);
                  }}
                  className="p-1.5 text-neutral-400 hover:text-red-600 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-12 bg-white rounded-2xl border border-neutral-200 text-center text-sm text-neutral-500">
          No announcements published yet.
        </div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Publish Platform Announcement"
        maxWidth="md"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1">Headline *</label>
            <input
              type="text"
              required
              value={annForm.title}
              onChange={(e) => setAnnForm({ ...annForm, title: e.target.value })}
              placeholder="e.g. Semester 2 Programming Notes Uploaded!"
              className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1">Notice Content *</label>
            <textarea
              rows={4}
              required
              value={annForm.content}
              onChange={(e) => setAnnForm({ ...annForm, content: e.target.value })}
              placeholder="Details displayed in the student dashboard banner."
              className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-900"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
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
              Publish Notice
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Delete Announcement"
        message="Are you sure you want to delete this announcement?"
        confirmText="Delete"
        isDestructive={true}
      />
    </div>
  );
};

