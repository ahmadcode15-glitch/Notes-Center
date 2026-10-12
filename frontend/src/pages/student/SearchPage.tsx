import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { Search as SearchIcon, FileText, BookOpen, Layers, ArrowRight } from 'lucide-react';

export const SearchPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{
    notes: any[];
    subjects: any[];
    courses: any[];
  }>({ notes: [], subjects: [], courses: [] });
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults({ notes: [], subjects: [], courses: [] });
      setHasSearched(false);
      return;
    }

    const timer = setTimeout(() => {
      setIsSearching(true);
      api.notes.search(query.trim())
        .then((res) => {
          if (res.success) {
            setResults(res.results);
            setHasSearched(true);
          }
        })
        .finally(() => setIsSearching(false));
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const totalResults = results.notes.length + results.subjects.length + results.courses.length;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="border-b border-neutral-200 pb-5">
        <h1 className="text-2xl font-black text-neutral-900 tracking-tight">Search Notes & Curriculum</h1>
        <p className="text-xs sm:text-sm text-neutral-500 mt-1">
          Search across enrolled courses, subjects, chapters, and study modules.
        </p>
      </div>

      {/* Search Input Box */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-400">
          <SearchIcon className="w-5 h-5" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Type keywords (e.g. 'Variables', 'Recursion', 'CS-101', 'MDCAT')..."
          autoFocus
          className="block w-full pl-12 pr-4 py-3.5 text-sm sm:text-base bg-white border border-neutral-300 rounded-2xl text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#FACC15] focus:border-black shadow-xs transition-all"
        />
        {isSearching && (
          <div className="absolute inset-y-0 right-0 pr-4 flex items-center text-xs font-semibold text-neutral-400">
            Searching...
          </div>
        )}
      </div>

      {/* Results Section */}
      {hasSearched && (
        <div className="space-y-6">
          <div className="text-xs font-bold uppercase tracking-wider text-neutral-500 font-mono">
            {totalResults} {totalResults === 1 ? 'Result' : 'Results'} Found for "{query}"
          </div>

          {/* Notes Results */}
          {results.notes.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-bold text-neutral-800 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-[#FACC15]" />
                <span>Study Notes ({results.notes.length})</span>
              </h2>
              <div className="space-y-2">
                {results.notes.map((note) => (
                  <Link
                    key={note.id}
                    to={`/notes/${note.id}`}
                    className="block bg-white p-4 rounded-xl border border-neutral-200 hover:border-black transition-all shadow-xs group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono font-bold text-neutral-500">
                        {note.course?.code} • {note.subject?.title}
                      </span>
                      <span className="text-xs font-bold text-neutral-900 group-hover:underline flex items-center gap-1">
                        Read Online <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-neutral-900 mt-1">{note.title}</h3>
                    {note.description && (
                      <p className="text-xs text-neutral-500 mt-1 line-clamp-1">{note.description}</p>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Subjects Results */}
          {results.subjects.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-bold text-neutral-800 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-neutral-600" />
                <span>Subjects ({results.subjects.length})</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {results.subjects.map((sub) => (
                  <Link
                    key={sub.id}
                    to={`/subjects/${sub.id}`}
                    className="p-4 bg-white rounded-xl border border-neutral-200 hover:border-black transition-all flex items-center justify-between"
                  >
                    <div>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 bg-neutral-100 rounded text-neutral-700 font-bold">
                        {sub.code}
                      </span>
                      <h4 className="text-xs font-bold text-neutral-900 mt-1">{sub.title}</h4>
                    </div>
                    <ArrowRight className="w-4 h-4 text-neutral-400" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Courses Results */}
          {results.courses.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-bold text-neutral-800 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-neutral-600" />
                <span>Programs ({results.courses.length})</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {results.courses.map((course) => (
                  <Link
                    key={course.id}
                    to={`/courses/${course.id}`}
                    className="p-4 bg-white rounded-xl border border-neutral-200 hover:border-black transition-all flex items-center justify-between"
                  >
                    <div>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 bg-[#111111] text-[#FACC15] rounded font-bold">
                        {course.code}
                      </span>
                      <h4 className="text-xs font-bold text-neutral-900 mt-1">{course.title}</h4>
                    </div>
                    <ArrowRight className="w-4 h-4 text-neutral-400" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {totalResults === 0 && (
            <div className="p-12 bg-white rounded-2xl border border-neutral-200 text-center text-sm text-neutral-500">
              No results found matching "{query}". Only authorized notes in your enrolled curriculum are visible.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

