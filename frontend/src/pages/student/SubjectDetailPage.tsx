import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { ArrowLeft, BookOpen, FileText, ArrowRight, Layers, Lock } from 'lucide-react';
import { Skeleton } from '../../components/common/Skeleton';

export const SubjectDetailPage: React.FC = () => {
  const { subjectId } = useParams<{ subjectId: string }>();
  const [subjectNotes, setSubjectNotes] = useState<any[]>([]);
  const [subjectInfo, setSubjectInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (subjectId) {
      api.notes.list({ subjectId })
        .then((res) => {
          if (res.success) {
            setSubjectNotes(res.notes);
            if (res.notes.length > 0) {
              setSubjectInfo(res.notes[0].subject);
            }
          }
        })
        .finally(() => setIsLoading(false));
    }
  }, [subjectId]);

  return (
    <div className="space-y-6">
      <Link
        to="/courses"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-600 hover:text-black transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Courses
      </Link>

      <div className="bg-white rounded-2xl border border-neutral-200 p-6 sm:p-8 shadow-xs">
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2.5 py-1 text-xs font-mono font-bold bg-[#111111] text-[#FACC15] rounded">
            {subjectInfo?.code || 'SUBJECT'}
          </span>
          <span className="text-xs text-neutral-500 font-medium">Subject Module Notes</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
          {subjectInfo?.title || 'Subject Material'}
        </h1>
        <p className="mt-2 text-xs text-neutral-500">
          All study notes under this subject are protected and can be viewed inside our dedicated reader.
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-700">
            Available Study Notes ({subjectNotes.length})
          </h2>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : subjectNotes.length > 0 ? (
          <div className="space-y-3">
            {subjectNotes.map((note) => (
              <div
                key={note.id}
                className="bg-white p-5 rounded-xl border border-neutral-200 hover:border-black transition-all shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-neutral-100 text-neutral-700 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-[#111111] group-hover:text-[#FACC15] transition-colors">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-xs text-neutral-500 mb-1">
                      <span className="font-semibold text-neutral-700">
                        {note.topic?.title || 'General Notes'}
                      </span>
                      <span>•</span>
                      <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                    </div>
                    <h3 className="text-base font-bold text-neutral-900">
                      {note.title}
                    </h3>
                    {note.description && (
                      <p className="text-xs text-neutral-600 mt-1 max-w-2xl leading-relaxed">
                        {note.description}
                      </p>
                    )}
                  </div>
                </div>

                <Link
                  to={`/notes/${note.id}`}
                  className="px-4 py-2 bg-[#FACC15] hover:bg-[#EAB308] text-black font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap self-end sm:self-center shadow-xs"
                >
                  <span>Study Online</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 bg-white rounded-xl border border-neutral-200 text-center text-xs text-neutral-500">
            No notes have been uploaded for this subject yet.
          </div>
        )}
      </div>
    </div>
  );
};

