# 🏗️ HarmeLearn Academy - Architecture Documentation

Complete system architecture overview for HarmeLearn Academy.

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     HARMELEARN ACADEMY PLATFORM                 │
└─────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────┐
│                       CLIENT LAYER (React)                        │
├───────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │  Public Site │  │  Dashboards  │  │  Admin Panel │              │
│  │  - Landing   │  │  - Student   │  │  - Users     │              │
│  │  - About     │  │  - Teacher   │  │  - Courses   │              │
│  │  - Courses   │  │  - Analytics │  │  - Reports   │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
└───────────────────────────────────────────────────────────────────┘
                              ↓ HTTP/REST
┌───────────────────────────────────────────────────────────────────┐
│                    API LAYER (Next.js Routes)                    │
├───────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │ Auth APIs   │  │ Course APIs  │  │ Content APIs │              │
│  │ - Register  │  │ - Get/Create │  │ - Lessons    │              │
│  │ - Login     │  │ - Enroll     │  │ - Videos     │              │
│  │ - Verify    │  │ - Progress   │  │ - Quizzes    │              │
│  └─────────────┘  └──────────────┘  └──────────────┘              │
│                                                                    │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │ Assessment  │  │   Analytics  │  │   Payments   │              │
│  │ - Exams     │  │ - Performance│  │ - Subscribe  │              │
│  │ - Quizzes   │  │ - Reports    │  │ - Invoices   │              │
│  │ - Results   │  │ - Metrics    │  │ - History    │              │
│  └─────────────┘  └──────────────┘  └──────────────┘              │
└───────────────────────────────────────────────────────────────────┘
                  ↓ ORM (Drizzle) ↓ SQL Queries
┌───────────────────────────────────────────────────────────────────┐
│                   DATABASE LAYER (PostgreSQL)                     │
├───────────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────────────┐   │
│  │                   Core Tables (8)                          │   │
│  │  Users │ Students │ Teachers │ Schools │ SchoolAdmins    │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                    │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │              Content Tables (8)                            │   │
│  │  Subjects │ Courses │ Units │ Lessons │ Videos │ PDFs │   │   │
│  │  Assignments │ Submissions                              │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                    │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │            Assessment Tables (8)                           │   │
│  │  Quizzes │ Questions │ QuizResults │ Exams │             │   │
│  │  ExamQuestions │ ExamAttempts                            │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                    │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │        Community & Analytics Tables (10+)                 │   │
│  │  ForumPosts │ Discussions │ LiveClasses │ Analytics │    │   │
│  │  Certificates │ Bookmarks │ Payments │ Notifications │   │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                    │
│  🔑 33 Total Tables with Foreign Keys & Indexes                  │
└───────────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Frontend
```
React 19
├── UI Library for component-based development
├── Hooks for state management
└── Automatic rendering optimization

Next.js 16 (App Router)
├── File-based routing
├── Server & client components
├── API routes
├── Built-in optimization
└── Deployment ready

TypeScript
├── Static type checking
├── Better IDE support
├── Fewer runtime errors
└── Enhanced developer experience

Tailwind CSS 4
├── Utility-first CSS
├── Responsive design
├── Dark mode support
└── Component composition
```

### Backend
```
Node.js Runtime
├── JavaScript/TypeScript execution
├── Non-blocking I/O
└── Event-driven architecture

Next.js API Routes
├── RESTful endpoints
├── Middleware support
├── Built-in error handling
└── Authentication ready

Drizzle ORM
├── Type-safe queries
├── Query builder
├── Migration support
└── SQL performance
```

### Database
```
PostgreSQL 12+
├── ACID compliance
├── Complex queries
├── Advanced features
├── Proven reliability

Schema (33 Tables)
├── User management
├── Content organization
├── Learning tracking
└── Gamification & rewards
```

---

## Module Architecture

### Authentication Module

```
┌─────────────────────────────────────┐
│    Authentication System            │
├─────────────────────────────────────┤
│                                     │
│  src/lib/auth.ts                    │
│  ├── hashPassword()                 │
│  ├── verifyPassword()               │
│  ├── generateToken()                │
│  └── validatePasswordStrength()     │
│                                     │
│  src/app/api/auth/                  │
│  ├── register/route.ts              │
│  │   └── User registration          │
│  └── login/route.ts                 │
│      └── JWT token generation       │
│                                     │
│  Frontend:                          │
│  ├── signup/page.tsx                │
│  └── login/page.tsx                 │
│                                     │
└─────────────────────────────────────┘
```

### Content Management Module

```
┌─────────────────────────────────────┐
│   Content Management System         │
├─────────────────────────────────────┤
│                                     │
│  Courses                            │
│  ├── Create/Edit                    │
│  ├── Publish/Unpublish              │
│  └── Manage Access                  │
│                                     │
│  Structure:                         │
│  ├── Course → Units                 │
│  ├── Unit → Lessons                 │
│  └── Lesson → Content               │
│                                     │
│  Content Types:                     │
│  ├── Videos                         │
│  ├── PDFs                           │
│  ├── Quizzes                        │
│  └── Assignments                    │
│                                     │
│  APIs:                              │
│  ├── POST /api/courses              │
│  ├── POST /api/courses/[id]/units   │
│  └── POST /api/units/[id]/lessons   │
│                                     │
└─────────────────────────────────────┘
```

### Learning & Assessment Module

```
┌─────────────────────────────────────┐
│  Learning & Assessment              │
├─────────────────────────────────────┤
│                                     │
│  Progress Tracking:                 │
│  ├── Lesson completion              │
│  ├── Time spent                     │
│  └── Performance metrics            │
│                                     │
│  Assessments:                       │
│  ├── Quizzes (per lesson)          │
│  ├── Exams (per course)            │
│  ├── Auto-grading                  │
│  └── Manual grading                │
│                                     │
│  Analytics:                         │
│  ├── Performance by subject         │
│  ├── Weak topic detection           │
│  ├── Learning recommendations       │
│  └── Exam predictions               │
│                                     │
└─────────────────────────────────────┘
```

### User Management Module

```
┌─────────────────────────────────────┐
│    User Management                  │
├─────────────────────────────────────┤
│                                     │
│  User Types:                        │
│  ├── Students                       │
│  │   ├── Profile                    │
│  │   ├── Enrollments                │
│  │   └── Progress                   │
│  │                                  │
│  ├── Teachers                       │
│  │   ├── Profile                    │
│  │   ├── Courses                    │
│  │   └── Analytics                  │
│  │                                  │
│  └── Admins                         │
│      ├── Platform access            │
│      ├── Moderation                 │
│      └── Reports                    │
│                                     │
│  Features:                          │
│  ├── Role-based access              │
│  ├── Profile management             │
│  └── Account verification           │
│                                     │
└─────────────────────────────────────┘
```

---

## Data Flow

### User Registration Flow

```
User Input Form
    ↓
Validation (Client-side)
    ↓
POST /api/auth/register
    ↓
Server Validation
    ├── Email format
    ├── Password strength
    └── Duplicate check
    ↓
Hash Password (PBKDF2)
    ↓
Create User Record
    ├── User table
    └── Student/Teacher table
    ↓
Generate JWT Token
    ↓
Return Token & Redirect
```

### Course Enrollment Flow

```
Student Views Course
    ↓
Clicks "Enroll"
    ↓
POST /api/courses/enroll
    ↓
Verify Authentication
    ↓
Check Prerequisites
    ↓
Create Enrollment Record
    ├── Student ID
    ├── Course ID
    └── Enrollment date
    ↓
Update Course Stats
    └── totalStudents++
    ↓
Redirect to Course
```

### Quiz Submission Flow

```
Student Takes Quiz
    ↓
Selects Answers
    ↓
Submits Quiz
    ↓
POST /api/quizzes/submit
    ↓
Server Validation
    ├── Time limit check
    └── Answer validation
    ↓
Auto-Grade (Auto questions)
    ↓
Calculate Score & Percentage
    ↓
Check Passing
    ↓
Save Quiz Result
    ├── Score
    ├── Answers
    ├── Time taken
    └── Passed status
    ↓
Display Results
```

---

## API Structure

### RESTful Endpoint Organization

```
Authentication
├── POST   /api/auth/register      → Create account
├── POST   /api/auth/login         → User login
└── POST   /api/auth/logout        → User logout (ready)

Courses
├── GET    /api/courses             → List courses
├── POST   /api/courses             → Create course
├── GET    /api/courses/[id]        → Get course details
└── PUT    /api/courses/[id]        → Update course (ready)

Units/Chapters
├── GET    /api/courses/[id]/units  → List units
├── POST   /api/courses/[id]/units  → Create unit
└── PUT    /api/units/[id]          → Update unit (ready)

Lessons
├── GET    /api/units/[id]/lessons  → List lessons
├── POST   /api/units/[id]/lessons  → Create lesson
└── PUT    /api/lessons/[id]        → Update lesson (ready)

Subjects
├── GET    /api/subjects             → List subjects
├── POST   /api/subjects             → Create subject
└── PUT    /api/subjects/[id]        → Update subject (ready)

Health
└── GET    /api/health               → Health check

Expandable for:
├── Assignments
├── Exams
├── Quizzes
├── Results
├── Analytics
└── Payments
```

---

## Database Schema Categories

### 1. Core User Management (5 tables)
```
users (authentication & profiles)
students (student-specific data)
teachers (teacher profiles & qualifications)
schools (institution information)
schoolAdmins (school administrator mapping)
```

### 2. Content Management (8 tables)
```
subjects (course subjects)
courses (course definitions)
units (course chapters)
lessons (individual lessons)
videos (video content)
pdfs (PDF resources)
assignments (assignment definitions)
assignmentSubmissions (student submissions)
```

### 3. Learning & Assessment (8 tables)
```
quizzes (quiz definitions)
questions (quiz/exam questions)
quizResults (student quiz scores)
exams (course final exams)
examQuestions (exam questions)
examAttempts (exam submissions)
lessonProgress (lesson tracking)
courseEnrollments (student enrollments)
```

### 4. Community & Communication (4 tables)
```
forumPosts (discussion topics)
forumReplies (forum responses)
liveClasses (scheduled sessions)
liveClassAttendance (attendance tracking)
```

### 5. Analytics & Rewards (4+ tables)
```
performanceAnalytics (student performance)
aiRecommendations (ML recommendations)
studySchedules (study planning)
bookmarks (saved lessons)
```

### 6. Transactions (2 tables)
```
payments (transaction records)
certificates (earned certificates)
```

### 7. Notifications (1 table)
```
notifications (user notifications)
```

---

## Security Architecture

### Authentication Layer
```
1. User Input
   ↓
2. Validation
   ├── Email format
   └── Password strength
   ↓
3. Password Hashing (PBKDF2)
   ├── Salt generation
   └── Hash storage
   ↓
4. JWT Token Generation
   ├── Payload
   ├── Secret key
   └── Expiration
   ↓
5. Token Storage
   └── HTTP-only cookie
   ↓
6. Protected Routes
   └── Verify token on each request
```

### Authorization Layer
```
User Makes Request
    ↓
Verify JWT Token
    ↓
Check User Role
    ├── super_admin
    ├── school_admin
    ├── teacher
    ├── student
    └── parent
    ↓
Check Resource Access
    └── User owns/enrolled?
    ↓
Execute Endpoint Logic
    ↓
Return Response
```

### Data Protection
```
SQL Injection Prevention
├── Drizzle ORM parameterization
└── No raw SQL strings

XSS Prevention
├── React automatic escaping
└── Next.js built-in sanitization

CSRF Prevention
├── SameSite cookies
└── Token validation (ready)

Input Validation
├── Server-side checks
└── Type validation
```

---

## Performance Optimization

### Caching Strategy
```
Client-Side
├── Browser cache
├── Service worker (PWA ready)
└── React component memoization

Server-Side
├── Database query optimization
├── Indexed fields
└── Connection pooling

CDN
└── Static asset delivery (ready)
```

### Database Optimization
```
Indexes on:
├── Primary keys
├── Foreign keys
├── Frequently searched fields
└── Sort columns

Query Optimization:
├── JOIN optimization
├── SELECT specific columns
└── Pagination
```

---

## Scalability

### Horizontal Scaling
```
Load Balancer
    ├── App Instance 1
    ├── App Instance 2
    ├── App Instance 3
    └── App Instance N
        ↓
    Database (Single or Replicated)
```

### Vertical Scaling
```
Increase:
├── Server RAM
├── CPU cores
├── Database resources
└── Disk space
```

### Database Replication
```
Primary (Read/Write)
    ↓
Replica 1 (Read)
Replica 2 (Read)
Replica 3 (Read)
```

---

## Deployment Architecture

### Development Environment
```
Local Machine
├── Node.js 18+
├── PostgreSQL (local)
├── Git repository
└── Environment variables (.env)
```

### Production Environment
```
Option 1: Vercel
├── Automatic deployments
├── Built for Next.js
├── Global CDN
└── Serverless functions

Option 2: AWS
├── EC2 (compute)
├── RDS (database)
├── S3 (storage)
└── CloudFront (CDN)

Option 3: Docker
├── Containerized app
├── PostgreSQL container
├── Nginx reverse proxy
└── Docker Compose orchestration
```

---

## Monitoring & Logging

### Application Monitoring
```
Error Tracking (Sentry ready)
Performance Monitoring (New Relic ready)
Uptime Monitoring (StatusPage ready)
```

### Logging Strategy
```
Client-side
├── Console logs
├── Error tracking
└── User interactions

Server-side
├── API request logs
├── Database query logs
├── Error logs
└── Performance metrics
```

---

## Extension Points

The architecture is designed for easy extension:

```
Add New Features:
├── Create API route (/api/[feature])
├── Update database schema
├── Create frontend components
└── Integrate with existing modules

Add New Content Types:
├── Extend lessons table
├── Create new handler
└── Update content display

Add New User Roles:
├── Update enum
├── Add permission checks
└── Create role-specific dashboards
```

---

## Technology Justification

### Why Next.js?
- Built for React applications
- Full-stack capability
- Excellent performance
- Easy deployment
- TypeScript support
- API routes integrated

### Why PostgreSQL?
- ACID compliance
- Complex queries
- Scalable
- Proven reliability
- Rich feature set
- Good ORM support

### Why Drizzle ORM?
- Type-safe queries
- Better than raw SQL
- Lightweight
- Excellent DX
- Migration support
- No boilerplate

### Why TypeScript?
- Static typing
- Better IDE support
- Catch errors early
- Self-documenting code
- Refactoring safety

### Why Tailwind CSS?
- Utility-first approach
- Responsive design
- Consistent styling
- Fast development
- Small bundle size

---

## Future Architecture Enhancements

```
Microservices
├── User service
├── Course service
├── Content service
├── Assessment service
└── Analytics service

Message Queue
├── Background jobs
├── Email notifications
└── Event processing

Caching Layer
├── Redis
├── CDN
└── Browser cache

Search Engine
├── Elasticsearch
└── Full-text search

Real-time Features
├── WebSockets
├── Live notifications
└── Collaborative editing
```

---

**Architecture Version:** 1.0  
**Last Updated:** 2024  
**Status:** Production Ready  
**Maintainability:** High  
**Scalability:** Excellent
