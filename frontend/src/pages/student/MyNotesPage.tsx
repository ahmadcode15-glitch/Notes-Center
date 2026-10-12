import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { FileText, ArrowRight, Search, BookOpen, Layers } from 'lucide-react';
import { CardSkeleton } from '../../components/common/Skeleton';

export const MyNotesPage: React.FC = () => {
  const [notes, setNotes] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.notes
      .list({ search })
      .then((res) => {
        if (res.success) setNotes(res.notes || []);
      })
      .finally(() => setIsLoading(false));
  }, [search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-5">
        <div>
          <h1 className="text-2xl font-black text-neutral-900 tracking-tight">My Study Notes</h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            Access and read all protected educational notes and syllabus modules approved by your teacher.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search approved notes..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-neutral-300 rounded-xl text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#FACC15]"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : notes.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {notes.map((note) => (
            <Link
              key={note.id}
              to={`/notes/${note.id}`}
              className="bg-white p-6 rounded-2xl border border-neutral-200 hover:border-black transition-all shadow-xs flex flex-col justify-between group hover:shadow-md"
            >
              <div>
                <div className="flex items-center justify-between text-[11px] text-neutral-500 mb-3">
                  <span className="font-mono font-bold px-2 py-0.5 bg-[#111111] text-[#FACC15] rounded">
                    {note.course?.code || note.subject?.code || 'STUDY NOTE'}
                  </span>
                  <span className="text-[10px] text-neutral-400">
                    {new Date(note.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <h2 className="text-base font-bold text-neutral-900 group-hover:text-black transition-colors line-clamp-2">
                  {note.title}
                </h2>

                {note.description && (
                  <p className="text-xs text-neutral-600 mt-2 line-clamp-3 leading-relaxed">
                    {note.description}
                  </p>
                )}
              </div>

              <div className="mt-5 pt-3.5 border-t border-neutral-100 flex items-center justify-between text-xs font-bold text-neutral-900">
                <span>Open in Reader</span>
                <div className="w-7 h-7 rounded-full bg-neutral-100 group-hover:bg-[#FACC15] flex items-center justify-center transition-colors">
                  <ArrowRight className="w-3.5 h-3.5 text-black group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="p-12 bg-white rounded-2xl border border-neutral-200 text-center space-y-3">
          <FileText className="w-12 h-12 text-neutral-300 mx-auto" />
          <h3 className="text-sm font-bold text-neutral-900">No Study Notes Found</h3>
          <p className="text-xs text-neutral-500 max-w-md mx-auto leading-relaxed">
            {search
              ? `No approved notes match "${search}". Try searching another keyword.`
              : 'You do not have any notes approved by your teacher yet. Once your teacher approves notes, they will appear here.'}
          </p>
        </div>
      )}
    </div>
  );
};

