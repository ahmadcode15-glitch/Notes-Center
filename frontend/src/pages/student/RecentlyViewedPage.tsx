import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { History, FileText, ArrowRight, Clock } from 'lucide-react';
import { Skeleton } from '../../components/common/Skeleton';

export const RecentlyViewedPage: React.FC = () => {
  const [recentViews, setRecentViews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.notes.recentlyViewed()
      .then((res) => {
        if (res.success) setRecentViews(res.recentViews);
      })
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="border-b border-neutral-200 pb-5">
        <h1 className="text-2xl font-black text-neutral-900 tracking-tight">Recently Studied Notes</h1>
        <p className="text-xs sm:text-sm text-neutral-500 mt-1">
          Quickly resume reading notes and topics from your recent study sessions.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : recentViews.length > 0 ? (
        <div className="space-y-3">
          {recentViews.map(({ note, viewedAt }) => (
            <Link
              key={note.id}
              to={`/notes/${note.id}`}
              className="block bg-white p-5 rounded-xl border border-neutral-200 hover:border-black transition-all shadow-xs group"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-lg bg-neutral-100 text-neutral-700 flex items-center justify-center flex-shrink-0 group-hover:bg-[#111111] group-hover:text-[#FACC15] transition-colors mt-0.5">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-[11px] text-neutral-500">
                      <span className="font-mono font-bold text-neutral-700">
                        {note.subject?.code}
                      </span>
                      <span>•</span>
                      <span>{note.subject?.title}</span>
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-neutral-900 mt-0.5 group-hover:text-black">
                      {note.title}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-3 sm:self-center self-end pt-2 sm:pt-0">
                  <div className="flex items-center gap-1 text-[11px] text-neutral-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Viewed {new Date(viewedAt).toLocaleDateString()}</span>
                  </div>
                  <span className="px-3 py-1 bg-neutral-100 group-hover:bg-[#FACC15] text-neutral-800 group-hover:text-black text-xs font-bold rounded-lg transition-colors flex items-center gap-1">
                    Resume <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="p-12 bg-white rounded-2xl border border-neutral-200 text-center text-sm text-neutral-500">
          No recently viewed notes found. Start reading notes to track your progress here!
        </div>
      )}
    </div>
  );
};

