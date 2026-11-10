import React, { useEffect, useState, useRef } from 'react';
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
  Plus,
  Trash2,
  CheckCircle2,
  Layers,
  ZoomIn,
} from 'lucide-react';
import { NoteReader } from '../../components/notes/NoteReader';

const DEFAULT_MARKDOWN_TEMPLATE = `# Chapter Title Here

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

> **Exam Tip**: Highlight essential high-yield notes here.`;

interface ExtractedImage {
  fullMatch: string;
  alt: string;
  url: string;
}

function extractImagesFromContent(content: string): ExtractedImage[] {
  const images: ExtractedImage[] = [];
  // Match ![alt](url)
  const regex = /!\[(.*?)\]\((.*?)\)/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    images.push({
      fullMatch: match[0],
      alt: match[1] || 'Note Page',
      url: match[2],
    });
  }

  // Also match standalone image URLs if not already captured
  const lines = content.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (
      !trimmed.includes(' ') &&
      (/^data:image\/[a-z0-9+]+;base64,/i.test(trimmed) ||
        /^\/api\/upload\/file\/[a-zA-Z0-9_-]+/i.test(trimmed) ||
        /^\/uploads\/[^\s]+/i.test(trimmed) ||
        /^https?:\/\/[^\s]+\.(png|jpe?g|webp|gif|svg)(\?.*)?$/i.test(trimmed))
    ) {
      if (!images.some((img) => img.url === trimmed)) {
        images.push({
          fullMatch: trimmed,
          alt: 'Note Page',
          url: trimmed,
        });
      }
    }
  }

  return images;
}

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
  const [uploadProgressText, setUploadProgressText] = useState('');

  // Refs for file inputs
  const imageFilesInputRef = useRef<HTMLInputElement>(null);
  const documentFileInputRef = useRef<HTMLInputElement>(null);
  const textImportInputRef = useRef<HTMLInputElement>(null);
  const coverImageInputRef = useRef<HTMLInputElement>(null);

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
    content: DEFAULT_MARKDOWN_TEMPLATE,
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
            content: n.content || '',
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

  // Upload Note Pictures (handles 1 or multiple pictures e.g. handwritten notes photos)
  const handleImagesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingFile(true);
    setUploadProgressText(`Uploading ${files.length} picture(s)...`);

    try {
      const fileList = Array.from(files);
      let uploadedCount = 0;
      let newMarkdownImages = '';
      let firstUploadedUrl = '';

      // Upload each image
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        setUploadProgressText(`Uploading picture ${i + 1} of ${fileList.length}...`);
        const res = await api.upload(file);
        if (res.success && res.file) {
          const fileUrl = res.file.url;
          if (!firstUploadedUrl) firstUploadedUrl = fileUrl;
          const pageTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_\-\s]/g, ' ') || `Page ${i + 1}`;
          newMarkdownImages += `\n\n![${pageTitle}](${fileUrl})\n`;
          uploadedCount++;
        }
      }

      if (uploadedCount > 0) {
        setFormData((prev) => {
          // If content was still the default template, remove the dummy text and keep only pictures
          const isDefault = prev.content.trim() === DEFAULT_MARKDOWN_TEMPLATE.trim() ||
            prev.content.includes('# Chapter Title Here\n\n## 1. Executive Summary');
          const baseContent = isDefault ? '' : prev.content.trim();
          const cleanTitle = prev.title || fileList[0].name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_\-\s]/g, ' ');

          return {
            ...prev,
            title: cleanTitle,
            coverImage: prev.coverImage || firstUploadedUrl,
            fileType: 'IMAGE',
            content: (baseContent ? baseContent + '\n\n' : '') + newMarkdownImages.trim(),
          };
        });
        success(`${uploadedCount} picture(s) uploaded and embedded in note!`);
      }
    } catch (err: any) {
      error(err.message || 'Failed to upload pictures');
    } finally {
      setIsUploadingFile(false);
      setUploadProgressText('');
      if (imageFilesInputRef.current) imageFilesInputRef.current.value = '';
    }
  };

  // Upload Document / PDF file
  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingFile(true);
    setUploadProgressText(`Uploading document '${file.name}'...`);

    try {
      const ext = file.name.split('.').pop()?.toLowerCase();
      const res = await api.upload(file);
      if (res.success && res.file) {
        const fileUrl = res.file.url;
        const isPdf = ext === 'pdf';

        setFormData((prev) => {
          const isDefault = prev.content.trim() === DEFAULT_MARKDOWN_TEMPLATE.trim() ||
            prev.content.includes('# Chapter Title Here\n\n## 1. Executive Summary');
          const baseContent = isDefault ? '' : prev.content.trim();
          const cleanTitle = prev.title || file.name.replace(/\.[^/.]+$/, '');

          return {
            ...prev,
            title: cleanTitle,
            filePath: fileUrl,
            fileType: isPdf ? 'PDF' : 'DOCUMENT',
            content: (baseContent ? baseContent + '\n\n' : '') + `> 📄 **Attached Document**: [${file.name}](${fileUrl})\n`,
          };
        });
        success(`Document uploaded and attached: ${file.name}`);
      }
    } catch (err: any) {
      error(err.message || 'Failed to upload document');
    } finally {
      setIsUploadingFile(false);
      setUploadProgressText('');
      if (documentFileInputRef.current) documentFileInputRef.current.value = '';
    }
  };

  // Import Plain Text or Markdown file directly
  const handleTextImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      setFormData((prev) => ({
        ...prev,
        title: prev.title || file.name.replace(/\.[^/.]+$/, ''),
        content: text,
      }));
      success(`Loaded content from file: ${file.name}`);
    } catch (err: any) {
      error(err.message || 'Failed to read text file');
    } finally {
      if (textImportInputRef.current) textImportInputRef.current.value = '';
    }
  };

  // Upload Note Cover Image
  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingFile(true);
    setUploadProgressText('Uploading cover image...');

    try {
      const res = await api.upload(file);
      if (res.success && res.file) {
        setFormData((prev) => ({
          ...prev,
          coverImage: res.file.url,
        }));
        success('Cover image updated!');
      }
    } catch (err: any) {
      error(err.message || 'Failed to upload cover image');
    } finally {
      setIsUploadingFile(false);
      setUploadProgressText('');
      if (coverImageInputRef.current) coverImageInputRef.current.value = '';
    }
  };

  // Remove a specific image from content
  const removeImageFromContent = (img: ExtractedImage) => {
    setFormData((prev) => {
      const updatedContent = prev.content
        .replace(img.fullMatch, '')
        .replace(/\n\s*\n\s*\n/g, '\n\n')
        .trim();
      const remainingImages = extractImagesFromContent(updatedContent);
      const isCover = prev.coverImage === img.url;

      return {
        ...prev,
        content: updatedContent,
        coverImage: isCover ? (remainingImages[0]?.url || '') : prev.coverImage,
      };
    });
    success('Picture removed from note.');
  };

  // Set an image as cover image
  const setAsCoverImage = (url: string) => {
    setFormData((prev) => ({
      ...prev,
      coverImage: url,
    }));
    success('Set as note cover image!');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      error('Note Title is required.');
      return;
    }

    const hasContent = !!formData.content.trim();
    const hasFile = !!formData.filePath;
    const hasCover = !!formData.coverImage;

    if (!hasContent && !hasFile && !hasCover) {
      error('Please provide note content, upload pictures, or attach a document.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        content: formData.content.trim() || (formData.coverImage ? `![Note Cover](${formData.coverImage})` : 'Note Material'),
      };

      if (isEditing) {
        const res = await api.notes.update(id!, payload);
        if (res.success) {
          success('Note updated successfully!');
          navigate('/admin/notes');
        }
      } else {
        const res = await api.notes.create(payload);
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

  const extractedImages = extractImagesFromContent(formData.content);

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
      {/* Hidden file inputs */}
      <input
        type="file"
        ref={imageFilesInputRef}
        onChange={handleImagesUpload}
        accept="image/*"
        multiple
        className="hidden"
      />
      <input
        type="file"
        ref={documentFileInputRef}
        onChange={handleDocumentUpload}
        accept=".pdf,.doc,.docx"
        className="hidden"
      />
      <input
        type="file"
        ref={textImportInputRef}
        onChange={handleTextImport}
        accept=".txt,.md"
        className="hidden"
      />
      <input
        type="file"
        ref={coverImageInputRef}
        onChange={handleCoverUpload}
        accept="image/*"
        className="hidden"
      />

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
          <div className="mb-4 text-xs font-mono font-bold text-neutral-500 uppercase flex items-center justify-between">
            <span>Simulated Student Reader View</span>
            <span className="text-[#111111] font-semibold">How students see this note</span>
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
                      className="w-7 h-7 rounded object-cover border border-neutral-300"
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

          {/* Upload Dropzones */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {/* Note Pictures Card */}
            <div
              onClick={() => imageFilesInputRef.current?.click()}
              className="bg-amber-50/60 hover:bg-amber-50 border-2 border-dashed border-amber-300 hover:border-[#FACC15] rounded-2xl p-5 text-center cursor-pointer transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="w-11 h-11 rounded-xl bg-amber-200 text-amber-900 group-hover:bg-[#111111] group-hover:text-[#FACC15] flex items-center justify-center mx-auto mb-2.5 transition-colors">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-neutral-900">Notes Pictures (Photo / Scan)</h3>
                <p className="text-xs text-neutral-600 mt-1 leading-relaxed">
                  Upload photos of notes from mobile or camera (PNG, JPG, WebP). Supports multiple pages!
                </p>
              </div>
              <div className="mt-3 inline-flex items-center justify-center gap-1.5 text-xs font-bold text-black bg-[#FACC15] hover:bg-[#EAB308] px-3.5 py-1.5 rounded-xl shadow-2xs">
                <Plus className="w-3.5 h-3.5" />
                <span>Upload Pictures</span>
              </div>
            </div>

            {/* Document / PDF Card */}
            <div
              onClick={() => documentFileInputRef.current?.click()}
              className="bg-neutral-50 hover:bg-neutral-100/80 border-2 border-dashed border-neutral-300 hover:border-black rounded-2xl p-5 text-center cursor-pointer transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="w-11 h-11 rounded-xl bg-neutral-200 text-neutral-800 group-hover:bg-[#111111] group-hover:text-[#FACC15] flex items-center justify-center mx-auto mb-2.5 transition-colors">
                  <FileText className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-neutral-900">PDF / Document File</h3>
                <p className="text-xs text-neutral-600 mt-1 leading-relaxed">
                  Attach official PDF notes, syllabus slides, or Word documents (.pdf, .doc, .docx).
                </p>
              </div>
              <div className="mt-3 inline-flex items-center justify-center gap-1.5 text-xs font-bold text-neutral-800 bg-neutral-200 hover:bg-neutral-300 px-3.5 py-1.5 rounded-xl shadow-2xs">
                <Paperclip className="w-3.5 h-3.5" />
                <span>Attach File</span>
              </div>
            </div>

            {/* Set Cover Image or Import Text */}
            <div className="bg-neutral-50 hover:bg-neutral-100/80 border-2 border-dashed border-neutral-300 hover:border-black rounded-2xl p-5 text-center transition-all flex flex-col justify-between">
              <div>
                <div className="w-11 h-11 rounded-xl bg-neutral-200 text-neutral-800 flex items-center justify-center mx-auto mb-2.5">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-neutral-900">Cover & Text Import</h3>
                <p className="text-xs text-neutral-600 mt-1 leading-relaxed">
                  Set custom cover banner or load pre-written markdown / text files.
                </p>
              </div>
              <div className="mt-3 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => coverImageInputRef.current?.click()}
                  className="px-2.5 py-1.5 bg-neutral-200 hover:bg-neutral-300 text-neutral-800 text-xs font-bold rounded-lg transition-colors"
                >
                  Set Cover
                </button>
                <button
                  type="button"
                  onClick={() => textImportInputRef.current?.click()}
                  className="px-2.5 py-1.5 bg-neutral-200 hover:bg-neutral-300 text-neutral-800 text-xs font-bold rounded-lg transition-colors"
                >
                  Import .md
                </button>
              </div>
            </div>
          </div>

          {/* Upload in-progress indicator */}
          {isUploadingFile && (
            <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl flex items-center gap-3 animate-pulse">
              <UploadCloud className="w-5 h-5 text-amber-700 animate-bounce" />
              <div className="text-xs font-bold text-amber-900">
                {uploadProgressText || 'Uploading file to permanent storage, please wait...'}
              </div>
            </div>
          )}

          {/* Visual Note Pictures Gallery (Pic Form Display) */}
          {extractedImages.length > 0 && (
            <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#111111] text-[#FACC15] flex items-center justify-center">
                    <ImageIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-neutral-900">
                      Uploaded Notes Pictures ({extractedImages.length} {extractedImages.length === 1 ? 'Page' : 'Pages'})
                    </h3>
                    <p className="text-[11px] text-neutral-500">
                      Displayed in Picture Form. Students can view each page and click to zoom in.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => imageFilesInputRef.current?.click()}
                  disabled={isUploadingFile}
                  className="px-3 py-1.5 bg-[#FACC15] hover:bg-[#EAB308] text-black text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add More Pictures</span>
                </button>
              </div>

              {/* Gallery Grid of uploaded pictures */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
                {extractedImages.map((img, idx) => (
                  <div
                    key={idx}
                    className="relative group bg-neutral-50 rounded-xl overflow-hidden border border-neutral-200 hover:border-black/40 p-2 flex flex-col justify-between transition-all shadow-2xs"
                  >
                    <div className="relative aspect-3/4 w-full rounded-lg overflow-hidden bg-neutral-100 border border-neutral-200 flex items-center justify-center">
                      <img
                        src={resolveFileUrl(img.url)}
                        alt={img.alt}
                        className="w-full h-full object-contain bg-white"
                      />
                      <span className="absolute top-1.5 left-1.5 bg-black/80 text-[#FACC15] text-[10px] font-mono font-bold px-1.5 py-0.5 rounded">
                        Page {idx + 1}
                      </span>
                      {formData.coverImage === img.url && (
                        <span className="absolute bottom-1.5 left-1.5 bg-[#FACC15] text-black text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs">
                          Cover
                        </span>
                      )}
                    </div>

                    <div className="mt-2.5 flex items-center justify-between text-xs pt-1 border-t border-neutral-100">
                      <button
                        type="button"
                        onClick={() => setAsCoverImage(img.url)}
                        className={`text-[10px] font-bold hover:underline ${
                          formData.coverImage === img.url ? 'text-amber-800' : 'text-neutral-500 hover:text-black'
                        }`}
                      >
                        {formData.coverImage === img.url ? '★ Current Cover' : 'Set as Cover'}
                      </button>

                      <button
                        type="button"
                        onClick={() => removeImageFromContent(img)}
                        className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                        title="Delete this picture"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Content / Text Editor Section */}
          <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-100 pb-3">
              <span className="text-xs font-bold text-neutral-900 uppercase font-mono">
                Notes Content & Explanation (Text & Formatted Markdown)
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

                <button
                  type="button"
                  onClick={() => imageFilesInputRef.current?.click()}
                  disabled={isUploadingFile}
                  className="px-2.5 py-1 text-xs font-bold bg-[#111111] text-[#FACC15] hover:bg-neutral-800 rounded-md shadow-2xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  title="Upload picture of notes"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Add Picture</span>
                </button>

                <button
                  type="button"
                  onClick={() => documentFileInputRef.current?.click()}
                  disabled={isUploadingFile}
                  className="px-2.5 py-1 text-xs font-bold bg-neutral-200 hover:bg-neutral-300 text-neutral-800 rounded-md flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  title="Attach PDF or Document file"
                >
                  <Paperclip className="w-3.5 h-3.5" />
                  <span>Attach Document</span>
                </button>
              </div>
            </div>

            <textarea
              rows={extractedImages.length > 0 ? 12 : 20}
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Write or paste your note text, markdown, or picture links here..."
              className="w-full p-4 text-xs sm:text-sm font-mono bg-neutral-50 border border-neutral-300 rounded-xl text-neutral-900 leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#FACC15]"
            />

            <div className="flex items-center justify-between text-xs text-neutral-500 font-mono">
              <span>Characters: {formData.content.length}</span>
              <span>Images Embedded: {extractedImages.length}</span>
            </div>
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
