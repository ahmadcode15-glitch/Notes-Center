import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding for Notes Center...');

  // 1. Initial Settings
  const defaultSettings = [
    { key: 'platform_name', value: 'Notes Center', group: 'GENERAL' },
    { key: 'tagline', value: 'Your Notes. Your Preparation. Your Success.', group: 'GENERAL' },
    { key: 'session_duration_hours', value: '24', group: 'SECURITY' },
    { key: 'default_max_devices', value: '2', group: 'SECURITY' },
    { key: 'watermark_enabled', value: 'true', group: 'SECURITY' },
    { key: 'watermark_opacity', value: '0.15', group: 'SECURITY' },
    { key: 'login_rate_limiting', value: 'true', group: 'SECURITY' },
    { key: 'default_note_visibility', value: 'RESTRICTED_PAID', group: 'CONTENT' },
    { key: 'maintenance_mode', value: 'false', group: 'SYSTEM' },
    { key: 'support_whatsapp', value: '+1 (555) 234-5678', group: 'SYSTEM' },
    { key: 'support_email', value: 'support@alnoteshub.com', group: 'SYSTEM' },
    { key: 'support_phone', value: '+1 (555) 234-5678', group: 'SYSTEM' },
    { key: 'support_instructions', value: 'For billing inquiries, device limit reset requests, or manual access upgrades, contact our team via WhatsApp with your account username.', group: 'SYSTEM' },
  ];

  for (const s of defaultSettings) {
    await prisma.setting.upsert({
      where: { key: s.key },
      update: { value: s.value, group: s.group },
      create: s,
    });
  }

  // 2. Social Links - ONLY WhatsApp Support as requested
  await prisma.socialLink.deleteMany({
    where: {
      platform: { in: ['FACEBOOK', 'INSTAGRAM'] },
    },
  });

  const socialLinks = [
    { platform: 'WHATSAPP', title: 'WhatsApp Support', url: 'https://wa.me/15552345678', isEnabled: true, displayOrder: 1 },
  ];

  for (const sl of socialLinks) {
    const existing = await prisma.socialLink.findFirst({ where: { platform: sl.platform } });
    if (!existing) {
      await prisma.socialLink.create({ data: sl });
    } else {
      await prisma.socialLink.update({
        where: { id: existing.id },
        data: sl,
      });
    }
  }

  // 3. Admin Users
  const adminUsername = process.env.DEFAULT_ADMIN_USERNAME || 'admin';
  const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'AdminPassword123!';
  const adminHashed = await bcrypt.hash(adminPassword, 10);

  const superAdmin = await prisma.user.upsert({
    where: { username: adminUsername },
    update: {
      passwordHash: adminHashed,
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      maxDevices: 5,
    },
    create: {
      username: adminUsername,
      fullName: process.env.DEFAULT_ADMIN_NAME || 'System Super Administrator',
      passwordHash: adminHashed,
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      maxDevices: 5,
    },
  });

  // Secondary Admin
  const adminUserHashed = await bcrypt.hash('StaffAdmin123!', 10);
  const academicAdmin = await prisma.user.upsert({
    where: { username: 'academic_admin' },
    update: {
      createdById: superAdmin.id,
    },
    create: {
      username: 'academic_admin',
      fullName: 'Academic Content Manager',
      passwordHash: adminUserHashed,
      role: 'ADMIN',
      status: 'ACTIVE',
      maxDevices: 3,
      createdById: superAdmin.id,
    },
  });

  // Sample Student User (Belongs specifically to academic_admin)
  const studentPassword = await bcrypt.hash('Student123!', 10);
  const studentExpiry = new Date();
  studentExpiry.setDate(studentExpiry.getDate() + 180); // 6 months access

  const sampleStudent = await prisma.user.upsert({
    where: { username: 'ahmed_student' },
    update: {
      accessExpiry: studentExpiry,
      status: 'ACTIVE',
      maxDevices: 2,
      createdById: academicAdmin.id,
    },
    create: {
      username: 'ahmed_student',
      fullName: 'Ahmed Raza',
      passwordHash: studentPassword,
      role: 'USER',
      status: 'ACTIVE',
      maxDevices: 2,
      accessExpiry: studentExpiry,
      createdById: academicAdmin.id,
    },
  });

  // Expired Student (Belongs to superAdmin)
  const expiredPassword = await bcrypt.hash('Expired123!', 10);
  const pastExpiry = new Date();
  pastExpiry.setDate(pastExpiry.getDate() - 10);

  await prisma.user.upsert({
    where: { username: 'expired_student' },
    update: { accessExpiry: pastExpiry, status: 'EXPIRED', createdById: superAdmin.id },
    create: {
      username: 'expired_student',
      fullName: 'Tariq Mehmood',
      passwordHash: expiredPassword,
      role: 'USER',
      status: 'EXPIRED',
      maxDevices: 1,
      accessExpiry: pastExpiry,
      createdById: superAdmin.id,
    },
  });

  // Admin Laiba
  const laibaPass = await bcrypt.hash('laiba123', 10);
  const laibaAdmin = await prisma.user.upsert({
    where: { username: 'laiba' },
    update: { role: 'ADMIN', status: 'ACTIVE' },
    create: {
      username: 'laiba',
      fullName: 'Laiba Admin',
      passwordHash: laibaPass,
      role: 'ADMIN',
      status: 'ACTIVE',
      maxDevices: 5,
      createdById: superAdmin.id,
    },
  });

  // Student Ahmad (Created by Laiba)
  const ahmadPass = await bcrypt.hash('ahmad123', 10);
  const ahmadExpiry = new Date();
  ahmadExpiry.setDate(ahmadExpiry.getDate() + 365);
  const ahmadStudent = await prisma.user.upsert({
    where: { username: 'ahmad' },
    update: { accessExpiry: ahmadExpiry, status: 'ACTIVE', createdById: laibaAdmin.id },
    create: {
      username: 'ahmad',
      fullName: 'Ahmad Student',
      passwordHash: ahmadPass,
      role: 'USER',
      status: 'ACTIVE',
      maxDevices: 2,
      accessExpiry: ahmadExpiry,
      createdById: laibaAdmin.id,
    },
  });

  // Note 123 created by Laiba and granted to Ahmad
  let note123 = await prisma.note.findFirst({ where: { title: '123' } });
  if (!note123) {
    note123 = await prisma.note.create({
      data: {
        title: '123',
        content: '# Protected Study Notes (123)\n\nWelcome to your approved study notes. Unauthorized sharing is prohibited.',
        status: 'PUBLISHED',
        visibility: 'RESTRICTED_PAID',
        createdById: laibaAdmin.id,
      },
    });
  }

  // Grant access to Note 123 for Ahmad
  const existingGrant = await prisma.userAccess.findFirst({
    where: { userId: ahmadStudent.id, noteId: note123.id },
  });
  if (!existingGrant) {
    await prisma.userAccess.create({
      data: {
        userId: ahmadStudent.id,
        accessType: 'NOTE',
        noteId: note123.id,
        grantedBy: laibaAdmin.id,
        expiryDate: ahmadExpiry,
        status: 'ACTIVE',
      },
    });
  }

  // 4. Sample Courses & Curriculum
  // Course 1: BS Computer Science
  let bscs = await prisma.course.findUnique({ where: { code: 'BSCS-2026' } });
  if (!bscs) {
    bscs = await prisma.course.create({
      data: {
        title: 'BS Computer Science (BSCS)',
        code: 'BSCS-2026',
        description: 'Comprehensive 4-year undergraduate degree program notes, lecture breakdowns, exam rubrics, and solved past papers.',
        status: 'ACTIVE',
        createdById: academicAdmin.id,
      },
    });
  }

  // Course 2: Pre-Medical MDCAT
  let mdcat = await prisma.course.findUnique({ where: { code: 'MDCAT-PREP' } });
  if (!mdcat) {
    mdcat = await prisma.course.create({
      data: {
        title: 'Pre-Medical MDCAT Preparation',
        code: 'MDCAT-PREP',
        description: 'High-yield exam review notes, diagrams, mnemonics, and solved past questions for medical college entrance tests.',
        status: 'ACTIVE',
      },
    });
  }

  // Semesters for BSCS
  let sem1 = await prisma.semester.findFirst({ where: { courseId: bscs.id, title: 'Semester 1' } });
  if (!sem1) {
    sem1 = await prisma.semester.create({
      data: {
        title: 'Semester 1',
        order: 1,
        courseId: bscs.id,
      },
    });
  }

  let sem2 = await prisma.semester.findFirst({ where: { courseId: bscs.id, title: 'Semester 2' } });
  if (!sem2) {
    sem2 = await prisma.semester.create({
      data: {
        title: 'Semester 2',
        order: 2,
        courseId: bscs.id,
      },
    });
  }

  // Subjects
  let cs101 = await prisma.subject.findFirst({ where: { semesterId: sem1.id, code: 'CS-101' } });
  if (!cs101) {
    cs101 = await prisma.subject.create({
      data: {
        title: 'Programming Fundamentals',
        code: 'CS-101',
        description: 'Foundations of procedural programming, variables, control flow, functions, arrays, and memory pointers.',
        icon: 'Code',
        semesterId: sem1.id,
      },
    });
  }

  let math102 = await prisma.subject.findFirst({ where: { semesterId: sem1.id, code: 'MATH-102' } });
  if (!math102) {
    math102 = await prisma.subject.create({
      data: {
        title: 'Discrete Mathematics',
        code: 'MATH-102',
        description: 'Mathematical reasoning, propositional logic, set theory, combinatorics, and graph models.',
        icon: 'Binary',
        semesterId: sem1.id,
      },
    });
  }

  let cs102 = await prisma.subject.findFirst({ where: { semesterId: sem2.id, code: 'CS-102' } });
  if (!cs102) {
    cs102 = await prisma.subject.create({
      data: {
        title: 'Object Oriented Programming',
        code: 'CS-102',
        description: 'OOP paradigm: abstraction, encapsulation, inheritance, polymorphism, templates, and exception handling.',
        icon: 'Layers',
        semesterId: sem2.id,
      },
    });
  }

  // Topics under CS101
  let topic1 = await prisma.topic.findFirst({ where: { subjectId: cs101.id, title: 'Topic 1: Data Types & Control Structures' } });
  if (!topic1) {
    topic1 = await prisma.topic.create({
      data: {
        title: 'Topic 1: Data Types & Control Structures',
        order: 1,
        subjectId: cs101.id,
      },
    });
  }

  let topic2 = await prisma.topic.findFirst({ where: { subjectId: cs101.id, title: 'Topic 2: Functions & Memory Stack' } });
  if (!topic2) {
    topic2 = await prisma.topic.create({
      data: {
        title: 'Topic 2: Functions & Memory Stack',
        order: 2,
        subjectId: cs101.id,
      },
    });
  }

  // Educational Notes with high-quality formatted educational content
  const note1Content = `# Chapter 1: Variables, Memory & Data Representation

## 1.1 Executive Overview
Welcome to the core foundational module of **Programming Fundamentals (CS-101)**. In computer systems, every operation ultimately reduces to state transitions across physical memory registers and digital logic gates.

---

## 1.2 Memory Layout & Variable Declaration
When a program declares a variable in high-level programming languages (C++ / C):

\`\`\`cpp
int studentAge = 21;
float gradePoint = 3.85f;
char letterGrade = 'A';
\`\`\`

### What Happens in RAM:
1. **Allocation**: The compiler reserves bytes in the process stack frame based on the type's byte width:
   - \`char\`: 1 byte (8 bits, range \`-128\` to \`127\`)
   - \`int\`: typically 4 bytes (32 bits, range \`-2,147,483,648\` to \`2,147,483,647\`)
   - \`float\`: 4 bytes (IEEE-754 single precision)
   - \`double\`: 8 bytes (IEEE-754 double precision)
2. **Address Binding**: A hexadecimal memory address (e.g. \`0x7ffeefbff5ac\`) is mapped to the variable label.
3. **Value Writing**: Binary encoding of \`21\` (\`00000000 00000000 00000000 00010101\`) is committed.

---

## 1.3 Primitive Data Types Comparison Table

| Data Type | Typical Size | Value Range | Common Exam Pitfall |
| :--- | :--- | :--- | :--- |
| **bool** | 1 Byte | \`true\` (1) or \`false\` (0) | Treating non-zero integers as bools in strict comparisons |
| **char** | 1 Byte | ASCII 0 to 127 | Overflowing signed char with \`>127\` values |
| **int** | 4 Bytes | \`-2^31\` to \`2^31 - 1\` | Integer overflow during large factorial calculations |
| **float** | 4 Bytes | \`~10^-38\` to \`~10^38\` | Precision truncation during currency calculations |
| **double**| 8 Bytes | \`~10^-308\` to \`~10^308\` | Neglecting memory cost in massive numeric arrays |

---

## 1.4 Control Flow: Branching Logic
Branching allows the CPU to conditionally alter instruction pointer execution flow:

\`\`\`cpp
if (examScore >= 90) {
    letterGrade = 'A';
} else if (examScore >= 80) {
    letterGrade = 'B';
} else {
    letterGrade = 'C';
}
\`\`\`

> **Exam Key Note**: Always ensure ternary operations \`condition ? expr1 : expr2\` maintain type uniformity to prevent implicit type coercion warnings in modern compiler toolchains.

---

## 1.5 Practice Problem Set
1. **Question 1**: What will be printed if an unsigned 8-bit integer with value \`255\` is incremented by \`1\`?
   - *Answer*: It wraps around to \`0\` due to modulo \`2^8\` overflow arithmetic.
2. **Question 2**: Explain why \`0.1 + 0.2 != 0.3\` in binary floating-point representation.
   - *Answer*: Decimal fractions with denominators not powers of 2 cannot be represented with finite binary digits.`;

  const note2Content = `# Chapter 2: Functions, Scope & The Call Stack

## 2.1 The Concept of Modularization
Functions decompose large, monolithic problem specifications into verifiable, isolated computational units.

### Anatomy of a Function
\`\`\`cpp
int calculateCompoundInterest(double principal, double rate, int years) {
    double total = principal * pow(1.0 + (rate / 100.0), years);
    return static_cast<int>(total);
}
\`\`\`

---

## 2.2 Activation Records (Stack Frames)
Whenever a function is invoked, an **Activation Record** is pushed onto the thread's runtime call stack.

An activation record encapsulates:
1. **Return Address**: Instruction address to jump back to when execution finishes.
2. **Incoming Parameters**: Values or memory references supplied by the caller.
3. **Local Variables**: Variables declared inside the function body.
4. **Frame Pointer**: Reference pointer to the parent stack frame.

\`\`\`
[ Higher Memory Addresses ]
+------------------------------------+
| Caller Stack Frame                 |
+------------------------------------+
| Return Address to Caller           |
+------------------------------------+
| Parameter: principal, rate, years  |
+------------------------------------+
| Local Variable: total              |  <--- Current Stack Pointer (ESP/RSP)
+------------------------------------+
[ Lower Memory Addresses ]
\`\`\`

---

## 2.3 Pass-by-Value vs. Pass-by-Reference

### Pass-by-Value:
- A byte-for-byte copy of the argument is placed into the new frame.
- Mutations inside the callee **do not** affect the caller's variable.
- Safe, but expensive for large data structures like vectors or matrices.

### Pass-by-Reference (\`&\`):
- The memory address of the original argument is passed.
- Callee writes directly to the caller's allocated memory.
- Avoids memory copying overhead. Use \`const Type&\` for read-only safety.

---

## 2.4 Recursion and Base Cases
A recursive function must have two mandatory components:
1. **Base Case**: The termination condition that ceases further recursive descent.
2. **Recursive Step**: The self-invoking statement that reduces the problem size closer to the base case.

\`\`\`cpp
long long factorial(int n) {
    // 1. Base condition
    if (n <= 1) return 1;
    // 2. Recursive step
    return n * factorial(n - 1);
}
\`\`\`

> **Critical Warning**: Missing a base case causes unbounded recursion, quickly exceeding the call stack limit and triggering a \`Stack Overflow\` runtime segmentation fault.`;

  const existingNote1 = await prisma.note.findFirst({ where: { title: 'Chapter 1: Variables, Memory & Data Representation' } });
  if (!existingNote1) {
    await prisma.note.create({
      data: {
        title: 'Chapter 1: Variables, Memory & Data Representation',
        description: 'Complete breakdown of primitive data types, binary encoding, stack allocation, and conditional branches.',
        courseId: bscs.id,
        semesterId: sem1.id,
        subjectId: cs101.id,
        topicId: topic1.id,
        content: note1Content,
        status: 'PUBLISHED',
        visibility: 'RESTRICTED_PAID',
      },
    });
  }

  const existingNote2 = await prisma.note.findFirst({ where: { title: 'Chapter 2: Functions, Scope & The Call Stack' } });
  if (!existingNote2) {
    await prisma.note.create({
      data: {
        title: 'Chapter 2: Functions, Scope & The Call Stack',
        description: 'Deep dive into stack frame activation records, pass-by-reference mechanics, and recursion fundamentals.',
        courseId: bscs.id,
        semesterId: sem1.id,
        subjectId: cs101.id,
        topicId: topic2.id,
        content: note2Content,
        status: 'PUBLISHED',
        visibility: 'RESTRICTED_PAID',
      },
    });
  }

  // 5. Packages
  let bscsPackage = await prisma.package.findFirst({ where: { name: 'BSCS Semester 1 Complete Access' } });
  if (!bscsPackage) {
    bscsPackage = await prisma.package.create({
      data: {
        name: 'BSCS Semester 1 Complete Access',
        description: 'Full unhindered online reading access to all Semester 1 courses, notes, and past exam breakdown sheets.',
        price: 39.99,
        durationDays: 180,
        status: 'ACTIVE',
        courses: {
          create: [{ courseId: bscs.id }],
        },
      },
    });
  }

  // 6. User Access Grant to sample student
  const existingAccess = await prisma.userAccess.findFirst({
    where: { userId: sampleStudent.id, courseId: bscs.id },
  });
  if (!existingAccess) {
    await prisma.userAccess.create({
      data: {
        userId: sampleStudent.id,
        accessType: 'COURSE',
        courseId: bscs.id,
        startDate: new Date(),
        expiryDate: studentExpiry,
        status: 'ACTIVE',
        grantedBy: superAdmin.username,
      },
    });
  }

  // 7. Payment record
  const existingPayment = await prisma.payment.findFirst({ where: { userId: sampleStudent.id } });
  if (!existingPayment) {
    await prisma.payment.create({
      data: {
        userId: sampleStudent.id,
        packageId: bscsPackage.id,
        amount: 39.99,
        paymentMethod: 'Bank Transfer',
        transactionRef: 'TXN-984210384',
        paymentDate: new Date(),
        expiryDate: studentExpiry,
        status: 'PAID',
        notes: 'Manual bank transfer verified via receipt slip #48291.',
        recordedBy: superAdmin.username,
      },
    });
  }

  // 8. Announcements
  const existingAnnouncement = await prisma.announcement.findFirst({ where: { title: 'Welcome to Notes Center 2026' } });
  if (!existingAnnouncement) {
    await prisma.announcement.create({
      data: {
        title: 'Welcome to Notes Center 2026',
        content: 'All Semester 1 and MDCAT study materials have been thoroughly audited and aligned with the latest 2026 academic curriculum. Study notes are protected and can be viewed inside our dedicated web reader.',
        type: 'INFO',
        isActive: true,
      },
    });
  }

  // 9. Initial Activity Log
  await prisma.activityLog.create({
    data: {
      userId: superAdmin.id,
      username: superAdmin.username,
      action: 'SYSTEM_INITIALIZED',
      details: 'Notes Center system initialized and seeded with default curriculum, security settings, and administrator account.',
      ipAddress: '127.0.0.1',
      userAgent: 'System Seed Script',
    },
  });

  console.log('✅ Database seeded successfully!');
  console.log(`👤 Super Admin: ${adminUsername} / ${adminPassword}`);
  console.log('👤 Academic Admin: academic_admin / StaffAdmin123!');
  console.log('👤 Student User: ahmed_student / Student123!');
  console.log('👤 Expired User: expired_student / Expired123!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

