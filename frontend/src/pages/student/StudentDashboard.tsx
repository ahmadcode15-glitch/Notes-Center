import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import {
  BookOpen,
  Clock,
  Smartphone,
  ShieldCheck,
  Megaphone,
  History,
  ArrowRight,
  Calendar,
  AlertTriangle,
  Search,
  FileText,
} from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { CardSkeleton } from '../../components/common/Skeleton';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<any[]>([]);
  const [approvedNotes, setApprovedNotes] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [recentViews, setRecentViews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [coursesRes, annRes, recentRes, notesRes] = await Promise.all([
          api.courses.studentTree(),
          api.announcements.active(),
          api.notes.recentlyViewed(),
          api.notes.list(),
        ]);

        if (coursesRes.success) setCourses(coursesRes.courses || []);
        if (annRes.success) setAnnouncements(annRes.announcements || []);
        if (recentRes.success) setRecentViews(recentRes.recentViews || []);
        if (notesRes.success) setApprovedNotes(notesRes.notes || []);
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const isExpired = user?.accessExpiry && new Date(user.accessExpiry) < new Date();

  const formatExpiry = (expiry: string | null | undefined) => {
    if (!expiry) return 'Unlimited / Lifetime Access';
    const date = new Date(expiry);
    const now = new Date();
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return 'Access Expired';
    if (diffDays === 0) return 'Expires Today';
    return `${diffDays} days remaining (${date.toLocaleDateString()})`;
  };

  return (
    <div className="space-y-8">
      {/* Expiry Warning Banner if expired or near expiry */}
      {isExpired && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between text-xs text-red-800">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <div>
              <span className="font-bold">Access Expired:</span> Your account access expired on{' '}
              {new Date(user?.accessExpiry!).toLocaleDateString()}. Protected study notes are currently locked.
            </div>
          </div>
          <Link
            to="/support"
            className="px-3 py-1.5 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors whitespace-nowrap"
          >
            Contact to Renew
          </Link>
        </div>
      )}

      {/* Welcome & Account Summary Section (#9 requirement) */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-500">
                Student Workspace
              </span>
              <Badge variant={user?.status === 'ACTIVE' ? 'active' : 'expired'}>
                {user?.status}
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight mt-1">
              Welcome back, {user?.fullName}
            </h1>
            <p className="text-xs sm:text-sm text-neutral-500 mt-1">
              Signed in as <span className="font-mono text-neutral-800">@{user?.username}</span> • 24-Hour Active Session
            </p>
          </div>

          <Link
            to="/search"
            className="flex items-center gap-2 px-4 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-semibold text-xs rounded-xl transition-colors border border-neutral-200 self-start md:self-auto"
          >
            <Search className="w-4 h-4 text-neutral-600" />
            <span>Search Study Notes</span>
          </Link>
        </div>

        {/* 4 Metadata Status Tiles */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8 pt-6 border-t border-neutral-100">
          <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200/70">
            <div className="flex items-center gap-1.5 text-xs font-medium text-neutral-500">
              <ShieldCheck className="w-3.5 h-3.5 text-neutral-400" />
              <span>Access Status</span>
            </div>
            <div className="mt-1 text-sm font-bold text-neutral-900">
              {isExpired ? 'Expired' : 'Active Subscription'}
            </div>
          </div>

          <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200/70">
            <div className="flex items-center gap-1.5 text-xs font-medium text-neutral-500">
              <Clock className="w-3.5 h-3.5 text-neutral-400" />
              <span>Access Expiry</span>
            </div>
            <div className="mt-1 text-xs font-bold text-neutral-900 truncate" title={formatExpiry(user?.accessExpiry)}>
              {formatExpiry(user?.accessExpiry)}
            </div>
          </div>

          <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200/70">
            <div className="flex items-center gap-1.5 text-xs font-medium text-neutral-500">
              <Smartphone className="w-3.5 h-3.5 text-neutral-400" />
              <span>Allowed Devices</span>
            </div>
            <div className="mt-1 text-sm font-bold text-neutral-900">
              {user?.maxDevices} {user?.maxDevices === 1 ? 'Device' : 'Devices'} Max
            </div>
          </div>

          <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200/70">
            <div className="flex items-center gap-1.5 text-xs font-medium text-neutral-500">
              <Calendar className="w-3.5 h-3.5 text-neutral-400" />
              <span>Last Login</span>
            </div>
            <div className="mt-1 text-xs font-bold text-neutral-900">
              {user?.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'First Session'}
            </div>
          </div>
        </div>
      </div>

      {/* Announcements Section (#23 requirement) */}
      {announcements.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-700">
            <Megaphone className="w-4 h-4 text-[#FACC15]" />
            <span>Platform Announcements</span>
          </div>

          <div className="space-y-2">
            {announcements.map((ann) => (
              <div
                key={ann.id}
                className="bg-white p-4 rounded-xl border border-neutral-200 shadow-xs flex items-start gap-3"
              >
                <span className="w-2 h-2 rounded-full bg-[#FACC15] mt-1.5 flex-shrink-0" />
                <div className="text-xs">
                  <div className="font-bold text-neutral-900">{ann.title}</div>
                  <div className="text-neutral-600 mt-0.5 leading-relaxed">{ann.content}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recently Viewed Notes (#9 requirement) */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-700">
            <History className="w-4 h-4 text-neutral-500" />
            <span>Recently Viewed Notes</span>
          </div>
          {recentViews.length > 0 && (
            <Link to="/recently-viewed" className="text-xs font-semibold text-neutral-700 hover:text-black">
              View All →
            </Link>
          )}
        </div>

        {recentViews.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentViews.slice(0, 3).map(({ note, viewedAt }) => (
              <Link
                key={note.id}
                to={`/notes/${note.id}`}
                className="bg-white p-5 rounded-xl border border-neutral-200 hover:border-black transition-all shadow-xs flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] text-neutral-500 mb-2">
                    <span className="font-mono font-bold px-1.5 py-0.5 bg-neutral-100 rounded text-neutral-800">
                      {note.subject?.code || 'NOTE'}
                    </span>
                    <span>{new Date(viewedAt).toLocaleDateString()}</span>
                  </div>
                  <h3 className="text-sm font-bold text-neutral-900 group-hover:text-black transition-colors line-clamp-2">
                    {note.title}
                  </h3>
                  {note.description && (
                    <p className="text-xs text-neutral-500 mt-1 line-clamp-2">{note.description}</p>
                  )}
                </div>
                <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-600 font-semibold">
                  <span>Resume Reading</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="p-6 bg-white rounded-xl border border-neutral-200 text-center text-xs text-neutral-500">
            You haven't opened any notes yet. Browse your courses below to start studying!
          </div>
        )}
      </div>

      {/* My Approved Study Notes */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-700">
            <FileText className="w-4 h-4 text-[#FACC15]" />
            <span>My Approved Study Notes ({approvedNotes.length})</span>
          </div>
          <Link to="/search" className="text-xs font-semibold text-neutral-700 hover:text-black">
            Search Notes →
          </Link>
        </div>

        {approvedNotes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {approvedNotes.map((note) => (
              <Link
                key={note.id}
                to={`/notes/${note.id}`}
                className="bg-white p-5 rounded-2xl border border-neutral-200 hover:border-black transition-all shadow-xs flex flex-col justify-between group hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] text-neutral-500 mb-2.5">
                    <span className="font-mono font-bold px-2 py-0.5 bg-[#111111] text-[#FACC15] rounded">
                      {note.course?.code || note.subject?.code || 'STUDY NOTE'}
                    </span>
                    <span className="text-[10px] text-neutral-400">
                      {new Date(note.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-neutral-900 group-hover:text-black transition-colors line-clamp-2">
                    {note.title}
                  </h3>
                  {note.description && (
                    <p className="text-xs text-neutral-500 mt-1.5 line-clamp-2 leading-relaxed">
                      {note.description}
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between text-xs font-bold text-neutral-800">
                  <span className="text-neutral-500 group-hover:text-black">Read Chapter</span>
                  <div className="w-7 h-7 rounded-full bg-neutral-100 group-hover:bg-[#FACC15] flex items-center justify-center transition-colors">
                    <ArrowRight className="w-3.5 h-3.5 text-black group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="p-8 bg-white rounded-2xl border border-dashed border-neutral-300 text-center">
            <FileText className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
            <h4 className="text-xs font-bold text-neutral-800">No Study Notes Assigned Yet</h4>
            <p className="text-[11px] text-neutral-500 mt-1 max-w-sm mx-auto">
              Your instructor has not approved any specific study notes for your account yet. Check back once your teacher assigns your syllabus.
            </p>
          </div>
        )}
      </div>

      {/* Enrolled Courses / Educational Content Hierarchy (#10 requirement) */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-700">
            <BookOpen className="w-4 h-4 text-neutral-500" />
            <span>My Enrolled Courses</span>
          </div>
          <Link to="/courses" className="text-xs font-semibold text-neutral-700 hover:text-black">
            Full Curriculum →
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : courses.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {courses.map((course) => (
              <div
                key={course.id}
                className="bg-white rounded-xl border border-neutral-200 p-6 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 py-1 text-xs font-mono font-bold bg-[#111111] text-[#FACC15] rounded">
                      {course.code}
                    </span>
                    <Badge variant={course.hasAccess ? 'active' : 'yellow'}>
                      {course.hasAccess ? 'Full Course Access' : 'Partial / Preview'}
                    </Badge>
                  </div>
                  <h3 className="text-base font-bold text-neutral-900">{course.title}</h3>
                  <p className="mt-1.5 text-xs text-neutral-600 leading-relaxed">
                    {course.description}
                  </p>

                  {/* Semesters & Subjects preview */}
                  <div className="mt-4 space-y-2">
                    {course.semesters?.map((sem: any) => (
                      <div key={sem.id} className="p-3 bg-neutral-50 rounded-lg border border-neutral-100">
                        <div className="text-xs font-bold text-neutral-800 mb-1.5">
                          {sem.title}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {sem.subjects?.map((sub: any) => (
                            <Link
                              key={sub.id}
                              to={`/subjects/${sub.id}`}
                              className="px-2 py-1 text-[11px] font-medium bg-white hover:bg-neutral-100 rounded border border-neutral-200 text-neutral-800 flex items-center gap-1 transition-colors"
                            >
                              <span>{sub.title}</span>
                              <span className="text-[10px] text-neutral-400">
                                ({sub._count?.notes || 0})
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
                    {course.semesters?.length || 0} Semesters Included
                  </span>
                  <Link
                    to={`/courses/${course.id}`}
                    className="px-3.5 py-1.5 bg-[#111111] hover:bg-black text-[#FACC15] font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <span>Open Course</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 bg-white rounded-xl border border-neutral-200 text-center text-xs text-neutral-500">
            No enrolled courses found. Contact the administration team to grant access to your enrolled program.
          </div>
        )}
      </div>
    </div>
  );
};

