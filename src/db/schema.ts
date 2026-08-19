import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  decimal,
  json,
  varchar,
  uuid,
  index,
  uniqueIndex,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Enums
export const userRoleEnum = pgEnum("user_role", [
  "super_admin",
  "school_admin",
  "teacher",
  "student",
  "parent",
]);

export const gradeEnum = pgEnum("grade", ["9", "10", "11", "12"]);

export const streamEnum = pgEnum("stream", ["natural", "social"]);

export const subscriptionPlanEnum = pgEnum("subscription_plan", [
  "free",
  "basic",
  "premium",
  "school",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "completed",
  "failed",
  "refunded",
]);

export const questionTypeEnum = pgEnum("question_type", [
  "multiple_choice",
  "true_false",
  "short_answer",
  "essay",
]);

export const certificateStatusEnum = pgEnum("certificate_status", [
  "earned",
  "revoked",
]);

// Users table
export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: varchar("email", { length: 255 }).unique().notNull(),
    emailVerified: boolean("email_verified").default(false),
    passwordHash: text("password_hash"),
    firstName: varchar("first_name", { length: 100 }).notNull(),
    lastName: varchar("last_name", { length: 100 }).notNull(),
    phone: varchar("phone", { length: 20 }),
    avatar: text("avatar"),
    bio: text("bio"),
    role: userRoleEnum("role").notNull().default("student"),
    isActive: boolean("is_active").default(true),
    lastLoginAt: timestamp("last_login_at"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [index("idx_users_email").on(table.email)]
);

// Sessions table - server-side session store used for authentication.
// The browser only holds an opaque token; the role always comes from the DB.
export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    token: varchar("token", { length: 128 }).unique().notNull(),
    userAgent: text("user_agent"),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    index("idx_sessions_token").on(table.token),
    index("idx_sessions_user_id").on(table.userId),
  ]
);

// Audit log - records every privileged action performed by an admin.
export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    actorId: uuid("actor_id").references(() => users.id, {
      onDelete: "set null",
    }),
    action: varchar("action", { length: 100 }).notNull(),
    entityType: varchar("entity_type", { length: 50 }).notNull(),
    entityId: varchar("entity_id", { length: 100 }),
    details: json("details"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [index("idx_audit_logs_actor_id").on(table.actorId)]
);

// Schools table
export const schools = pgTable("schools", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  region: varchar("region", { length: 100 }),
  city: varchar("city", { length: 100 }),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 255 }),
  logo: text("logo"),
  motto: text("motto"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// School Admins table
export const schoolAdmins = pgTable(
  "school_admins",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    schoolId: uuid("school_id")
      .notNull()
      .references(() => schools.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    index("idx_school_admins_user_id").on(table.userId),
    index("idx_school_admins_school_id").on(table.schoolId),
  ]
);

// Students table
export const students = pgTable(
  "students",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    schoolId: uuid("school_id").references(() => schools.id, {
      onDelete: "set null",
    }),
    grade: gradeEnum("grade").notNull(),
    stream: streamEnum("stream"),
    enrollmentNumber: varchar("enrollment_number", { length: 100 }).unique(),
    parentEmail: varchar("parent_email", { length: 255 }),
    subscriptionPlan: subscriptionPlanEnum("subscription_plan")
      .default("free")
      .notNull(),
    subscriptionExpiresAt: timestamp("subscription_expires_at"),
    learningStreak: integer("learning_streak").default(0),
    totalLearningMinutes: integer("total_learning_minutes").default(0),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    index("idx_students_user_id").on(table.userId),
    index("idx_students_school_id").on(table.schoolId),
  ]
);

// Teachers table
export const teachers = pgTable(
  "teachers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    schoolId: uuid("school_id").references(() => schools.id, {
      onDelete: "set null",
    }),
    employeeId: varchar("employee_id", { length: 100 }).unique(),
    bio: text("bio"),
    specialization: varchar("specialization", { length: 255 }),
    qualifications: json("qualifications"),
    rating: decimal("rating", { precision: 3, scale: 2 }).default("0"),
    totalStudents: integer("total_students").default(0),
    coursesCreated: integer("courses_created").default(0),
    verificationStatus: varchar("verification_status", { length: 50 })
      .default("pending"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    index("idx_teachers_user_id").on(table.userId),
    index("idx_teachers_school_id").on(table.schoolId),
  ]
);

// Subjects table
export const subjects = pgTable(
  "subjects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 255 }).notNull(),
    code: varchar("code", { length: 50 }).unique().notNull(),
    description: text("description"),
    icon: text("icon"),
    color: varchar("color", { length: 20 }),
    gradeFrom: gradeEnum("grade_from").notNull(),
    gradeTo: gradeEnum("grade_to").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [index("idx_subjects_code").on(table.code)]
);

// Courses table
export const courses = pgTable(
  "courses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: varchar("title", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).unique().notNull(),
    description: text("description"),
    thumbnail: text("thumbnail"),
    subjectId: uuid("subject_id")
      .notNull()
      .references(() => subjects.id),
    grade: gradeEnum("grade").notNull(),
    teacherId: uuid("teacher_id")
      .notNull()
      .references(() => teachers.id, { onDelete: "cascade" }),
    totalLessons: integer("total_lessons").default(0),
    totalStudents: integer("total_students").default(0),
    rating: decimal("rating", { precision: 3, scale: 2 }).default("0"),
    price: decimal("price", { precision: 10, scale: 2 }).default("0"),
    isFree: boolean("is_free").default(true),
    isPublished: boolean("is_published").default(false),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    index("idx_courses_subject_id").on(table.subjectId),
    index("idx_courses_teacher_id").on(table.teacherId),
    index("idx_courses_grade").on(table.grade),
    index("idx_courses_slug").on(table.slug),
  ]
);

// Course Enrollments table
export const courseEnrollments = pgTable(
  "course_enrollments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    progressPercentage: integer("progress_percentage").default(0),
    completedAt: timestamp("completed_at"),
    certificateId: uuid("certificate_id"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    index("idx_enrollments_student_id").on(table.studentId),
    index("idx_enrollments_course_id").on(table.courseId),
    uniqueIndex("uq_enrollment_student_course").on(table.studentId, table.courseId),
  ]
);

// Units/Chapters table
export const units = pgTable(
  "units",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    orderIndex: integer("order_index").notNull(),
    totalLessons: integer("total_lessons").default(0),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [index("idx_units_course_id").on(table.courseId)]
);

// Lessons table
export const lessons = pgTable(
  "lessons",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    unitId: uuid("unit_id")
      .notNull()
      .references(() => units.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    content: text("content"),
    orderIndex: integer("order_index").notNull(),
    durationMinutes: integer("duration_minutes"),
    isPublished: boolean("is_published").default(true),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [index("idx_lessons_unit_id").on(table.unitId)]
);

// Lesson Progress table
export const lessonProgress = pgTable(
  "lesson_progress",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    lessonId: uuid("lesson_id")
      .notNull()
      .references(() => lessons.id, { onDelete: "cascade" }),
    completed: boolean("completed").default(false),
    completedAt: timestamp("completed_at"),
    timeSpentMinutes: integer("time_spent_minutes").default(0),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    index("idx_lesson_progress_student_id").on(table.studentId),
    index("idx_lesson_progress_lesson_id").on(table.lessonId),
    uniqueIndex("uq_lesson_progress_student_lesson").on(
      table.studentId,
      table.lessonId
    ),
  ]
);

// Videos table
export const videos = pgTable(
  "videos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    lessonId: uuid("lesson_id")
      .notNull()
      .references(() => lessons.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    videoUrl: text("video_url").notNull(),
    duration: integer("duration"),
    thumbnail: text("thumbnail"),
    transcript: text("transcript"),
    isPublished: boolean("is_published").default(true),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [index("idx_videos_lesson_id").on(table.lessonId)]
);

// PDFs table
export const pdfs = pgTable(
  "pdfs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    lessonId: uuid("lesson_id")
      .notNull()
      .references(() => lessons.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    fileUrl: text("file_url").notNull(),
    fileSize: integer("file_size"),
    pages: integer("pages"),
    isPublished: boolean("is_published").default(true),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [index("idx_pdfs_lesson_id").on(table.lessonId)]
);

// Quizzes table
export const quizzes = pgTable(
  "quizzes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    lessonId: uuid("lesson_id")
      .notNull()
      .references(() => lessons.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    totalQuestions: integer("total_questions").default(0),
    passingScore: integer("passing_score").default(60),
    timeLimit: integer("time_limit"),
    isPublished: boolean("is_published").default(true),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [index("idx_quizzes_lesson_id").on(table.lessonId)]
);

// Questions table
export const questions = pgTable(
  "questions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    quizId: uuid("quiz_id")
      .notNull()
      .references(() => quizzes.id, { onDelete: "cascade" }),
    questionText: text("question_text").notNull(),
    questionType: questionTypeEnum("question_type").notNull(),
    options: json("options"),
    correctAnswer: text("correct_answer").notNull(),
    explanation: text("explanation"),
    orderIndex: integer("order_index").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [index("idx_questions_quiz_id").on(table.quizId)]
);

// Quiz Results table
export const quizResults = pgTable(
  "quiz_results",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    quizId: uuid("quiz_id")
      .notNull()
      .references(() => quizzes.id, { onDelete: "cascade" }),
    score: integer("score").notNull(),
    totalQuestions: integer("total_questions").notNull(),
    percentage: decimal("percentage", { precision: 5, scale: 2 }).notNull(),
    timeTaken: integer("time_taken"),
    passed: boolean("passed").notNull(),
    answers: json("answers"),
    submittedAt: timestamp("submitted_at").defaultNow(),
  },
  (table) => [
    index("idx_quiz_results_student_id").on(table.studentId),
    index("idx_quiz_results_quiz_id").on(table.quizId),
  ]
);

// Assignments table
export const assignments = pgTable(
  "assignments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    lessonId: uuid("lesson_id")
      .notNull()
      .references(() => lessons.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    dueDate: timestamp("due_date"),
    totalPoints: integer("total_points").default(100),
    attachments: json("attachments"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [index("idx_assignments_lesson_id").on(table.lessonId)]
);

// Assignment Submissions table
export const assignmentSubmissions = pgTable(
  "assignment_submissions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    assignmentId: uuid("assignment_id")
      .notNull()
      .references(() => assignments.id, { onDelete: "cascade" }),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    submissionText: text("submission_text"),
    attachments: json("attachments"),
    score: integer("score"),
    feedback: text("feedback"),
    submittedAt: timestamp("submitted_at").defaultNow(),
    gradedAt: timestamp("graded_at"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    index("idx_submissions_assignment_id").on(table.assignmentId),
    index("idx_submissions_student_id").on(table.studentId),
  ]
);

// Exams table
export const exams = pgTable(
  "exams",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    totalQuestions: integer("total_questions").notNull(),
    passingScore: integer("passing_score").default(60),
    timeLimit: integer("time_limit").notNull(),
    totalPoints: integer("total_points").default(100),
    examDate: timestamp("exam_date"),
    isPublished: boolean("is_published").default(false),
    randomizeQuestions: boolean("randomize_questions").default(false),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    index("idx_exams_course_id").on(table.courseId),
    index("idx_exams_exam_date").on(table.examDate),
  ]
);

// Exam Questions table
export const examQuestions = pgTable(
  "exam_questions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    examId: uuid("exam_id")
      .notNull()
      .references(() => exams.id, { onDelete: "cascade" }),
    questionText: text("question_text").notNull(),
    questionType: questionTypeEnum("question_type").notNull(),
    options: json("options"),
    correctAnswer: text("correct_answer").notNull(),
    explanation: text("explanation"),
    points: integer("points").default(1),
    orderIndex: integer("order_index").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [index("idx_exam_questions_exam_id").on(table.examId)]
);

// Exam Attempts table
export const examAttempts = pgTable(
  "exam_attempts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    examId: uuid("exam_id")
      .notNull()
      .references(() => exams.id, { onDelete: "cascade" }),
    score: integer("score").notNull(),
    totalPoints: integer("total_points").notNull(),
    percentage: decimal("percentage", { precision: 5, scale: 2 }).notNull(),
    timeTaken: integer("time_taken"),
    passed: boolean("passed").notNull(),
    answers: json("answers"),
    startedAt: timestamp("started_at").defaultNow(),
    submittedAt: timestamp("submitted_at"),
  },
  (table) => [
    index("idx_exam_attempts_student_id").on(table.studentId),
    index("idx_exam_attempts_exam_id").on(table.examId),
  ]
);

// Certificates table
export const certificates = pgTable(
  "certificates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    certificateNumber: varchar("certificate_number", { length: 100 }).unique(),
    verificationCode: varchar("verification_code", { length: 50 }).unique(),
    qrCode: text("qr_code"),
    issueDate: timestamp("issue_date").defaultNow(),
    expiryDate: timestamp("expiry_date"),
    status: certificateStatusEnum("status").default("earned"),
    certificateUrl: text("certificate_url"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    index("idx_certificates_student_id").on(table.studentId),
    index("idx_certificates_course_id").on(table.courseId),
  ]
);

// Short Notes table - quick revision notes attached to a lesson.
export const shortNotes = pgTable(
  "short_notes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    lessonId: uuid("lesson_id")
      .notNull()
      .references(() => lessons.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }).notNull(),
    content: text("content").notNull(),
    isPublished: boolean("is_published").default(true),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [index("idx_short_notes_lesson_id").on(table.lessonId)]
);

// Past Exams table - past national/school exam papers, per subject + grade,
// optionally tied to a chapter (unit). Can carry questions for online taking.
export const pastExams = pgTable(
  "past_exams",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    subjectId: uuid("subject_id")
      .notNull()
      .references(() => subjects.id, { onDelete: "cascade" }),
    grade: gradeEnum("grade").notNull(),
    unitId: uuid("unit_id").references(() => units.id, { onDelete: "set null" }),
    title: varchar("title", { length: 255 }).notNull(),
    year: integer("year"),
    description: text("description"),
    fileUrl: text("file_url"),
    totalQuestions: integer("total_questions").default(0),
    isPublished: boolean("is_published").default(true),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    index("idx_past_exams_subject_id").on(table.subjectId),
    index("idx_past_exams_grade").on(table.grade),
    index("idx_past_exams_unit_id").on(table.unitId),
  ]
);

// Past Exam Questions table - online-takeable past exam questions with
// correct answer, wrong answers (options) and explanation.
export const pastExamQuestions = pgTable(
  "past_exam_questions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    pastExamId: uuid("past_exam_id")
      .notNull()
      .references(() => pastExams.id, { onDelete: "cascade" }),
    questionText: text("question_text").notNull(),
    questionType: questionTypeEnum("question_type").notNull(),
    options: json("options"),
    correctAnswer: text("correct_answer").notNull(),
    explanation: text("explanation"),
    points: integer("points").default(1),
    orderIndex: integer("order_index").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [index("idx_past_exam_questions_exam_id").on(table.pastExamId)]
);

// Past Exam Results table - student attempts at online past exams.
export const pastExamResults = pgTable(
  "past_exam_results",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    pastExamId: uuid("past_exam_id")
      .notNull()
      .references(() => pastExams.id, { onDelete: "cascade" }),
    score: integer("score").notNull(),
    totalQuestions: integer("total_questions").notNull(),
    percentage: decimal("percentage", { precision: 5, scale: 2 }).notNull(),
    passed: boolean("passed").notNull(),
    answers: json("answers"),
    submittedAt: timestamp("submitted_at").defaultNow(),
  },
  (table) => [
    index("idx_past_exam_results_student_id").on(table.studentId),
    index("idx_past_exam_results_exam_id").on(table.pastExamId),
  ]
);

// Registration Codes table - admin-generated codes students/teachers must
// enter to create an account (closed sign-up with invite codes).
export const registrationCodes = pgTable(
  "registration_codes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    code: varchar("code", { length: 24 }).unique().notNull(),
    role: userRoleEnum("role").notNull().default("student"),
    grade: gradeEnum("grade"),
    maxUses: integer("max_uses").default(50).notNull(),
    usedCount: integer("used_count").default(0).notNull(),
    isActive: boolean("is_active").default(true),
    expiresAt: timestamp("expires_at"),
    createdById: uuid("created_by_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [index("idx_registration_codes_code").on(table.code)]
);

// Bookmarks table
export const bookmarks = pgTable(
  "bookmarks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    lessonId: uuid("lesson_id")
      .notNull()
      .references(() => lessons.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    index("idx_bookmarks_student_id").on(table.studentId),
    uniqueIndex("uq_bookmark_student_lesson").on(table.studentId, table.lessonId),
  ]
);

// Payments table
export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
    currency: varchar("currency", { length: 10 }).default("ETB"),
    paymentMethod: varchar("payment_method", { length: 50 }).notNull(),
    transactionId: varchar("transaction_id", { length: 100 }).unique(),
    status: paymentStatusEnum("status").notNull(),
    subscriptionPlan: subscriptionPlanEnum("subscription_plan"),
    courseId: uuid("course_id").references(() => courses.id),
    description: text("description"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    index("idx_payments_student_id").on(table.studentId),
    index("idx_payments_transaction_id").on(table.transactionId),
  ]
);

// Notifications table
export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }).notNull(),
    message: text("message").notNull(),
    type: varchar("type", { length: 50 }),
    relatedId: uuid("related_id"),
    read: boolean("read").default(false),
    readAt: timestamp("read_at"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    index("idx_notifications_user_id").on(table.userId),
    index("idx_notifications_read").on(table.read),
  ]
);

// Discussion Forum Posts table
export const forumPosts = pgTable(
  "forum_posts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }).notNull(),
    content: text("content").notNull(),
    upvotes: integer("upvotes").default(0),
    isAnswered: boolean("is_answered").default(false),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    index("idx_forum_posts_course_id").on(table.courseId),
    index("idx_forum_posts_user_id").on(table.userId),
  ]
);

// Forum Replies table
export const forumReplies = pgTable(
  "forum_replies",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    postId: uuid("post_id")
      .notNull()
      .references(() => forumPosts.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    upvotes: integer("upvotes").default(0),
    isAcceptedAnswer: boolean("is_accepted_answer").default(false),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    index("idx_forum_replies_post_id").on(table.postId),
    index("idx_forum_replies_user_id").on(table.userId),
  ]
);

// Live Classes table
export const liveClasses = pgTable(
  "live_classes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    teacherId: uuid("teacher_id")
      .notNull()
      .references(() => teachers.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    scheduledAt: timestamp("scheduled_at").notNull(),
    duration: integer("duration"),
    meetingUrl: text("meeting_url"),
    meetingId: varchar("meeting_id", { length: 100 }),
    platform: varchar("platform", { length: 50 }),
    recordingUrl: text("recording_url"),
    attendeeCount: integer("attendee_count").default(0),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    index("idx_live_classes_course_id").on(table.courseId),
    index("idx_live_classes_scheduled_at").on(table.scheduledAt),
  ]
);

// Live Class Attendance table
export const liveClassAttendance = pgTable(
  "live_class_attendance",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    liveClassId: uuid("live_class_id")
      .notNull()
      .references(() => liveClasses.id, { onDelete: "cascade" }),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    joinedAt: timestamp("joined_at").defaultNow(),
    leftAt: timestamp("left_at"),
    duration: integer("duration"),
  },
  (table) => [
    index("idx_attendance_live_class_id").on(table.liveClassId),
    index("idx_attendance_student_id").on(table.studentId),
  ]
);

// Performance Analytics table
export const performanceAnalytics = pgTable(
  "performance_analytics",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    subjectId: uuid("subject_id")
      .notNull()
      .references(() => subjects.id, { onDelete: "cascade" }),
    averageScore: decimal("average_score", { precision: 5, scale: 2 }),
    averageQuizScore: decimal("average_quiz_score", { precision: 5, scale: 2 }),
    averageExamScore: decimal("average_exam_score", { precision: 5, scale: 2 }),
    weakTopics: json("weak_topics"),
    strongTopics: json("strong_topics"),
    totalQuestionsAttempted: integer("total_questions_attempted").default(0),
    correctAnswers: integer("correct_answers").default(0),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    index("idx_analytics_student_id").on(table.studentId),
    index("idx_analytics_subject_id").on(table.subjectId),
    uniqueIndex("uq_analytics_student_subject").on(
      table.studentId,
      table.subjectId
    ),
  ]
);

// AI Recommendations table
export const aiRecommendations = pgTable(
  "ai_recommendations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    recommendationType: varchar("recommendation_type", { length: 50 }).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    relatedCourseId: uuid("related_course_id").references(() => courses.id),
    relatedLessonId: uuid("related_lesson_id").references(() => lessons.id),
    confidence: decimal("confidence", { precision: 3, scale: 2 }),
    isApplied: boolean("is_applied").default(false),
    createdAt: timestamp("created_at").defaultNow(),
    expiresAt: timestamp("expires_at"),
  },
  (table) => [
    index("idx_recommendations_student_id").on(table.studentId),
    index("idx_recommendations_type").on(table.recommendationType),
  ]
);

// Study Schedule table
export const studySchedules = pgTable(
  "study_schedules",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    dayOfWeek: integer("day_of_week"),
    startTime: varchar("start_time", { length: 10 }),
    endTime: varchar("end_time", { length: 10 }),
    subjectId: uuid("subject_id").references(() => subjects.id),
    topic: varchar("topic", { length: 255 }),
    isCompleted: boolean("is_completed").default(false),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [index("idx_study_schedules_student_id").on(table.studentId)]
);

// Export relations for better type safety
export const usersRelations = relations(users, ({ many, one }) => ({
  students: many(students),
  teachers: many(teachers),
  schoolAdmins: many(schoolAdmins),
  notifications: many(notifications),
  forumPosts: many(forumPosts),
  forumReplies: many(forumReplies),
}));

export const studentsRelations = relations(students, ({ one, many }) => ({
  user: one(users, { fields: [students.userId], references: [users.id] }),
  school: one(schools, { fields: [students.schoolId], references: [schools.id] }),
  enrollments: many(courseEnrollments),
  lessonProgress: many(lessonProgress),
  quizResults: many(quizResults),
  submissions: many(assignmentSubmissions),
  examAttempts: many(examAttempts),
  certificates: many(certificates),
  bookmarks: many(bookmarks),
  payments: many(payments),
  performanceAnalytics: many(performanceAnalytics),
  aiRecommendations: many(aiRecommendations),
  studySchedules: many(studySchedules),
  liveClassAttendance: many(liveClassAttendance),
}));

export const teachersRelations = relations(teachers, ({ one, many }) => ({
  user: one(users, { fields: [teachers.userId], references: [users.id] }),
  school: one(schools, { fields: [teachers.schoolId], references: [schools.id] }),
  courses: many(courses),
  liveClasses: many(liveClasses),
}));

export const coursesRelations = relations(courses, ({ one, many }) => ({
  subject: one(subjects, { fields: [courses.subjectId], references: [subjects.id] }),
  teacher: one(teachers, { fields: [courses.teacherId], references: [teachers.id] }),
  enrollments: many(courseEnrollments),
  units: many(units),
  exams: many(exams),
  forumPosts: many(forumPosts),
  liveClasses: many(liveClasses),
}));

export const unitsRelations = relations(units, ({ one, many }) => ({
  course: one(courses, { fields: [units.courseId], references: [courses.id] }),
  lessons: many(lessons),
}));

export const lessonsRelations = relations(lessons, ({ one, many }) => ({
  unit: one(units, { fields: [lessons.unitId], references: [units.id] }),
  videos: many(videos),
  pdfs: many(pdfs),
  quizzes: many(quizzes),
  assignments: many(assignments),
  lessonProgress: many(lessonProgress),
  bookmarks: many(bookmarks),
}));
