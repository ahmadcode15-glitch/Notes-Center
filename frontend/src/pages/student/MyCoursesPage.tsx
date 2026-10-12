import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { BookOpen, ArrowRight, Layers, CheckCircle } from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { CardSkeleton } from '../../components/common/Skeleton';

export const MyCoursesPage: React.FC = () => {
  const [courses, setCourses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.courses.studentTree()
      .then((res) => {
        if (res.success) setCourses(res.courses);
      })
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="border-b border-neutral-200 pb-5">
        <h1 className="text-2xl font-black text-neutral-900 tracking-tight">Academic Curriculum</h1>
        <p className="text-xs sm:text-sm text-neutral-500 mt-1">
          Explore degree programs, semesters, and subjects available under your enrollment.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : courses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {courses.map((course) => (
            <div
              key={course.id}
              className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-1 text-xs font-mono font-bold bg-[#111111] text-[#FACC15] rounded">
                    {course.code}
                  </span>
                  <Badge variant={course.hasAccess ? 'active' : 'yellow'}>
                    {course.hasAccess ? 'Enrolled / Full Access' : 'Partial Access'}
                  </Badge>
                </div>

                <h2 className="text-lg font-bold text-neutral-900">{course.title}</h2>
                <p className="text-xs text-neutral-600 mt-2 leading-relaxed">
                  {course.description || 'Comprehensive lecture notes, problem sets, and past papers.'}
                </p>

                {/* Semesters List */}
                <div className="mt-5 space-y-3">
                  {course.semesters?.map((sem: any) => (
                    <div key={sem.id} className="p-3 bg-neutral-50 rounded-xl border border-neutral-100">
                      <div className="text-xs font-bold text-neutral-800 flex items-center justify-between mb-2">
                        <span>{sem.title}</span>
                        <span className="text-[11px] text-neutral-500 font-normal">
                          {sem.subjects?.length || 0} Subjects
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {sem.subjects?.map((sub: any) => (
                          <Link
                            key={sub.id}
                            to={`/subjects/${sub.id}`}
                            className="px-2.5 py-1.5 bg-white hover:bg-neutral-100 rounded-lg border border-neutral-200 text-xs font-medium text-neutral-800 flex items-center justify-between transition-colors"
                          >
                            <span className="truncate">{sub.title}</span>
                            <span className="text-[10px] text-neutral-400 font-mono ml-1">
                              {sub._count?.notes || 0}
                            </span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-neutral-100 flex items-center justify-between">
                <span className="text-xs text-neutral-500">
                  {course.semesters?.length || 0} Semesters Organized
                </span>
                <Link
                  to={`/courses/${course.id}`}
                  className="px-4 py-2 bg-[#FACC15] hover:bg-[#EAB308] text-black font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5"
                >
                  <span>Explore Program</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-12 bg-white rounded-2xl border border-neutral-200 text-center text-sm text-neutral-500">
          No courses currently available.
        </div>
      )}
    </div>
  );
};

