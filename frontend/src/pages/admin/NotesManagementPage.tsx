import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  ExternalLink,
} from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { Skeleton } from '../../components/common/Skeleton';

export const NotesManagementPage: React.FC = () => {
  const { success, error } = useToast();
  const navigate = useNavigate();

  const [notes, setNotes] = useState<any[]>([]);
  const [totalNotes, setTotalNotes] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<any>(null);

  const loadNotes = async () => {
    setIsLoading(true);
    try {
      const res = await api.notes.list({
        page,
        limit: 15,
        search,
        status: statusFilter,
      });
      if (res.success) {
        setNotes(res.notes);
        setTotalNotes(res.pagination.total);
      }
    } catch (err: any) {
      error(err.message || 'Failed to fetch notes');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNotes();
  }, [page, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadNotes();
  };

  const handleTogglePublish = async (note: any) => {
    const nextStatus = note.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
    try {
      const res = await api.notes.update(note.id, { status: nextStatus });
      if (res.success) {
        success(`Note set to ${nextStatus}.`);
        loadNotes();
      }
    } catch (err: any) {
      error(err.message || 'Failed to toggle status');
    }
  };

  const handleDeleteNote = async () => {
    if (!selectedNote) return;
    try {
      const res = await api.notes.delete(selectedNote.id);
      if (res.success) {
        success('Note deleted.');
        setDeleteConfirmOpen(false);
        loadNotes();
      }
    } catch (err: any) {
      error(err.message || 'Failed to delete note');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-5">
        <div>
          <h1 className="text-2xl font-black text-neutral-900 tracking-tight">Educational Notes Management</h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            Publish syllabus chapters, exam breakdowns, and configure protected reading visibility.
          </p>
        </div>
        <Link
          to="/admin/notes/new"
          className="px-4 py-2 bg-[#FACC15] hover:bg-[#EAB308] text-black font-bold text-xs rounded-xl transition-colors shadow-xs flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Compose New Note</span>
        </Link>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-xs flex flex-col md:flex-row items-center gap-3 justify-between">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full md:max-w-md">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notes by title or content keywords..."
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
            <option value="PUBLISHED">PUBLISHED</option>
            <option value="DRAFT">DRAFT</option>
            <option value="ARCHIVED">ARCHIVED</option>
          </select>
        </div>
      </div>

      {/* Notes Table */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8F8F6] border-b border-neutral-200 text-neutral-600 font-bold uppercase tracking-wider font-mono">
              <tr>
                <th className="py-3 px-4">Note Title</th>
                <th className="py-3 px-4">Course & Subject</th>
                <th className="py-3 px-4">Topic / Chapter</th>
                <th className="py-3 px-4">Visibility</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Created Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center">
                    <Skeleton className="h-6 w-1/3 mx-auto" />
                  </td>
                </tr>
              ) : notes.length > 0 ? (
                notes.map((note) => (
                  <tr key={note.id} className="hover:bg-neutral-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-neutral-900 line-clamp-1">{note.title}</div>
                      {note.description && (
                        <div className="text-[11px] text-neutral-500 line-clamp-1">{note.description}</div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-neutral-800 font-mono text-[11px]">
                        {note.course?.code || '—'}
                      </div>
                      <div className="text-[11px] text-neutral-500">{note.subject?.title || '—'}</div>
                    </td>
                    <td className="py-3 px-4 text-neutral-600">
                      {note.topic?.title || 'General Notes'}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={note.visibility === 'RESTRICTED_PAID' ? 'yellow' : 'neutral'}>
                        {note.visibility === 'RESTRICTED_PAID' ? 'Paid Enrolled' : 'Public'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleTogglePublish(note)}
                        className="cursor-pointer"
                        title="Click to toggle publish"
                      >
                        <Badge variant={note.status === 'PUBLISHED' ? 'active' : 'suspended'}>
                          {note.status}
                        </Badge>
                      </button>
                    </td>
                    <td className="py-3 px-4 text-neutral-500 font-mono text-[11px]">
                      {new Date(note.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          to={`/notes/${note.id}`}
                          title="Preview in Student Reader"
                          className="p-1.5 text-neutral-500 hover:text-black hover:bg-neutral-100 rounded-lg"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link
                          to={`/admin/notes/edit/${note.id}`}
                          title="Edit Note"
                          className="p-1.5 text-neutral-500 hover:text-black hover:bg-neutral-100 rounded-lg"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => {
                            setSelectedNote(note);
                            setDeleteConfirmOpen(true);
                          }}
                          title="Delete Note"
                          className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-xs text-neutral-500">
                    No notes found. Click "Compose New Note" to write one!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDeleteNote}
        title="Delete Educational Note"
        message={`Are you sure you want to permanently delete '${selectedNote?.title}'? This action cannot be undone.`}
        confirmText="Delete Note"
        isDestructive={true}
      />
    </div>
  );
};

