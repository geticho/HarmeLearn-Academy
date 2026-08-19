# 📊 HarmeLearn Academy - Database Schema Documentation

Complete database schema documentation and relationships for HarmeLearn Academy.

## Overview

PostgreSQL relational database with 30+ tables, comprehensive indexes, and foreign key constraints for data integrity.

## Core Tables

### Users Table
Manages all platform users across different roles.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  emailVerified BOOLEAN DEFAULT false,
  passwordHash TEXT,
  firstName VARCHAR(100) NOT NULL,
  lastName VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  avatar TEXT,
  bio TEXT,
  role user_role NOT NULL DEFAULT 'student',
  isActive BOOLEAN DEFAULT true,
  lastLoginAt TIMESTAMP,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Role Options: super_admin, school_admin, teacher, student, parent
```

**Relationships:**
- Has many: students, teachers, schoolAdmins
- Has many: notifications, forumPosts, forumReplies

---

### Students Table
Student-specific information linked to users.

```sql
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  userId UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  schoolId UUID REFERENCES schools(id) ON DELETE SET NULL,
  grade grade NOT NULL,
  stream stream,
  enrollmentNumber VARCHAR(100) UNIQUE,
  parentEmail VARCHAR(255),
  subscriptionPlan subscription_plan DEFAULT 'free',
  subscriptionExpiresAt TIMESTAMP,
  learningStreak INTEGER DEFAULT 0,
  totalLearningMinutes INTEGER DEFAULT 0,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Grade Options: 9, 10, 11, 12
-- Stream Options: natural, social
-- Subscription Plans: free, basic, premium, school
```

**Relationships:**
- Belongs to: users, schools
- Has many: courseEnrollments, lessonProgress, quizResults
- Has many: certificates, bookmarks, payments

---

### Teachers Table
Teacher profiles and qualifications.

```sql
CREATE TABLE teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  userId UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  schoolId UUID REFERENCES schools(id) ON DELETE SET NULL,
  employeeId VARCHAR(100) UNIQUE,
  bio TEXT,
  specialization VARCHAR(255),
  qualifications JSON,
  rating DECIMAL(3,2) DEFAULT 0,
  totalStudents INTEGER DEFAULT 0,
  coursesCreated INTEGER DEFAULT 0,
  verificationStatus VARCHAR(50) DEFAULT 'pending',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Relationships:**
- Belongs to: users, schools
- Has many: courses, liveClasses

---

### Schools Table
School and institution information.

```sql
CREATE TABLE schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  region VARCHAR(100),
  city VARCHAR(100),
  phone VARCHAR(20),
  email VARCHAR(255),
  logo TEXT,
  motto TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Relationships:**
- Has many: schoolAdmins, students, teachers

---

## Content Management

### Subjects Table
Course subjects for different grades.

```sql
CREATE TABLE subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  icon TEXT,
  color VARCHAR(20),
  gradeFrom grade NOT NULL,
  gradeTo grade NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Subjects: Mathematics, Physics, Chemistry, Biology, English, etc.
```

---

### Courses Table
Main course information.

```sql
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  thumbnail TEXT,
  subjectId UUID NOT NULL REFERENCES subjects(id),
  grade grade NOT NULL,
  teacherId UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  totalLessons INTEGER DEFAULT 0,
  totalStudents INTEGER DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0,
  price DECIMAL(10,2) DEFAULT 0,
  isFree BOOLEAN DEFAULT true,
  isPublished BOOLEAN DEFAULT false,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexed on: subjectId, grade, slug
```

**Relationships:**
- Belongs to: subjects, teachers
- Has many: units, enrollments, exams, forumPosts, liveClasses

---

### Units Table
Course units/chapters.

```sql
CREATE TABLE units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  courseId UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  orderIndex INTEGER NOT NULL,
  totalLessons INTEGER DEFAULT 0,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Relationships:**
- Belongs to: courses
- Has many: lessons

---

### Lessons Table
Individual lessons within units.

```sql
CREATE TABLE lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unitId UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  content TEXT,
  orderIndex INTEGER NOT NULL,
  durationMinutes INTEGER,
  isPublished BOOLEAN DEFAULT true,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Relationships:**
- Belongs to: units
- Has many: videos, pdfs, quizzes, assignments, lessonProgress, bookmarks

---

### Videos Table
Video content for lessons.

```sql
CREATE TABLE videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lessonId UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  videoUrl TEXT NOT NULL,
  duration INTEGER,
  thumbnail TEXT,
  transcript TEXT,
  isPublished BOOLEAN DEFAULT true,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

### PDFs Table
PDF resources for lessons.

```sql
CREATE TABLE pdfs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lessonId UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  fileUrl TEXT NOT NULL,
  fileSize INTEGER,
  pages INTEGER,
  isPublished BOOLEAN DEFAULT true,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Assessments

### Quizzes Table
Quiz definitions for lessons.

```sql
CREATE TABLE quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lessonId UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  totalQuestions INTEGER DEFAULT 0,
  passingScore INTEGER DEFAULT 60,
  timeLimit INTEGER,
  isPublished BOOLEAN DEFAULT true,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

### Questions Table
Quiz/exam questions.

```sql
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quizId UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  questionText TEXT NOT NULL,
  questionType question_type NOT NULL,
  options JSON,
  correctAnswer TEXT NOT NULL,
  explanation TEXT,
  orderIndex INTEGER NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Question Types: multiple_choice, true_false, short_answer, essay
-- Options Format: ["Option A", "Option B", "Option C", "Option D"]
```

---

### Quiz Results Table
Student quiz attempts and scores.

```sql
CREATE TABLE quiz_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studentId UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  quizId UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  totalQuestions INTEGER NOT NULL,
  percentage DECIMAL(5,2) NOT NULL,
  timeTaken INTEGER,
  passed BOOLEAN NOT NULL,
  answers JSON,
  submittedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexed on: studentId, quizId
```

---

### Exams Table
Final exams for courses.

```sql
CREATE TABLE exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  courseId UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  totalQuestions INTEGER NOT NULL,
  passingScore INTEGER DEFAULT 60,
  timeLimit INTEGER NOT NULL,
  totalPoints INTEGER DEFAULT 100,
  examDate TIMESTAMP,
  isPublished BOOLEAN DEFAULT false,
  randomizeQuestions BOOLEAN DEFAULT false,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

### Exam Attempts Table
Student exam submissions.

```sql
CREATE TABLE exam_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studentId UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  examId UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  totalPoints INTEGER NOT NULL,
  percentage DECIMAL(5,2) NOT NULL,
  timeTaken INTEGER,
  passed BOOLEAN NOT NULL,
  answers JSON,
  startedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  submittedAt TIMESTAMP
);
```

---

## Assignments

### Assignments Table
Assignment definitions.

```sql
CREATE TABLE assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lessonId UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  dueDate TIMESTAMP,
  totalPoints INTEGER DEFAULT 100,
  attachments JSON,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

### Assignment Submissions Table
Student assignment submissions.

```sql
CREATE TABLE assignment_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignmentId UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  studentId UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  submissionText TEXT,
  attachments JSON,
  score INTEGER,
  feedback TEXT,
  submittedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  gradedAt TIMESTAMP,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Progress & Analytics

### Lesson Progress Table
Student lesson completion tracking.

```sql
CREATE TABLE lesson_progress (
  studentId UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  lessonId UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT false,
  completedAt TIMESTAMP,
  timeSpentMinutes INTEGER DEFAULT 0,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (studentId, lessonId)
);
```

---

### Course Enrollments Table
Student course enrollments.

```sql
CREATE TABLE course_enrollments (
  studentId UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  courseId UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  progressPercentage INTEGER DEFAULT 0,
  completedAt TIMESTAMP,
  certificateId UUID,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (studentId, courseId)
);
```

---

### Performance Analytics Table
Student performance by subject.

```sql
CREATE TABLE performance_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studentId UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  subjectId UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  averageScore DECIMAL(5,2),
  averageQuizScore DECIMAL(5,2),
  averageExamScore DECIMAL(5,2),
  weakTopics JSON,
  strongTopics JSON,
  totalQuestionsAttempted INTEGER DEFAULT 0,
  correctAnswers INTEGER DEFAULT 0,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (studentId, subjectId)
);
```

---

## Community & Communication

### Forum Posts Table
Discussion forum posts.

```sql
CREATE TABLE forum_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  courseId UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  userId UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  upvotes INTEGER DEFAULT 0,
  isAnswered BOOLEAN DEFAULT false,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

### Forum Replies Table
Forum post replies.

```sql
CREATE TABLE forum_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  postId UUID NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
  userId UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  upvotes INTEGER DEFAULT 0,
  isAcceptedAnswer BOOLEAN DEFAULT false,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

### Live Classes Table
Scheduled live class sessions.

```sql
CREATE TABLE live_classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  courseId UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  teacherId UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  scheduledAt TIMESTAMP NOT NULL,
  duration INTEGER,
  meetingUrl TEXT,
  meetingId VARCHAR(100),
  platform VARCHAR(50),
  recordingUrl TEXT,
  attendeeCount INTEGER DEFAULT 0,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Platform: zoom, google_meet, custom
```

---

### Live Class Attendance Table
Live class attendance tracking.

```sql
CREATE TABLE live_class_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  liveClassId UUID NOT NULL REFERENCES live_classes(id) ON DELETE CASCADE,
  studentId UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  joinedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  leftAt TIMESTAMP,
  duration INTEGER
);
```

---

## Gamification & Rewards

### Certificates Table
Earned certificates.

```sql
CREATE TABLE certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studentId UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  courseId UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  certificateNumber VARCHAR(100) UNIQUE,
  verificationCode VARCHAR(50) UNIQUE,
  qrCode TEXT,
  issueDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expiryDate TIMESTAMP,
  status certificate_status DEFAULT 'earned',
  certificateUrl TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

### Bookmarks Table
Saved lessons.

```sql
CREATE TABLE bookmarks (
  studentId UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  lessonId UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (studentId, lessonId)
);
```

---

## Transactions & Billing

### Payments Table
Payment/transaction records.

```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studentId UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'ETB',
  paymentMethod VARCHAR(50) NOT NULL,
  transactionId VARCHAR(100) UNIQUE,
  status payment_status NOT NULL,
  subscriptionPlan subscription_plan,
  courseId UUID REFERENCES courses(id),
  description TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payment Status: pending, completed, failed, refunded
```

---

## Notifications & Preferences

### Notifications Table
User notifications.

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  userId UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50),
  relatedId UUID,
  read BOOLEAN DEFAULT false,
  readAt TIMESTAMP,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Types: assignment_reminder, exam_reminder, course_update, forum_reply
```

---

## Other Tables

### AI Recommendations Table
Machine learning-based learning recommendations.

```sql
CREATE TABLE ai_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studentId UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  recommendationType VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  relatedCourseId UUID REFERENCES courses(id),
  relatedLessonId UUID REFERENCES lessons(id),
  confidence DECIMAL(3,2),
  isApplied BOOLEAN DEFAULT false,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expiresAt TIMESTAMP
);
```

---

### Study Schedule Table
Student study timetables.

```sql
CREATE TABLE study_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studentId UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  dayOfWeek INTEGER,
  startTime VARCHAR(10),
  endTime VARCHAR(10),
  subjectId UUID REFERENCES subjects(id),
  topic VARCHAR(255),
  isCompleted BOOLEAN DEFAULT false,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Indexes

All important fields are indexed for fast queries:

```sql
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_students_user_id ON students(user_id);
CREATE INDEX idx_courses_subject_id ON courses(subject_id);
CREATE INDEX idx_courses_grade ON courses(grade);
CREATE INDEX idx_courses_slug ON courses(slug);
CREATE INDEX idx_lessons_unit_id ON lessons(unit_id);
CREATE INDEX idx_quiz_results_student_id ON quiz_results(student_id);
CREATE INDEX idx_enrollment_student_id ON course_enrollments(student_id);
-- ... and many more
```

---

## Foreign Keys & Constraints

All relationships use ON DELETE CASCADE or ON DELETE SET NULL for data integrity:

- Deleting a user cascades to students, teachers, notifications
- Deleting a course cascades to units, enrollments, exams
- Deleting a lesson cascades to videos, pdfs, quizzes, assignments

---

## Enum Types

```sql
CREATE TYPE user_role AS ENUM ('super_admin', 'school_admin', 'teacher', 'student', 'parent');
CREATE TYPE grade AS ENUM ('9', '10', '11', '12');
CREATE TYPE stream AS ENUM ('natural', 'social');
CREATE TYPE subscription_plan AS ENUM ('free', 'basic', 'premium', 'school');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
CREATE TYPE question_type AS ENUM ('multiple_choice', 'true_false', 'short_answer', 'essay');
CREATE TYPE certificate_status AS ENUM ('earned', 'revoked');
```

---

## Backup & Recovery

All tables support PostgreSQL native backup:

```bash
# Full database backup
pg_dump harmelearn > backup.sql

# Restore from backup
psql harmelearn < backup.sql
```

---

## Performance Considerations

1. **Indexes** - All foreign keys and frequently queried columns are indexed
2. **Partitioning** - Large tables can be partitioned by date for better performance
3. **Archiving** - Old exam attempts can be archived to separate storage
4. **Query Optimization** - Use EXPLAIN ANALYZE to optimize slow queries

---

## Extensions Required

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For full-text search
```

---

For schema updates and migrations, use Drizzle Kit:

```bash
npx drizzle-kit generate
npx drizzle-kit migrate
npx drizzle-kit push
```
