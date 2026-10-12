import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';

// Layouts
import { StudentLayout } from './components/layout/StudentLayout';
import { AdminLayout } from './components/layout/AdminLayout';

// Public Pages
import { LandingPage } from './pages/public/LandingPage';
import { LoginPage } from './pages/public/LoginPage';

// Student Pages
import { StudentDashboard } from './pages/student/StudentDashboard';
import { MyNotesPage } from './pages/student/MyNotesPage';
import { MyCoursesPage } from './pages/student/MyCoursesPage';
import { CourseDetailPage } from './pages/student/CourseDetailPage';
import { SubjectDetailPage } from './pages/student/SubjectDetailPage';
import { NoteViewerPage } from './pages/student/NoteViewerPage';
import { SearchPage } from './pages/student/SearchPage';
import { RecentlyViewedPage } from './pages/student/RecentlyViewedPage';
import { StudentProfilePage } from './pages/student/StudentProfilePage';
import { HelpSupportPage } from './pages/student/HelpSupportPage';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { UsersManagementPage } from './pages/admin/UsersManagementPage';
import { UserDetailPage } from './pages/admin/UserDetailPage';
import { CoursesManagementPage } from './pages/admin/CoursesManagementPage';
import { NotesManagementPage } from './pages/admin/NotesManagementPage';
import { NoteEditorPage } from './pages/admin/NoteEditorPage';
import { AccessManagementPage } from './pages/admin/AccessManagementPage';
import { SessionsManagementPage } from './pages/admin/SessionsManagementPage';
import { PaymentsManagementPage } from './pages/admin/PaymentsManagementPage';
import { PackagesManagementPage } from './pages/admin/PackagesManagementPage';
import { AnnouncementsPage } from './pages/admin/AnnouncementsPage';
import { SocialLinksPage } from './pages/admin/SocialLinksPage';
import { SettingsPage } from './pages/admin/SettingsPage';
import { ActivityLogsPage } from './pages/admin/ActivityLogsPage';

// Route Guards
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F8F6] text-xs font-mono font-bold text-neutral-500">
        Authenticating Secure Session...
      </div>
    );
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#111111] text-[#FACC15] text-xs font-mono font-bold">
        Verifying Administrative Credentials...
      </div>
    );
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
};

const SuperAdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  if (user?.role !== 'SUPER_ADMIN') {
    return <Navigate to="/admin" replace />;
  }
  return <>{children}</>;
};

export function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />

            {/* Student Protected Routes */}
            <Route
              element={
                <ProtectedRoute>
                  <StudentLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<StudentDashboard />} />
              <Route path="/study-notes" element={<MyNotesPage />} />
              <Route path="/courses" element={<MyCoursesPage />} />
              <Route path="/courses/:courseId" element={<CourseDetailPage />} />
              <Route path="/subjects/:subjectId" element={<SubjectDetailPage />} />
              <Route path="/notes/:noteId" element={<NoteViewerPage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/recently-viewed" element={<RecentlyViewedPage />} />
              <Route path="/profile" element={<StudentProfilePage />} />
              <Route path="/support" element={<HelpSupportPage />} />
            </Route>

            {/* Admin Protected Routes */}
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminLayout />
                </AdminRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="users" element={<UsersManagementPage />} />
              <Route path="users/:userId" element={<UserDetailPage />} />
              <Route path="courses" element={<CoursesManagementPage />} />
              <Route path="notes" element={<NotesManagementPage />} />
              <Route path="notes/new" element={<NoteEditorPage />} />
              <Route path="notes/edit/:id" element={<NoteEditorPage />} />
              
              {/* Super Admin Only Routes */}
              <Route path="access" element={<SuperAdminRoute><AccessManagementPage /></SuperAdminRoute>} />
              <Route path="sessions" element={<SuperAdminRoute><SessionsManagementPage /></SuperAdminRoute>} />
              <Route path="payments" element={<SuperAdminRoute><PaymentsManagementPage /></SuperAdminRoute>} />
              <Route path="packages" element={<SuperAdminRoute><PackagesManagementPage /></SuperAdminRoute>} />
              <Route path="announcements" element={<SuperAdminRoute><AnnouncementsPage /></SuperAdminRoute>} />
              <Route path="social-links" element={<SuperAdminRoute><SocialLinksPage /></SuperAdminRoute>} />
              <Route path="settings" element={<SuperAdminRoute><SettingsPage /></SuperAdminRoute>} />
              <Route path="activity-logs" element={<SuperAdminRoute><ActivityLogsPage /></SuperAdminRoute>} />
            </Route>

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;

