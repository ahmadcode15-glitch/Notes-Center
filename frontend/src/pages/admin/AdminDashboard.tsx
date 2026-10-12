import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import {
  Users,
  BookOpen,
  FileText,
  Laptop,
  Clock,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  CreditCard,
  UserCheck,
  Plus,
  ShieldAlert,
} from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { Skeleton } from '../../components/common/Skeleton';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const [stats, setStats] = useState<any>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [recentPayments, setRecentPayments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.stats.dashboard()
      .then((res) => {
        if (res.success) {
          setStats(res.stats);
          setRecentActivity(res.recentActivity);
          setRecentPayments(res.recentPayments);
        }
      })
      .catch((err) => console.error('Failed to load stats:', err))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-1/4" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
      </div>
    );
  }

  const statCards = isSuperAdmin
    ? [
        {
          title: 'Total Students',
          value: stats?.totalUsers || 0,
          icon: Users,
          meta: `${stats?.activeUsers || 0} Active • ${stats?.expiredUsers || 0} Expired`,
          color: 'bg-neutral-900 text-white',
        },
        {
          title: 'Active Device Sessions',
          value: stats?.activeSessions || 0,
          icon: Laptop,
          meta: `${stats?.todayLogins || 0} Logins Today`,
          color: 'bg-neutral-900 text-[#FACC15]',
        },
        {
          title: 'Academic Courses',
          value: stats?.totalCourses || 0,
          icon: BookOpen,
          meta: `${stats?.totalSubjects || 0} Subjects Configured`,
          color: 'bg-neutral-900 text-white',
        },
        {
          title: 'Published Notes',
          value: stats?.totalNotes || 0,
          icon: FileText,
          meta: 'Online Protected Study Modules',
          color: 'bg-neutral-900 text-[#FACC15]',
        },
      ]
    : [
        {
          title: 'My Students',
          value: stats?.totalUsers || 0,
          icon: Users,
          meta: `${stats?.activeUsers || 0} Active Students`,
          color: 'bg-neutral-900 text-white',
        },
        {
          title: 'Active Accounts',
          value: stats?.activeUsers || 0,
          icon: UserCheck,
          meta: `${stats?.expiredUsers || 0} Inactive / Expired`,
          color: 'bg-neutral-900 text-[#FACC15]',
        },
        {
          title: 'My Courses',
          value: stats?.totalCourses || 0,
          icon: BookOpen,
          meta: 'Created Programs',
          color: 'bg-neutral-900 text-white',
        },
        {
          title: 'My Notes',
          value: stats?.totalNotes || 0,
          icon: FileText,
          meta: 'Educational Modules',
          color: 'bg-neutral-900 text-[#FACC15]',
        },
      ];

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-5">
        <div>
          <h1 className="text-2xl font-black text-neutral-900 tracking-tight">System Analytics & Controls</h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            Real-time database metrics, student security status, and curriculum management.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/admin/users"
            className="px-3.5 py-2 bg-[#FACC15] hover:bg-[#EAB308] text-black font-bold text-xs rounded-xl transition-colors shadow-xs"
          >
            Manage Users
          </Link>
          <Link
            to="/admin/notes/new"
            className="px-3.5 py-2 bg-[#111111] hover:bg-black text-[#FACC15] font-bold text-xs rounded-xl transition-colors shadow-xs"
          >
            Create Note
          </Link>
        </div>
      </div>

      {/* Real Statistics Metric Cards (#19 requirement) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div
              key={i}
              className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-500">{card.title}</span>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${card.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-3xl font-black text-neutral-950 tracking-tight">
                  {card.value}
                </div>
                <div className="text-[11px] font-medium text-neutral-500 mt-1">{card.meta}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 2-Column Section */}
      {isSuperAdmin ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Recent Activity Audit Logs */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-neutral-200 p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-wider font-mono">
                  Recent Security Audit Logs
                </h2>
                <Link to="/admin/activity-logs" className="text-xs font-semibold text-neutral-600 hover:text-black">
                  View Full Log →
                </Link>
              </div>

              <div className="space-y-3">
                {recentActivity.length > 0 ? (
                  recentActivity.map((log) => (
                    <div
                      key={log.id}
                      className="p-3 bg-neutral-50 rounded-xl border border-neutral-200/60 flex items-start justify-between text-xs gap-3"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-neutral-900 text-[11px] px-1.5 py-0.5 rounded bg-white border border-neutral-200">
                            {log.action}
                          </span>
                          {log.username && (
                            <span className="font-semibold text-neutral-700 truncate">
                              @{log.username}
                            </span>
                          )}
                        </div>
                        <p className="text-neutral-500 text-[11px] mt-1 line-clamp-1">
                          {log.details || 'No additional details.'}
                        </p>
                      </div>
                      <span className="text-[10px] text-neutral-400 font-mono whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-xs text-neutral-500">
                    No activity logs recorded yet.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Recent Payments Feed */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-neutral-200 p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-wider font-mono">
                  Recent Manual Payments
                </h2>
                <Link to="/admin/payments" className="text-xs font-semibold text-neutral-600 hover:text-black">
                  All Records →
                </Link>
              </div>

              <div className="space-y-3">
                {recentPayments.length > 0 ? (
                  recentPayments.map((p) => (
                    <div
                      key={p.id}
                      className="p-3 bg-neutral-50 rounded-xl border border-neutral-200/60 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-neutral-900">
                          {p.user?.fullName} <span className="text-neutral-400 font-normal">(@{p.user?.username})</span>
                        </div>
                        <div className="text-[11px] text-neutral-500 mt-0.5">
                          {p.paymentMethod} • Ref: {p.transactionRef}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-black text-sm text-neutral-900">
                          ${p.amount.toFixed(2)}
                        </div>
                        <Badge variant={p.status === 'PAID' ? 'paid' : 'pending'}>
                          {p.status}
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-xs text-neutral-500">
                    No payments recorded yet.
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-neutral-100">
              <Link
                to="/admin/payments"
                className="w-full block text-center py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold rounded-xl transition-colors"
              >
                + Record New Manual Payment
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Quick Academic Management Actions */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-neutral-200 p-6 shadow-xs flex flex-col justify-between">
            <div>
              <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-wider font-mono mb-4">
                Academic Management Workspace
              </h2>
              <p className="text-xs text-neutral-600 mb-6 leading-relaxed">
                As an Academic Administrator, you can add new students to the platform, create course outlines, and publish study notes. All content and student registrations are automatically synchronized with the Super Administrator dashboard.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Link
                  to="/admin/users"
                  className="p-4 rounded-xl border border-neutral-200 hover:border-black bg-neutral-50 hover:bg-white transition-all group"
                >
                  <div className="flex items-center gap-2 text-xs font-bold text-neutral-900 group-hover:text-black">
                    <Users className="w-4 h-4 text-[#FACC15]" />
                    <span>Manage My Students</span>
                  </div>
                  <p className="text-[11px] text-neutral-500 mt-1">
                    Add new student accounts and track enrollment.
                  </p>
                </Link>

                <Link
                  to="/admin/notes/new"
                  className="p-4 rounded-xl border border-neutral-200 hover:border-black bg-neutral-50 hover:bg-white transition-all group"
                >
                  <div className="flex items-center gap-2 text-xs font-bold text-neutral-900 group-hover:text-black">
                    <FileText className="w-4 h-4 text-[#FACC15]" />
                    <span>Create New Note</span>
                  </div>
                  <p className="text-[11px] text-neutral-500 mt-1">
                    Draft, format, and publish protected study notes.
                  </p>
                </Link>

                <Link
                  to="/admin/courses"
                  className="p-4 rounded-xl border border-neutral-200 hover:border-black bg-neutral-50 hover:bg-white transition-all group"
                >
                  <div className="flex items-center gap-2 text-xs font-bold text-neutral-900 group-hover:text-black">
                    <BookOpen className="w-4 h-4 text-[#FACC15]" />
                    <span>Course Curriculum</span>
                  </div>
                  <p className="text-[11px] text-neutral-500 mt-1">
                    Manage semesters, subjects, and topics.
                  </p>
                </Link>

                <Link
                  to="/admin/notes"
                  className="p-4 rounded-xl border border-neutral-200 hover:border-black bg-neutral-50 hover:bg-white transition-all group"
                >
                  <div className="flex items-center gap-2 text-xs font-bold text-neutral-900 group-hover:text-black">
                    <FileText className="w-4 h-4 text-[#FACC15]" />
                    <span>Educational Notes List</span>
                  </div>
                  <p className="text-[11px] text-neutral-500 mt-1">
                    Review published chapters and study materials.
                  </p>
                </Link>
              </div>
            </div>
          </div>

          {/* Super Admin Notice Card */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-neutral-200 p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-800">
                  <ShieldCheck className="w-4 h-4 text-[#FACC15]" />
                </div>
                <h3 className="text-sm font-bold text-neutral-900">Central Control Notice</h3>
              </div>
              <p className="text-xs text-neutral-600 leading-relaxed space-y-2">
                Student subscriptions, payment verifications, session limits, and system configurations are maintained centrally by the <strong>Super Administrator</strong>.
              </p>
              <div className="mt-4 p-3 bg-neutral-50 rounded-xl border border-neutral-200 text-xs text-neutral-700 space-y-2">
                <div className="font-semibold text-neutral-900">Student Expiry Policy:</div>
                <p className="text-[11px] text-neutral-500">
                  Any student whose fee payment is pending or whose validity date has expired will automatically be marked <strong>Inactive/Expired</strong> and cannot log in until reactivated.
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-neutral-100">
              <Link
                to="/admin/users"
                className="w-full block text-center py-2.5 bg-[#FACC15] hover:bg-[#EAB308] text-black text-xs font-bold rounded-xl transition-colors shadow-xs"
              >
                + Register New Student
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

