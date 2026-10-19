export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'USER';
export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'EXPIRED' | 'DISABLED';

export interface User {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
  status: UserStatus;
  maxDevices: number;
  accessExpiry: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt?: string;
  _count?: {
    sessions: number;
    userAccess: number;
  };
  sessions?: Session[];
  userAccess?: UserAccess[];
  payments?: Payment[];
}

export interface Session {
  id: string;
  userId?: string;
  deviceName: string;
  browser?: string;
  os?: string;
  ipAddress?: string;
  lastActiveAt: string;
  expiresAt: string;
  createdAt: string;
  isRevoked?: boolean;
  user?: {
    id: string;
    username: string;
    fullName: string;
    role: string;
    status: string;
    maxDevices: number;
  };
}

export interface Course {
  id: string;
  title: string;
  code: string;
  description?: string | null;
  coverImage?: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt?: string;
  semesters?: Semester[];
  hasAccess?: boolean;
  _count?: {
    semesters: number;
    notes: number;
  };
}

export interface Semester {
  id: string;
  title: string;
  order: number;
  courseId: string;
  subjects?: Subject[];
}

export interface Subject {
  id: string;
  title: string;
  code: string;
  description?: string | null;
  icon?: string | null;
  semesterId: string;
  semester?: Semester;
  topics?: Topic[];
  notes?: Note[];
  hasAccess?: boolean;
  _count?: {
    notes: number;
  };
}

export interface Topic {
  id: string;
  title: string;
  order: number;
  subjectId: string;
  notes?: Note[];
}

export interface Note {
  id: string;
  title: string;
  description?: string | null;
  content: string;
  fileType?: string | null;
  coverImage?: string | null;
  filePath?: string | null;
  status: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED';
  visibility: 'RESTRICTED_PAID' | 'PUBLIC_PREVIEW';
  courseId?: string | null;
  semesterId?: string | null;
  subjectId?: string | null;
  topicId?: string | null;
  course?: { id: string; title: string; code: string };
  semester?: { id: string; title: string };
  subject?: { id: string; title: string; code: string };
  topic?: { id: string; title: string };
  createdAt: string;
  updatedAt: string;
}

export interface UserAccess {
  id: string;
  userId: string;
  accessType: 'COURSE' | 'SUBJECT' | 'NOTE';
  courseId?: string | null;
  subjectId?: string | null;
  noteId?: string | null;
  course?: { id: string; title: string; code: string };
  subject?: { id: string; title: string; code: string };
  note?: { id: string; title: string };
  startDate: string;
  expiryDate: string;
  status: 'ACTIVE' | 'EXPIRED' | 'REVOKED';
  grantedBy?: string | null;
  createdAt: string;
}

export interface Package {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  durationDays: number;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  courses?: { courseId: string; course: Course }[];
  subjects?: { subjectId: string; subject: Subject }[];
}

export interface Payment {
  id: string;
  userId: string;
  packageId?: string | null;
  amount: number;
  paymentMethod: string;
  transactionRef: string;
  paymentDate: string;
  expiryDate?: string | null;
  status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'CANCELLED';
  notes?: string | null;
  recordedBy?: string | null;
  createdAt: string;
  user?: { id: string; username: string; fullName: string };
  package?: { id: string; name: string; price: number };
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'INFO' | 'WARNING' | 'SUCCESS' | 'URGENT';
  isActive: boolean;
  createdAt: string;
}

export interface SocialLink {
  id: string;
  platform: 'FACEBOOK' | 'INSTAGRAM' | 'WHATSAPP';
  title: string;
  url: string;
  isEnabled: boolean;
  displayOrder: number;
}

export interface ActivityLog {
  id: string;
  userId?: string | null;
  username?: string | null;
  action: string;
  details?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
}

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  expiredUsers: number;
  suspendedUsers: number;
  totalCourses: number;
  totalSubjects: number;
  totalNotes: number;
  activeSessions: number;
  todayLogins: number;
}

