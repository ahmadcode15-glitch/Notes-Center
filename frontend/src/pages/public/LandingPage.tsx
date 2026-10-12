import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '../../components/common/Logo';
import { api } from '../../services/api';
import {
  BookOpen,
  ShieldCheck,
  GraduationCap,
  Sparkles,
  ArrowRight,
  CheckCircle,
  HelpCircle,
  Layers,
  Smartphone,
  MessageCircle,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const [courses, setCourses] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({
    support_whatsapp: '+1 (555) 234-5678',
    platform_name: 'Notes Center',
    tagline: 'Your Notes. Your Preparation. Your Success.',
  });
  const [socialLinks, setSocialLinks] = useState<any[]>([
    { id: 'wa-default', platform: 'WHATSAPP', title: 'WhatsApp Support', url: 'https://wa.me/15552345678' }
  ]);

  useEffect(() => {
    // Load courses preview and public settings
    api.courses.list().then((res) => {
      if (res.success) setCourses(res.courses.slice(0, 4));
    }).catch(() => {});

    api.settings.public().then((res) => {
      if (res.success && res.settings) setSettings(res.settings);
    }).catch(() => {});

    api.socialLinks.public().then((res) => {
      if (res.success && res.links?.length > 0) setSocialLinks(res.links);
    }).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-[#F8F8F6] text-[#171717] flex flex-col font-sans">
      {/* Top Header */}
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Logo variant="full" size="md" showTagline={false} />
          <div className="flex items-center gap-4">
            <Link
              to="/login"
              className="px-4 py-2 text-xs font-bold text-black bg-[#FACC15] hover:bg-[#EAB308] rounded-lg transition-colors shadow-xs flex items-center gap-1.5"
            >
              <span>Student Login</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 sm:py-24 border-b border-neutral-200 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-100 border border-neutral-200 text-xs font-semibold text-neutral-800 mb-6">
            <span className="w-2 h-2 rounded-full bg-[#FACC15]" />
            Official Educational Notes Platform
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-neutral-950 leading-tight">
            Your Notes. Your Preparation. Your Success.
          </h1>

          <p className="mt-6 text-base sm:text-lg text-neutral-600 max-w-2xl mx-auto leading-relaxed">
            Access organized study notes and preparation material in one secure place. Designed specifically for university students and exam candidates.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/login"
              className="px-6 py-3 text-sm font-bold text-black bg-[#FACC15] hover:bg-[#EAB308] rounded-xl transition-all shadow-sm flex items-center gap-2"
            >
              <span>Enter Student Portal</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#courses"
              className="px-6 py-3 text-sm font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-xl transition-colors"
            >
              Explore Curriculum
            </a>
          </div>

          <div className="mt-10 flex flex-wrap justify-center items-center gap-6 text-xs text-neutral-500 font-medium">
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>Organized by Semester & Topic</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>Online Protected Study Reader</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>Multi-Device Protection</span>
            </div>
          </div>
        </div>
      </section>

      {/* Why AL Notes Hub */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight">
            Why AL Notes Hub
          </h2>
          <p className="mt-2 text-sm text-neutral-600">
            Engineered to deliver a distraction-free study environment tailored to academic syllabi.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-xs">
            <div className="w-10 h-10 rounded-lg bg-[#111111] text-[#FACC15] flex items-center justify-center mb-4">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-neutral-900">Curriculum-Aligned Structure</h3>
            <p className="mt-2 text-xs sm:text-sm text-neutral-600 leading-relaxed">
              Every course is divided systematically into Semesters, Subjects, and Chapters. No scattered PDFs or disjointed files.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-xs">
            <div className="w-10 h-10 rounded-lg bg-[#111111] text-[#FACC15] flex items-center justify-center mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-neutral-900">Secure Study Environment</h3>
            <p className="mt-2 text-xs sm:text-sm text-neutral-600 leading-relaxed">
              Read notes directly in our modern reader equipped with dark mode, font scaling, and session-level watermark safeguards.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-xs">
            <div className="w-10 h-10 rounded-lg bg-[#111111] text-[#FACC15] flex items-center justify-center mb-4">
              <Smartphone className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-neutral-900">Configurable Device Access</h3>
            <p className="mt-2 text-xs sm:text-sm text-neutral-600 leading-relaxed">
              Study seamlessly from your laptop or mobile phone. Active session management ensures safe, authorized access.
            </p>
          </div>
        </div>
      </section>

      {/* Available Courses Overview */}
      <section id="courses" className="py-16 bg-white border-y border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
            <div>
              <h2 className="text-2xl font-extrabold text-neutral-900 tracking-tight">
                Featured Programs & Course Notes
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-neutral-600">
                Subscribed students get full access to study materials for their enrolled courses.
              </p>
            </div>
            <Link
              to="/login"
              className="text-xs font-bold text-neutral-900 hover:text-black flex items-center gap-1 underline underline-offset-4"
            >
              Sign in to view full catalog <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.length > 0 ? (
              courses.map((course) => (
                <div
                  key={course.id}
                  className="bg-[#F8F8F6] p-5 rounded-xl border border-neutral-200 hover:border-neutral-300 transition-colors flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-[#111111] text-[#FACC15]">
                        {course.code}
                      </span>
                      <span className="text-xs text-neutral-500 font-medium">
                        {course._count?.semesters || 0} Semesters
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-neutral-900">{course.title}</h3>
                    <p className="mt-2 text-xs text-neutral-600 line-clamp-3 leading-relaxed">
                      {course.description || 'Full course module syllabus breakdown and exam prep summaries.'}
                    </p>
                  </div>
                  <div className="mt-5 pt-4 border-t border-neutral-200 flex items-center justify-between">
                    <span className="text-xs text-neutral-500 font-medium">
                      {course._count?.notes || 0} Notes Available
                    </span>
                    <Link
                      to="/login"
                      className="text-xs font-bold text-black hover:underline"
                    >
                      Access Notes →
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-8 text-center text-sm text-neutral-500">
                Loading academic courses...
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Support / Manual Access Info */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#111111] text-white rounded-2xl p-8 sm:p-12 border border-neutral-800 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-xl">
            <span className="text-xs font-bold font-mono tracking-wider text-[#FACC15] uppercase">
              How Access Works
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold mt-2 tracking-tight">
              Subscribed or Purchasing Access?
            </h2>
            <p className="mt-3 text-sm text-neutral-300 leading-relaxed">
              After confirming your manual or bank payment, our administrators will activate your student account and grant access to your enrolled courses.
            </p>
            {/* WhatsApp Contact Button - Compact and Sleek */}
            <div className="mt-5 flex items-center gap-3">
              <a
                href={
                  socialLinks.find((s) => s.platform === 'WHATSAPP')?.url ||
                  `https://wa.me/${(settings.support_whatsapp || '+15552345678').replace(/[^0-9]/g, '')}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-[#25D366] hover:bg-[#20bd5a] active:bg-[#1eb355] text-black font-bold text-xs rounded-lg inline-flex items-center gap-2 transition-all shadow-xs hover:shadow-sm"
              >
                <MessageCircle className="w-4 h-4 fill-black/10" />
                <span>
                  Contact on WhatsApp{settings.support_whatsapp ? ` (${settings.support_whatsapp})` : ''}
                </span>
              </a>
            </div>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-xl w-full md:w-80 space-y-3">
            <div className="text-xs font-bold text-[#FACC15] uppercase tracking-wider font-mono">
              Quick Highlights
            </div>
            <div className="text-xs text-neutral-300 space-y-2">
              <p>✓ 24-Hour Secure Study Sessions</p>
              <p>✓ Dynamic Watermarked Reader</p>
              <p>✓ Device limit protection</p>
              <p>✓ Solved practice questions</p>
            </div>
            <Link
              to="/login"
              className="mt-4 block w-full text-center py-2 bg-[#FACC15] hover:bg-[#EAB308] text-black text-xs font-bold rounded-lg transition-colors"
            >
              Sign In to Your Account
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-white border-t border-neutral-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500">
          <div className="flex items-center gap-3">
            <Logo variant="compact" size="sm" />
            <span>© {new Date().getFullYear()} Notes Center. All rights reserved.</span>
          </div>

          {/* Support Link - ONLY WhatsApp */}
          {socialLinks.filter((s) => s.platform === 'WHATSAPP').length > 0 && (
            <div className="flex items-center gap-4">
              {socialLinks
                .filter((s) => s.platform === 'WHATSAPP')
                .map((sl) => (
                  <a
                    key={sl.id}
                    href={sl.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-neutral-600 hover:text-black font-medium transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
                    <span>{sl.title}</span>
                  </a>
                ))}
            </div>
          )}
        </div>
      </footer>
    </div>
  );
};

