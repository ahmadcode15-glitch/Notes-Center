import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api, resolveFileUrl } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import {
  ArrowLeft,
  Save,
  Eye,
  Edit3,
  Heading,
  Bold,
  Italic,
  Code,
  List,
  Table as TableIcon,
  Quote,
  Sparkles,
  UploadCloud,
  FileText,
  Image as ImageIcon,
  Paperclip,
  X,
} from 'lucide-react';
import { NoteReader } from '../../components/notes/NoteReader';

export const NoteEditorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error } = useToast();

  const isEditing = !!id;

  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourseData, setSelectedCourseData] = useState<any>(null);

  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    courseId: '',
    semesterId: '',
    subjectId: '',
    topicId: '',
    status: 'PUBLISHED',
    visibility: 'RESTRICTED_PAID',
    fileType: 'MARKDOWN',
    coverImage: '',
    filePath: '',
    content: `# Chapter Title Here

## 1. Executive Summary
Write your clear, structured educational breakdown here...

---

## 2. Key Concepts & Formulas
- Point 1: Fundamental principle
- Point 2: Core rule

\`\`\`cpp
// Sample Code Demonstration
int main() {
    return 0;
}
\`\`\`

> **Exam Tip**: Highlight essential high-yield notes here.`,
  });

  // Load courses and note details if editing
  useEffect(() => {
    api.courses.list().then((res) => {
      if (res.success) setCourses(res.courses);
    }).catch(() => {});

    if (id) {
      api.notes.get(id).then((res) => {
        if (res.success && res.note) {
          const n = res.note;
          setFormData({
            title: n.title,
            description: n.description || '',
            courseId: n.course?.id || '',
            semesterId: n.semester?.id || '',
            subjectId: n.subject?.id || '',
            topicId: n.topic?.id || '',
            status: n.status,
            visibility: n.visibility,
            fileType: n.fileType || 'MARKDOWN',
            coverImage: n.coverImage || '',
            filePath: n.filePath || '',
            content: n.content,
          });
        }
      }).catch((err) => error(err.message || 'Failed to load note'));
    }
  }, [id]);

  // Load course details when courseId changes
  useEffect(() => {
    if (formData.courseId) {
      api.courses.get(formData.courseId).then((res) => {
        if (res.success) setSelectedCourseData(res.course);
      }).catch(() => {});
    }
  }, [formData.courseId]);

  const insertSnippet = (snippet: string) => {
    setFormData((prev) => ({
      ...prev,
      content: prev.content + '\n' + snippet,
    }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingFile(true);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase();
      
      // If text or markdown file, load its content directly into the editor
      if (ext === 'txt' || ext === 'md') {
        const text = await file.text();
        setFormData((prev) => ({
          ...prev,
          title: prev.title || file.name.replace(/\.[^/.]+$/, ''),
          content: text,
        }));
        success(`Loaded content from file: ${file.name}`);
      } else {
        // Upload image, PDF, or document to server
        const res = await api.upload(file);
        if (res.success && res.file) {
          const fileUrl = res.file.url;
          if (res.file.mimetype.startsWith('image/')) {
            setFormData((prev) => ({
              ...prev,
              coverImage: prev.coverImage || fileUrl,
              content: prev.content + `\n\n![${file.name}](${fileUrl})\n`,
            }));
            success(`Image uploaded and embedded: ${file.name}`);
          } else {
            setFormData((prev) => ({
              ...prev,
              filePath: fileUrl,
              fileType: ext === 'pdf' ? 'PDF' : 'DOCUMENT',
              content: prev.content + `\n\n> 📄 **Attached Document**: [${file.name}](${fileUrl})\n`,
            }));
            success(`Document uploaded and attached: ${file.name}`);
          }
        }
      }
    } catch (err: any) {
      error(err.message || 'Failed to upload file');
    } finally {
      setIsUploadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      error('Title and Content cannot be empty.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditing) {
        const res = await api.notes.update(id!, formData);
        if (res.success) {
          success('Note updated successfully!');
          navigate('/admin/notes');
        }
      } else {
        const res = await api.notes.create(formData);
        if (res.success) {
          success('Note published successfully!');
          navigate('/admin/notes');
        }
      }
    } catch (err: any) {
      error(err.message || 'Failed to save note');
    } finally {
      setIsSubmitting(false);
    }
  };

  const previewNoteObj: any = {
    id: id || 'preview-temp-id',
    title: formData.title || 'Untitled Note Preview',
    description: formData.description,
    content: formData.content,
    coverImage: formData.coverImage,
    filePath: formData.filePath,
    fileType: formData.fileType,
    createdAt: new Date().toISOString(),
    course: selectedCourseData,
    subject: { title: 'Selected Subject Module', code: 'MOD' },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-neutral-200 pb-5">
        <Link
          to="/admin/notes"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-600 hover:text-black transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Notes List
        </Link>

        {/* View Mode Switcher */}
        <div className="flex items-center bg-neutral-200/80 rounded-xl p-1 gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('editor')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'editor' ? 'bg-white text-black shadow-xs' : 'text-neutral-600'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Editor</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'preview' ? 'bg-[#111111] text-[#FACC15] shadow-xs' : 'text-neutral-600'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Live Student Preview</span>
          </button>
        </div>
      </div>

      {activeTab === 'preview' ? (
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs">
          <div className="mb-4 text-xs font-mono font-bold text-neutral-500 uppercase">
            Simulated Student Reader View
          </div>
          <NoteReader
            note={previewNoteObj}
            watermark={{
              enabled: true,
              opacity: 0.15,
              studentUsername: 'preview_student',
              sessionId: 'SIM-PREVIEW',
              watermarkText: 'Notes Center • Preview Mode',
            }}
            onBack={() => setActiveTab('editor')}
          />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Metadata Section */}
          <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-wider font-mono">
              Note Metadata & Course Mapping
            </h2>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                Note Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Chapter 1: Variables, Memory & Data Representation"
                className="w-full px-4 py-2.5 text-sm bg-neutral-50 border border-neutral-300 rounded-xl text-neutral-900 font-bold focus:outline-none focus:ring-2 focus:ring-[#FACC15]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                Short Description / Exam Scope
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief summary of topics covered for students."
                className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#FACC15]"
              />
            </div>

            {/* Hierarchy Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Course</label>
                <select
                  value={formData.courseId}
                  onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                  className="w-full px-2.5 py-2 text-xs bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-900"
                >
                  <option value="">-- Select Course --</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} - {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Semester</label>
                <select
                  value={formData.semesterId}
                  onChange={(e) => setFormData({ ...formData, semesterId: e.target.value })}
                  className="w-full px-2.5 py-2 text-xs bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-900"
                >
                  <option value="">-- Select Semester --</option>
                  {selectedCourseData?.semesters?.map((sem: any) => (
                    <option key={sem.id} value={sem.id}>
                      {sem.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-2.5 py-2 text-xs bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-900"
                >
                  <option value="PUBLISHED">PUBLISHED</option>
                  <option value="DRAFT">DRAFT</option>
                  <option value="ARCHIVED">ARCHIVED</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Visibility</label>
                <select
                  value={formData.visibility}
                  onChange={(e) => setFormData({ ...formData, visibility: e.target.value })}
                  className="w-full px-2.5 py-2 text-xs bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-900"
                >
                  <option value="RESTRICTED_PAID">Paid Enrolled Students Only</option>
                  <option value="PUBLIC_PREVIEW">Public Free Preview</option>
                </select>
              </div>
            </div>

            {/* Attached Media & Files Overview */}
            {(formData.coverImage || formData.filePath) && (
              <div className="pt-3 border-t border-neutral-100 flex flex-wrap items-center gap-3">
                {formData.coverImage && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-neutral-100 rounded-xl border border-neutral-200 text-xs">
                    <img
                      src={resolveFileUrl(formData.coverImage)}
                      alt="Cover Preview"
                      className="w-6 h-6 rounded object-cover"
                    />
                    <span className="font-semibold text-neutral-800">Cover Image Attached</span>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, coverImage: '' })}
                      className="p-0.5 hover:bg-neutral-200 rounded text-neutral-500 hover:text-black ml-1"
                      title="Remove Cover Image"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {formData.filePath && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 rounded-xl border border-amber-200 text-xs">
                    <FileText className="w-4 h-4 text-amber-700" />
                    <span className="font-semibold text-amber-900">
                      Document Attached ({formData.fileType})
                    </span>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, filePath: '', fileType: 'MARKDOWN' })}
                      className="p-0.5 hover:bg-amber-100 rounded text-amber-700 hover:text-black ml-1"
                      title="Remove Attachment"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Content Editor Section with Formatting Shortcuts (#22 requirement) */}
          <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-100 pb-3">
              <span className="text-xs font-bold text-neutral-900 uppercase font-mono">
                Educational Content Editor (Markdown & Formatted Text)
              </span>

              {/* Formatting Helper Buttons */}
              <div className="flex flex-wrap items-center gap-1 bg-neutral-100 p-1 rounded-lg border border-neutral-200">
                <button
                  type="button"
                  onClick={() => insertSnippet('## Section Heading')}
                  className="p-1.5 text-neutral-700 hover:bg-white rounded hover:shadow-2xs text-xs font-bold"
                  title="Insert Heading"
                >
                  <Heading className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => insertSnippet('**Important Term**')}
                  className="p-1.5 text-neutral-700 hover:bg-white rounded hover:shadow-2xs text-xs font-bold"
                  title="Bold"
                >
                  <Bold className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => insertSnippet('*italic emphasis*')}
                  className="p-1.5 text-neutral-700 hover:bg-white rounded hover:shadow-2xs text-xs"
                  title="Italic"
                >
                  <Italic className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => insertSnippet('```cpp\n// Enter code snippet\n```')}
                  className="p-1.5 text-neutral-700 hover:bg-white rounded hover:shadow-2xs text-xs"
                  title="Insert Code Block"
                >
                  <Code className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => insertSnippet('- Bullet Item 1\n- Bullet Item 2')}
                  className="p-1.5 text-neutral-700 hover:bg-white rounded hover:shadow-2xs text-xs"
                  title="List"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => insertSnippet('| Concept | Explanation | Exam Focus |\n| :--- | :--- | :--- |\n| Item 1 | Description | High Yield |')}
                  className="p-1.5 text-neutral-700 hover:bg-white rounded hover:shadow-2xs text-xs"
                  title="Insert Table"
                >
                  <TableIcon className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => insertSnippet('> **Critical Examination Alert**: Enter key note here.')}
                  className="p-1.5 text-neutral-700 hover:bg-white rounded hover:shadow-2xs text-xs"
                  title="Insert Callout Quote"
                >
                  <Quote className="w-3.5 h-3.5" />
                </button>

                <div className="h-4 w-px bg-neutral-300 mx-1" />

                {/* File / Image Upload Button */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".txt,.md,.png,.jpg,.jpeg,.webp,.pdf,.doc,.docx"
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingFile}
                  className="px-2.5 py-1 text-xs font-bold bg-[#111111] text-[#FACC15] hover:bg-neutral-800 rounded-md shadow-2xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  title="Upload image, text file, or PDF into note"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>{isUploadingFile ? 'Uploading...' : 'Upload File / Image / PDF'}</span>
                </button>
              </div>
            </div>

            <textarea
              rows={22}
              required
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full p-4 text-xs sm:text-sm font-mono bg-neutral-50 border border-neutral-300 rounded-xl text-neutral-900 leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#FACC15]"
            />
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/admin/notes')}
              className="px-5 py-2.5 text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 text-xs font-bold text-black bg-[#FACC15] hover:bg-[#EAB308] rounded-xl shadow-xs flex items-center gap-2 disabled:opacity-60"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'Saving Note...' : isEditing ? 'Update Note' : 'Publish Note'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

