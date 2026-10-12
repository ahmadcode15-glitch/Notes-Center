import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import {
  BookOpen,
  Plus,
  Trash2,
  Edit,
  Layers,
  ChevronRight,
  ChevronDown,
  FolderPlus,
  FilePlus,
} from 'lucide-react';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { Skeleton } from '../../components/common/Skeleton';

export const CoursesManagementPage: React.FC = () => {
  const { success, error } = useToast();

  const [courses, setCourses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Expanded courses and semesters state
  const [expandedCourses, setExpandedCourses] = useState<Record<string, boolean>>({});
  const [courseDetails, setCourseDetails] = useState<Record<string, any>>({});

  // Modals
  const [createCourseOpen, setCreateCourseOpen] = useState(false);
  const [newCourse, setNewCourse] = useState({ title: '', code: '', description: '', status: 'ACTIVE' });

  const [createSemesterOpen, setCreateSemesterOpen] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [newSemester, setNewSemester] = useState({ title: '', order: 1 });

  const [createSubjectOpen, setCreateSubjectOpen] = useState(false);
  const [selectedSemesterId, setSelectedSemesterId] = useState('');
  const [newSubject, setNewSubject] = useState({ title: '', code: '', description: '' });

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'course' | 'semester' | 'subject'; id: string; name: string } | null>(null);

  const loadCourses = async () => {
    setIsLoading(true);
    try {
      const res = await api.courses.list();
      if (res.success) setCourses(res.courses);
    } catch (err: any) {
      error(err.message || 'Failed to fetch courses');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  const toggleCourseExpand = async (courseId: string) => {
    const isNowExpanded = !expandedCourses[courseId];
    setExpandedCourses({ ...expandedCourses, [courseId]: isNowExpanded });

    if (isNowExpanded && !courseDetails[courseId]) {
      try {
        const res = await api.courses.get(courseId);
        if (res.success) {
          setCourseDetails((prev) => ({ ...prev, [courseId]: res.course }));
        }
      } catch (err: any) {
        error(err.message || 'Failed to fetch course details');
      }
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.courses.create(newCourse);
      if (res.success) {
        success('Course program created!');
        setCreateCourseOpen(false);
        setNewCourse({ title: '', code: '', description: '', status: 'ACTIVE' });
        loadCourses();
      }
    } catch (err: any) {
      error(err.message || 'Failed to create course');
    }
  };

  const handleCreateSemester = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.courses.createSemester({
        courseId: selectedCourseId,
        title: newSemester.title,
        order: Number(newSemester.order),
      });
      if (res.success) {
        success('Semester added!');
        setCreateSemesterOpen(false);
        setNewSemester({ title: '', order: 1 });
        // Refresh this course details
        const cRes = await api.courses.get(selectedCourseId);
        if (cRes.success) {
          setCourseDetails((prev) => ({ ...prev, [selectedCourseId]: cRes.course }));
        }
      }
    } catch (err: any) {
      error(err.message || 'Failed to create semester');
    }
  };

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.courses.createSubject({
        semesterId: selectedSemesterId,
        title: newSubject.title,
        code: newSubject.code,
        description: newSubject.description,
      });
      if (res.success) {
        success('Subject module created!');
        setCreateSubjectOpen(false);
        setNewSubject({ title: '', code: '', description: '' });
        // Refresh parent course details
        if (selectedCourseId) {
          const cRes = await api.courses.get(selectedCourseId);
          if (cRes.success) {
            setCourseDetails((prev) => ({ ...prev, [selectedCourseId]: cRes.course }));
          }
        }
      }
    } catch (err: any) {
      error(err.message || 'Failed to create subject');
    }
  };

  const handleDeleteConfirmed = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === 'course') {
        await api.courses.delete(deleteTarget.id);
        success(`Course '${deleteTarget.name}' deleted.`);
        loadCourses();
      } else if (deleteTarget.type === 'semester') {
        await api.courses.deleteSemester(deleteTarget.id);
        success(`Semester deleted.`);
        if (selectedCourseId) {
          const cRes = await api.courses.get(selectedCourseId);
          if (cRes.success) {
            setCourseDetails((prev) => ({ ...prev, [selectedCourseId]: cRes.course }));
          }
        }
      } else if (deleteTarget.type === 'subject') {
        await api.courses.deleteSubject(deleteTarget.id);
        success(`Subject deleted.`);
        if (selectedCourseId) {
          const cRes = await api.courses.get(selectedCourseId);
          if (cRes.success) {
            setCourseDetails((prev) => ({ ...prev, [selectedCourseId]: cRes.course }));
          }
        }
      }
      setDeleteConfirmOpen(false);
    } catch (err: any) {
      error(err.message || 'Delete operation failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-5">
        <div>
          <h1 className="text-2xl font-black text-neutral-900 tracking-tight">Academic Curriculum Structure</h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            Build and organize Programs &rarr; Semesters/Levels &rarr; Subjects &rarr; Topics.
          </p>
        </div>
        <button
          onClick={() => setCreateCourseOpen(true)}
          className="px-4 py-2 bg-[#FACC15] hover:bg-[#EAB308] text-black font-bold text-xs rounded-xl transition-colors shadow-xs flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Course Program</span>
        </button>
      </div>

      {/* Courses List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : courses.length > 0 ? (
          courses.map((course) => {
            const isExpanded = !!expandedCourses[course.id];
            const detail = courseDetails[course.id];

            return (
              <div
                key={course.id}
                className="bg-white rounded-2xl border border-neutral-200 shadow-xs overflow-hidden transition-all"
              >
                {/* Course Header Bar */}
                <div className="p-5 flex items-center justify-between bg-white hover:bg-neutral-50/60 transition-colors">
                  <div
                    onClick={() => toggleCourseExpand(course.id)}
                    className="flex items-center gap-3 cursor-pointer flex-1"
                  >
                    <div className="p-1 rounded-md text-neutral-500 hover:text-black">
                      {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 text-xs font-mono font-bold bg-[#111111] text-[#FACC15] rounded">
                          {course.code}
                        </span>
                        <h2 className="text-base font-bold text-neutral-900">{course.title}</h2>
                      </div>
                      <p className="text-xs text-neutral-500 mt-0.5 line-clamp-1">
                        {course.description || 'Program syllabus and note containers.'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedCourseId(course.id);
                        setCreateSemesterOpen(true);
                      }}
                      className="px-2.5 py-1.5 text-xs font-semibold text-neutral-800 bg-neutral-100 hover:bg-neutral-200 rounded-lg flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Semester
                    </button>
                    <button
                      onClick={() => {
                        setDeleteTarget({ type: 'course', id: course.id, name: course.title });
                        setDeleteConfirmOpen(true);
                      }}
                      className="p-1.5 text-neutral-400 hover:text-red-600 rounded-lg"
                      title="Delete Course"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Expanded Semesters & Subjects View */}
                {isExpanded && (
                  <div className="border-t border-neutral-100 bg-[#FBFBFA] p-5 space-y-4">
                    {detail?.semesters && detail.semesters.length > 0 ? (
                      detail.semesters.map((sem: any) => (
                        <div
                          key={sem.id}
                          className="bg-white rounded-xl border border-neutral-200 p-4 shadow-2xs space-y-3"
                        >
                          <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
                            <div className="flex items-center gap-2">
                              <Layers className="w-4 h-4 text-[#FACC15]" />
                              <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wide">
                                {sem.title}
                              </h3>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  setSelectedCourseId(course.id);
                                  setSelectedSemesterId(sem.id);
                                  setCreateSubjectOpen(true);
                                }}
                                className="px-2 py-1 text-[11px] font-semibold text-neutral-800 bg-neutral-100 hover:bg-neutral-200 rounded flex items-center gap-1"
                              >
                                <Plus className="w-3 h-3" />
                                Add Subject
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedCourseId(course.id);
                                  setDeleteTarget({ type: 'semester', id: sem.id, name: sem.title });
                                  setDeleteConfirmOpen(true);
                                }}
                                className="p-1 text-neutral-400 hover:text-red-600 rounded"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Subjects in this semester */}
                          {sem.subjects && sem.subjects.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                              {sem.subjects.map((sub: any) => (
                                <div
                                  key={sub.id}
                                  className="p-3 bg-neutral-50 rounded-lg border border-neutral-200 flex items-start justify-between text-xs"
                                >
                                  <div>
                                    <div className="font-mono text-[10px] text-neutral-500 font-bold">
                                      {sub.code}
                                    </div>
                                    <div className="font-bold text-neutral-900 mt-0.5">{sub.title}</div>
                                    <div className="text-[11px] text-neutral-500 mt-1">
                                      {sub._count?.notes || 0} Educational Notes
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => {
                                      setSelectedCourseId(course.id);
                                      setDeleteTarget({ type: 'subject', id: sub.id, name: sub.title });
                                      setDeleteConfirmOpen(true);
                                    }}
                                    className="p-1 text-neutral-400 hover:text-red-600 rounded"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-3 text-xs text-neutral-400">
                              No subjects added yet in {sem.title}.
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4 text-xs text-neutral-500">
                        No semesters created for this course. Click "Add Semester" above.
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="p-12 bg-white rounded-2xl border border-neutral-200 text-center text-sm text-neutral-500">
            No courses found. Create your first academic degree or preparation program!
          </div>
        )}
      </div>

      {/* Create Course Modal */}
      <Modal
        isOpen={createCourseOpen}
        onClose={() => setCreateCourseOpen(false)}
        title="Add New Degree Program / Course"
        maxWidth="md"
      >
        <form onSubmit={handleCreateCourse} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1">Course Title *</label>
            <input
              type="text"
              required
              value={newCourse.title}
              onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
              placeholder="e.g. BS Computer Science (BSCS)"
              className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#FACC15]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1">Course Code *</label>
            <input
              type="text"
              required
              value={newCourse.code}
              onChange={(e) => setNewCourse({ ...newCourse, code: e.target.value })}
              placeholder="e.g. BSCS-2026 or MDCAT"
              className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#FACC15]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1">Description</label>
            <textarea
              rows={3}
              value={newCourse.description}
              onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
              placeholder="Summary of syllabus, semester duration, and examination prep."
              className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#FACC15]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-neutral-100">
            <button
              type="button"
              onClick={() => setCreateCourseOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-neutral-700 bg-neutral-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-black bg-[#FACC15] hover:bg-[#EAB308] rounded-lg"
            >
              Create Course
            </button>
          </div>
        </form>
      </Modal>

      {/* Create Semester Modal */}
      <Modal
        isOpen={createSemesterOpen}
        onClose={() => setCreateSemesterOpen(false)}
        title="Add Semester / Academic Level"
        maxWidth="sm"
      >
        <form onSubmit={handleCreateSemester} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1">Semester Title *</label>
            <input
              type="text"
              required
              value={newSemester.title}
              onChange={(e) => setNewSemester({ ...newSemester, title: e.target.value })}
              placeholder="e.g. Semester 1, Year 2, or High-Yield Stage"
              className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1">Order Index</label>
            <input
              type="number"
              min="1"
              value={newSemester.order}
              onChange={(e) => setNewSemester({ ...newSemester, order: parseInt(e.target.value, 10) || 1 })}
              className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-900"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setCreateSemesterOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-neutral-700 bg-neutral-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-black bg-[#FACC15] hover:bg-[#EAB308] rounded-lg"
            >
              Add Semester
            </button>
          </div>
        </form>
      </Modal>

      {/* Create Subject Modal */}
      <Modal
        isOpen={createSubjectOpen}
        onClose={() => setCreateSubjectOpen(false)}
        title="Add Subject Module"
        maxWidth="md"
      >
        <form onSubmit={handleCreateSubject} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1">Subject Title *</label>
            <input
              type="text"
              required
              value={newSubject.title}
              onChange={(e) => setNewSubject({ ...newSubject, title: e.target.value })}
              placeholder="e.g. Programming Fundamentals"
              className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1">Subject Code *</label>
            <input
              type="text"
              required
              value={newSubject.code}
              onChange={(e) => setNewSubject({ ...newSubject, code: e.target.value })}
              placeholder="e.g. CS-101 or BIO-01"
              className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1">Description</label>
            <textarea
              rows={2}
              value={newSubject.description}
              onChange={(e) => setNewSubject({ ...newSubject, description: e.target.value })}
              placeholder="Optional overview of the topics covered in this subject."
              className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-900"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setCreateSubjectOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-neutral-700 bg-neutral-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-black bg-[#FACC15] hover:bg-[#EAB308] rounded-lg"
            >
              Add Subject
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDeleteConfirmed}
        title={`Delete ${deleteTarget?.type}`}
        message={`Are you sure you want to delete '${deleteTarget?.name}'? All child semesters, subjects, or notes may be detached or removed.`}
        confirmText="Confirm Delete"
        isDestructive={true}
      />
    </div>
  );
};

