import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { BookOpen, ArrowLeft, ArrowRight, Layers, FileText } from 'lucide-react';
import { Skeleton } from '../../components/common/Skeleton';

export const CourseDetailPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const [course, setCourse] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (courseId) {
      api.courses.get(courseId)
        .then((res) => {
          if (res.success) setCourse(res.course);
        })
        .finally(() => setIsLoading(false));
    }
  }, [courseId]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-4 w-2/3" />
        <div className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="p-8 text-center text-sm text-neutral-500 bg-white rounded-xl border border-neutral-200">
        Course not found.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        to="/courses"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-600 hover:text-black transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to All Courses
      </Link>

      <div className="bg-white rounded-2xl border border-neutral-200 p-6 sm:p-8 shadow-xs">
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2.5 py-1 text-xs font-mono font-bold bg-[#111111] text-[#FACC15] rounded">
            {course.code}
          </span>
          <span className="text-xs text-neutral-500 font-medium">Academic Degree Program</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
          {course.title}
        </h1>
        {course.description && (
          <p className="mt-3 text-sm text-neutral-600 max-w-3xl leading-relaxed">
            {course.description}
          </p>
        )}
      </div>

      <div className="space-y-6">
        <h2 className="text-lg font-bold text-neutral-900">Program Semesters & Levels</h2>

        {course.semesters && course.semesters.length > 0 ? (
          course.semesters.map((sem: any) => (
            <div key={sem.id} className="bg-white rounded-xl border border-neutral-200 p-5 shadow-xs">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3 mb-4">
                <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#FACC15]" />
                  <span>{sem.title}</span>
                </h3>
                <span className="text-xs text-neutral-500">
                  {sem.subjects?.length || 0} Subjects
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sem.subjects?.map((sub: any) => (
                  <Link
                    key={sub.id}
                    to={`/subjects/${sub.id}`}
                    className="p-4 rounded-xl border border-neutral-200 bg-[#F8F8F6] hover:bg-white hover:border-black transition-all flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs font-mono text-neutral-500 mb-2">
                        <span className="font-bold text-neutral-800">{sub.code}</span>
                        <span>{sub._count?.notes || 0} Notes</span>
                      </div>
                      <h4 className="text-sm font-bold text-neutral-900 group-hover:text-black">
                        {sub.title}
                      </h4>
                      {sub.description && (
                        <p className="text-xs text-neutral-500 mt-1 line-clamp-2">
                          {sub.description}
                        </p>
                      )}
                    </div>
                    <div className="mt-4 pt-2 border-t border-neutral-200/60 flex items-center justify-between text-xs font-semibold text-neutral-700">
                      <span>View Study Notes</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="p-8 bg-white rounded-xl border border-neutral-200 text-center text-xs text-neutral-500">
            No semesters created for this course yet.
          </div>
        )}
      </div>
    </div>
  );
};

