# AL Notes Hub

> **“Your Notes. Your Preparation. Your Success.”**

**AL Notes Hub** is a production-ready, full-stack educational notes and exam-preparation platform built with React, TypeScript, Vite, Tailwind CSS, Node.js, Express, and Prisma ORM.

Designed as a paid service for academic institutions, degree programs, and competitive exam preparation (e.g., BSCS, MDCAT, Engineering), students gain platform access following manual or external subscription payments. Administrators manage users, assign course/subject/note access, upload rich study notes, enforce device limits, and monitor live student sessions.

---

## 1. Core Technology Stack

- **Frontend**:
  - React 18 & TypeScript
  - Vite for ultra-fast bundling
  - React Router v6
  - Tailwind CSS with bespoke human UI design (Black `#111111`, Brand Yellow `#FACC15`, White `#FFFFFF`, Neutral `#F8F8F6`)
  - Lucide Icons & Custom SVG Geometric Logo Mark
  - Dynamic Anti-Copy Watermarking Component & Reader Controls

- **Backend**:
  - Node.js & TypeScript
  - Express.js
  - Prisma ORM
  - JWT & Database-backed 24-Hour Session Management
  - Bcrypt password hashing
  - Helmet & CORS security middleware
  - Express Rate Limiting

- **Database**:
  - Relational schema (SQLite out-of-the-box for development; turnkey PostgreSQL support for production)
  - Full relational integrity: Users, Sessions, Courses, Semesters, Subjects, Topics, Notes, UserAccess, Packages, Payments, Announcements, SocialLinks, Settings, and ActivityLogs.

---

## 2. Key Architecture & Features

### 🔐 Multi-Device Session Management & Security
- **Configurable Maximum Devices per Student**: Each user has an individual `maxDevices` limit (default 1 or 2).
- **Device Limit Reached Safeguard**: When a student exceeds their device threshold, login is blocked with an informative modal providing administrative support contacts.
- **24-Hour Secure Session**: Server-enforced session expiration with token revocation.
- **Real-Time Revocation**: Admins can revoke individual active sessions or execute an emergency platform-wide force logout.

### 📖 Protected Study Reader (Anti-Theft Safeguards)
- **Zero Public File Links**: Content is never served from public buckets; all queries pass through authenticated backend access controls.
- **No Download Controls**: "Download PDF" buttons and browser save hotkeys are intentionally omitted.
- **Dynamic Security Watermark**: A floating, tiled watermark is rendered across study notes containing the student's username, active session identifier, and real-time timestamp.
- **Anti-Copy Deterrence**: Right-click context menus and select copy actions trigger non-intrusive legal copyright notices: *“Educational content is protected. Unauthorized sharing or redistribution is not permitted.”*

### 🎓 Content Hierarchy
- **Program / Course** (e.g., *BS Computer Science*, *Pre-Medical MDCAT Prep*)
  - **Semester / Academic Level** (e.g., *Semester 1*, *Semester 2*)
    - **Subject** (e.g., *CS-101 Programming Fundamentals*, *Discrete Mathematics*)
      - **Topic / Chapter** (e.g., *Topic 1: Data Types & Control Structures*)
        - **Protected Educational Notes** (Rich Markdown, tables, code blocks, callouts)

### 👥 Access Control & Manual Payment Tracking
- Course-level access or specific subject/note access with start and expiry dates.
- Expired accounts are automatically blocked with a renewal notice.
- Manual payment recorder for Bank Transfers, JazzCash, EasyPaisa, and receipts with transaction reference numbers.

### 🛠️ Administrative Control Center
- Real-time Dashboard Analytics (Total Students, Active Sessions, Today's Logins, Course Counts).
- Complete User Management (Create, Edit, Reset Password, Adjust Device Limits, Suspend, Delete).
- Educational Note Editor with formatting tools and live preview.
- Configurable Social Links (Facebook, Instagram, WhatsApp) editable without touching code.
- Emergency Maintenance Mode toggle (normal students receive maintenance message; admins retain access).
- Audit Activity Logs recording all logins, failures, and access updates.

---

## 3. Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or later (tested on v25.0.0)
- **npm**: v9.0.0 or later

### Installation

Clone the repository and install dependencies:

```bash
# Clone repository
git clone <repository_url>
cd "al notes"

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Return to root
cd ..
```

Or from the root directory:
```bash
npm run install:all
```

---

## 4. Environment Variables

Create `.env` in `backend/` (a template is provided in `backend/.env.example` and `.env.example`):

```env
PORT=5000
NODE_ENV=development

# Database Connection (SQLite default for zero-config development)
DATABASE_URL="file:./dev.db"

# For PostgreSQL production:
# DATABASE_URL="postgresql://username:password@localhost:5432/alnotes?schema=public"

# Authentication Secrets
JWT_SECRET=al_notes_hub_super_secret_jwt_key_2026_education_platform
SESSION_SECRET=al_notes_hub_session_secret_protection_key_2026

# Seed Credentials
DEFAULT_ADMIN_USERNAME=admin
DEFAULT_ADMIN_PASSWORD=AdminPassword123!
DEFAULT_ADMIN_NAME="System Super Administrator"

# Storage
STORAGE_PROVIDER=local
STORAGE_PATH="./uploads"

# Client URLs
APP_URL=http://localhost:5173
API_URL=http://localhost:5000
```

---

## 5. Database Setup & Seeding

Run Prisma migrations and seed the initial dataset:

```bash
cd backend

# Generate Prisma Client & sync database schema
npx prisma generate
npx prisma db push

# Seed the database with admin accounts and curriculum
npm run seed
```

### Pre-Seeded Accounts for Testing:

| Role | Username | Password | Notes |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin` | `AdminPassword123!` | Full control over users, settings, and curriculum |
| **Academic Admin** | `academic_admin` | `StaffAdmin123!` | Educational content and user management |
| **Active Student** | `ahmed_student` | `Student123!` | Enrolled in BSCS Semester 1 & 2 (Max 2 devices) |
| **Expired Student** | `expired_student` | `Expired123!` | Test account for expired subscription handling |

---

## 6. Running the Application

### Development Mode

Run the backend and frontend concurrently:

**Terminal 1 (Backend API):**
```bash
cd backend
npm run dev
# Running on http://localhost:5000
```

**Terminal 2 (Frontend Client):**
```bash
cd frontend
npm run dev
# Running on http://localhost:5173
```

---

## 7. Production Build & Deployment

### Build

```bash
# Build Backend TypeScript
cd backend
npm run build

# Build Frontend Vite App
cd ../frontend
npm run build
```

### Start Backend Production Server

```bash
cd backend
npm start
```

### Switching to PostgreSQL in Production
To use PostgreSQL instead of SQLite:
1. In `backend/prisma/schema.prisma`, update the datasource provider:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
2. Update `DATABASE_URL` in `backend/.env` with your PostgreSQL connection string.
3. Run `npx prisma db push` or `npx prisma migrate deploy`.

---

## 8. API Endpoints Overview

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Student & Admin login (enforces device limit) | Public |
| `POST` | `/api/auth/logout` | Revokes current session | Authenticated |
| `GET` | `/api/auth/me` | Current user profile & active sessions | Authenticated |
| `POST` | `/api/auth/change-password` | Update account password | Authenticated |
| `GET` | `/api/courses/student-tree` | Curriculum hierarchy with access badges | Authenticated |
| `GET` | `/api/notes/:id` | Protected reader content with watermark | Authenticated |
| `GET` | `/api/notes/search` | Permission-filtered global notes search | Authenticated |
| `GET` | `/api/stats/dashboard` | Real-time database metrics | Admin |
| `GET` | `/api/users` | List, filter, and paginate users | Admin |
| `POST` | `/api/users` | Create student or admin account | Admin |
| `POST` | `/api/access/grant` | Assign course, subject, or note access | Admin |
| `GET` | `/api/sessions/active` | Live platform device sessions | Admin |
| `DELETE` | `/api/sessions/:id` | Revoke specific session | Admin |
| `POST` | `/api/sessions/revoke-all-users` | Force logout all users | Admin |
| `GET` | `/api/payments` | Manual payment and fee records | Admin |
| `GET` | `/api/social-links/public` | Public active social links for login | Public |
| `GET` | `/api/settings/public` | Platform name, tagline, support info | Public |

---

## 9. Security & Compliance Notes

1. **Client-Side Reality**: Browser-based applications cannot prevent 100% of physical hardware screenshots or recording. AL Notes Hub enforces defense-in-depth deterrence: authenticated backend streaming, dynamic user-stamped watermarking, absence of download buttons, text selection reduction, and session limits.
2. **Device Limits**: Device tracking utilizes server-side hashing of client identifiers combined with operating system and browser headers.
3. **Audit Trail**: Every significant administrative and security action is logged in `ActivityLog` without storing sensitive credentials or password hashes.

