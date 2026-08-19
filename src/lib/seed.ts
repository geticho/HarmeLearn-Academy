import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  courses,
  lessons,
  pastExamQuestions,
  pastExams,
  pdfs,
  questions,
  quizzes,
  registrationCodes,
  shortNotes,
  subjects,
  teachers,
  units,
  users,
  videos,
} from "@/db/schema";
import { hashPassword } from "@/lib/auth";
import { generateSlug } from "@/lib/utils";

const GRADES = ["9", "10", "11", "12"] as const;
type Grade = (typeof GRADES)[number];

const SAMPLE_PDF = "https://www.africau.edu/images/default/sample.pdf";
const DEMO_TEACHER_EMAIL = "demo.teacher@harmelearn.et";
const DEMO_TEACHER_PASSWORD = "DemoTeacher@123";

const SUBJECTS = [
  { name: "Mathematics", code: "MATH", icon: "🔢", color: "#2563eb" },
  { name: "Physics", code: "PHYS", icon: "⚛️", color: "#7c3aed" },
  { name: "Chemistry", code: "CHEM", icon: "🧪", color: "#059669" },
  { name: "Biology", code: "BIO", icon: "🧬", color: "#dc2626" },
  { name: "English", code: "ENG", icon: "📖", color: "#d97706" },
  { name: "History", code: "HIST", icon: "🏛️", color: "#b45309" },
  { name: "Geography", code: "GEOG", icon: "🌍", color: "#0891b2" },
  { name: "Economics", code: "ECON", icon: "💹", color: "#4f46e5" },
] as const;

const QUESTION_BANK: Record<
  string,
  { q: string; o: string[]; a: string }[]
> = {
  Mathematics: [
    { q: "Solve for x: 3x + 6 = 18", o: ["2", "3", "4", "6"], a: "4" },
    { q: "What is the value of 2⁵?", o: ["10", "16", "25", "32"], a: "32" },
    { q: "Which number is a prime number?", o: ["1", "9", "11", "15"], a: "11" },
  ],
  Physics: [
    { q: "Which unit is used to measure force?", o: ["Joule", "Newton", "Watt", "Pascal"], a: "Newton" },
    { q: "What is the SI unit of energy?", o: ["Joule", "Newton", "Ampere", "Volt"], a: "Joule" },
    { q: "Speed equals distance divided by…", o: ["time", "mass", "force", "volume"], a: "time" },
  ],
  Chemistry: [
    { q: "What is the chemical formula of water?", o: ["CO2", "H2O", "O2", "NaCl"], a: "H2O" },
    { q: "What is the pH of pure water?", o: ["0", "7", "14", "1"], a: "7" },
    { q: "Which gas do plants absorb during photosynthesis?", o: ["Oxygen", "Carbon dioxide", "Nitrogen", "Hydrogen"], a: "Carbon dioxide" },
  ],
  Biology: [
    { q: "Which organelle is the powerhouse of the cell?", o: ["Nucleus", "Mitochondria", "Ribosome", "Golgi"], a: "Mitochondria" },
    { q: "How many chambers does the human heart have?", o: ["2", "3", "4", "5"], a: "4" },
    { q: "Which process do plants use to make food?", o: ["Respiration", "Photosynthesis", "Digestion", "Fermentation"], a: "Photosynthesis" },
  ],
  English: [
    { q: "Which word is a noun?", o: ["Run", "Happy", "Book", "Quickly"], a: "Book" },
    { q: "What is the past tense of 'go'?", o: ["Gone", "Went", "Going", "Goes"], a: "Went" },
    { q: "Choose the antonym of 'brave'.", o: ["Cowardly", "Strong", "Bold", "Fearless"], a: "Cowardly" },
  ],
  History: [
    { q: "In which year was the Battle of Adwa fought?", o: ["1889", "1896", "1935", "1941"], a: "1896" },
    { q: "Which site in Ethiopia is famous for the discovery of Lucy?", o: ["Hadar", "Axum", "Lalibela", "Gondar"], a: "Hadar" },
    { q: "Which empire had its capital at Axum?", o: ["Aksumite Empire", "Ottoman", "British", "Roman"], a: "Aksumite Empire" },
  ],
  Geography: [
    { q: "Which lake is the largest in Ethiopia?", o: ["Lake Tana", "Lake Abaya", "Lake Ziway", "Lake Chamo"], a: "Lake Tana" },
    { q: "Which country borders Ethiopia to the north?", o: ["Eritrea", "Kenya", "Sudan", "Somalia"], a: "Eritrea" },
    { q: "Which river is known as the Abbay in Ethiopia?", o: ["Blue Nile", "Tekeze", "Awash", "Omo"], a: "Blue Nile" },
  ],
  Economics: [
    { q: "What does GDP stand for?", o: ["Gross Domestic Product", "General Development Plan", "Global Data Project", "Gross Daily Profit"], a: "Gross Domestic Product" },
    { q: "Which is a fundamental economic problem?", o: ["Scarcity", "Abundance", "Surplus", "Wealth"], a: "Scarcity" },
    { q: "In a market, supply and demand determine…", o: ["price", "taxes", "wages", "rent"], a: "price" },
  ],
};

const FALLBACK_QUESTIONS = [
  { q: "What is 2 + 2?", o: ["3", "4", "5", "6"], a: "4" },
  { q: "Which shape has four equal sides?", o: ["Triangle", "Square", "Circle", "Rectangle"], a: "Square" },
  { q: "What colour do you get by mixing blue and yellow?", o: ["Red", "Green", "Purple", "Orange"], a: "Green" },
];

const NOTE_TEMPLATES: Record<string, string> = {
  Mathematics:
    "• Memorise the key formulas for this unit\n• Always show your working steps\n• Practise 5 problems every day\n• Review your mistakes from past exams",
  Physics:
    "• Understand the concepts before the formulas\n• Write down the units for every quantity\n• Practise past exam problems\n• Revise the definitions and laws",
  Chemistry:
    "• Learn the symbols of common elements\n• Balance equations step by step\n• Know the lab safety rules\n• Revise periodic table trends",
  Biology:
    "• Draw and label diagrams from memory\n• Learn the definitions of key terms\n• Use mnemonics for classification\n• Revise with past exam questions",
  English:
    "• Read a passage every day\n• Learn 5 new vocabulary words daily\n• Practise grammar exercises\n• Review essay structure for exams",
  History:
    "• Create a timeline of key events\n• Learn dates, causes and consequences\n• Connect events to modern Ethiopia\n• Practise essay answers from past exams",
  Geography:
    "• Study maps and locate key features\n• Learn the climate zones of Ethiopia\n• Practise interpreting graphs and charts\n• Revise past exam map questions",
  Economics:
    "• Understand supply and demand graphs\n• Learn key economic definitions\n• Practise calculations (GDP, inflation)\n• Revise with past exam papers",
};

const FALLBACK_NOTE =
  "• Review your class notes daily\n• Practise questions from past exams\n• Ask your teacher about difficult topics\n• Study a little every day";

function noteFor(subject: string): string {
  return NOTE_TEMPLATES[subject] ?? FALLBACK_NOTE;
}

function questionsFor(subject: string) {
  return QUESTION_BANK[subject] ?? FALLBACK_QUESTIONS;
}

function videoUrlFor(subject: string, grade: Grade): string {
  const query = encodeURIComponent(`${subject} grade ${grade} lesson`);
  return `https://www.youtube.com/results?search_query=${query}`;
}

export const DEMO_STUDENT_CODE = "DEMO-STUDENT";
export const DEMO_TEACHER_CODE = "DEMO-TEACHER";

let seeded = false;
let codesSeeded = false;

/**
 * Creates demo registration codes so the site stays testable out of the box.
 * The admin can disable these or generate their own from the Admin Console.
 */
export async function seedDemoCodes(): Promise<void> {
  if (codesSeeded) return;

  const countRows = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(registrationCodes)
    .catch(() => [{ n: 1 }]);

  if ((countRows[0]?.n ?? 0) > 0) {
    codesSeeded = true;
    return;
  }

  console.log("[seed] Creating demo registration codes…");

  await db.insert(registrationCodes).values([
    {
      code: DEMO_STUDENT_CODE,
      role: "student",
      maxUses: 1000,
      isActive: true,
    },
    {
      code: DEMO_TEACHER_CODE,
      role: "teacher",
      maxUses: 1000,
      isActive: true,
    },
  ]);

  codesSeeded = true;
  console.log(
    `[seed] Demo codes ready — student: ${DEMO_STUDENT_CODE}, teacher: ${DEMO_TEACHER_CODE}`
  );
}

/**
 * Creates the full demo curriculum — every subject × every grade, each with
 * videos, PDFs, short notes, quizzes and past exams — so students always see
 * content under every subject on their dashboard.
 *
 * Runs automatically at server boot when the `courses` table is empty
 * (disable with SEED_DEMO=false). Fully idempotent.
 */
export async function seedDemoContent(): Promise<void> {
  if (seeded) return;

  const countRows = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(courses)
    .catch(() => [{ n: 1 }]); // table missing? skip seeding.

  if ((countRows[0]?.n ?? 0) > 0) {
    console.log("[seed] Demo content already exists — skipping.");
    seeded = true;
    return;
  }

  console.log("[seed] Seeding the demo curriculum (subjects × grades 9–12)…");

  // 1. Teacher (reuse an existing teacher or an existing demo-teacher user).
  let teacherId: string | null = null;
  const existingTeachers = await db.select({ id: teachers.id }).from(teachers).limit(1);
  if (existingTeachers[0]) {
    teacherId = existingTeachers[0].id;
  } else {
    // The user row may already exist from a previous seed — reuse it.
    let teacherUserId: string;
    const existingUser = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, DEMO_TEACHER_EMAIL))
      .limit(1);

    if (existingUser[0]) {
      teacherUserId = existingUser[0].id;
    } else {
      const [teacherUser] = await db
        .insert(users)
        .values({
          email: DEMO_TEACHER_EMAIL,
          passwordHash: hashPassword(DEMO_TEACHER_PASSWORD),
          firstName: "Selam",
          lastName: "Bekele",
          role: "teacher",
          emailVerified: true,
        })
        .returning();
      teacherUserId = teacherUser.id;
    }

    const [teacher] = await db
      .insert(teachers)
      .values({
        userId: teacherUserId,
        specialization: "General Science",
        employeeId: "DEMO-001",
        verificationStatus: "verified",
      })
      .returning();
    teacherId = teacher.id;
  }

  let subjectCount = 0;
  let courseCount = 0;
  let lessonCount = 0;
  let quizCount = 0;
  let pastExamCount = 0;

  for (const subjectDef of SUBJECTS) {
    // 2. Subject (upsert by code).
    let subjectId: string;
    const existingSubject = await db
      .select({ id: subjects.id })
      .from(subjects)
      .where(eq(subjects.code, subjectDef.code))
      .limit(1);

    if (existingSubject[0]) {
      subjectId = existingSubject[0].id;
    } else {
      const [subject] = await db
        .insert(subjects)
        .values({
          name: subjectDef.name,
          code: subjectDef.code,
          description: `${subjectDef.name} for the Ethiopian secondary curriculum (Grades 9–12).`,
          icon: subjectDef.icon,
          color: subjectDef.color,
          gradeFrom: "9",
          gradeTo: "12",
        })
        .returning();
      subjectId = subject.id;
      subjectCount++;
    }

    const bank = questionsFor(subjectDef.name);

    for (const grade of GRADES) {
      // 3. Course per subject × grade.
      const slug = `${subjectDef.code.toLowerCase()}-grade-${grade}`;
      const existingCourse = await db
        .select({ id: courses.id })
        .from(courses)
        .where(eq(courses.slug, slug))
        .limit(1);

      let courseId: string;
      if (existingCourse[0]) {
        courseId = existingCourse[0].id;
      } else {
        const [course] = await db
          .insert(courses)
          .values({
            title: `${subjectDef.name} Grade ${grade}`,
            slug,
            description: `Complete ${subjectDef.name} course for Grade ${grade} — Ethiopian secondary curriculum.`,
            subjectId,
            grade,
            teacherId,
            isFree: true,
            isPublished: true,
          })
          .returning();
        courseId = course.id;
        courseCount++;
      }

      // 4. Units → lessons → content.
      const unitDefs = [
        { title: "Unit 1: Foundations", lessons: ["Lesson 1: Introduction", "Lesson 2: Core concepts"] },
        { title: "Unit 2: Applications", lessons: ["Lesson 1: Worked examples", "Lesson 2: Revision"] },
      ];

      for (let ui = 0; ui < unitDefs.length; ui++) {
        const unitDef = unitDefs[ui];

        const existingUnit = await db
          .select({ id: units.id })
          .from(units)
          .where(
            sql`${units.courseId} = ${courseId} and ${units.title} = ${unitDef.title}`
          )
          .limit(1);
        let unitId: string;

        if (existingUnit[0]) {
          unitId = existingUnit[0].id;
        } else {
          const [unit] = await db
            .insert(units)
            .values({
              courseId,
              title: unitDef.title,
              description: `${unitDef.title} of ${subjectDef.name} Grade ${grade}.`,
              orderIndex: ui + 1,
            })
            .returning();
          unitId = unit.id;
        }

        for (let li = 0; li < unitDef.lessons.length; li++) {
          const lessonTitle = `${unitDef.lessons[li]} — ${subjectDef.name}`;

          const existingLesson = await db
            .select({ id: lessons.id })
            .from(lessons)
            .where(
              sql`${lessons.unitId} = ${unitId} and ${lessons.title} = ${lessonTitle}`
            )
            .limit(1);
          let lessonId: string;

          if (existingLesson[0]) {
            lessonId = existingLesson[0].id;
          } else {
            const [lesson] = await db
              .insert(lessons)
              .values({
                unitId,
                title: lessonTitle,
                description: `${lessonTitle} (Grade ${grade}).`,
                content: `Detailed notes for ${lessonTitle}.`,
                orderIndex: li + 1,
                durationMinutes: 40,
              })
              .returning();
            lessonId = lesson.id;
            lessonCount++;
          }

          // Video
          await db
            .insert(videos)
            .values({
              lessonId,
              title: `Video: ${lessonTitle}`,
              description: `HD lesson video for ${lessonTitle}.`,
              videoUrl: videoUrlFor(subjectDef.name, grade),
              duration: 540 + lessonCount * 7,
            })
            .onConflictDoNothing()
            .catch(() => {});

          // PDF
          await db
            .insert(pdfs)
            .values({
              lessonId,
              title: `PDF: ${lessonTitle} notes`,
              description: "Printable notes and exercises.",
              fileUrl: SAMPLE_PDF,
              pages: 8,
            })
            .onConflictDoNothing()
            .catch(() => {});

          // Short note
          await db
            .insert(shortNotes)
            .values({
              lessonId,
              title: `Short notes — ${lessonTitle}`,
              content: noteFor(subjectDef.name),
            })
            .onConflictDoNothing()
            .catch(() => {});

          // Quiz + questions (one quiz per lesson — scope by lessonId).
          const existingQuiz = await db
            .select({ id: quizzes.id })
            .from(quizzes)
            .where(
              sql`${quizzes.lessonId} = ${lessonId} and ${quizzes.title} = ${`Quiz: ${lessonTitle}`}`
            )
            .limit(1);

          if (!existingQuiz[0]) {
            const [quiz] = await db
              .insert(quizzes)
              .values({
                lessonId,
                title: `Quiz: ${lessonTitle}`,
                description: "Check what you have learned.",
                passingScore: 60,
                timeLimit: 10,
              })
              .returning();

            for (let qi = 0; qi < bank.length; qi++) {
              const item = bank[qi];
              await db
                .insert(questions)
                .values({
                  quizId: quiz.id,
                  questionText: item.q,
                  questionType: "multiple_choice",
                  options: item.o as never,
                  correctAnswer: item.a,
                  explanation: `The correct answer is ${item.a}.`,
                  orderIndex: qi + 1,
                })
                .onConflictDoNothing()
                .catch(() => {});
            }

            await db
              .update(quizzes)
              .set({ totalQuestions: bank.length })
              .where(eq(quizzes.id, quiz.id));
            quizCount++;
          }
        }

        // Keep counters accurate.
        await db
          .update(units)
          .set({ totalLessons: unitDef.lessons.length })
          .where(eq(units.id, unitId));
      }

      // 5. Past exams (two most recent years per subject × grade — dynamic,
      // so the site never looks out of date). Each gets 3 online questions
      // with correct answer, wrong answers and an explanation.
      const currentYear = new Date().getFullYear();
      for (const year of [currentYear, currentYear - 1]) {
        const examTitle = `National Exam — ${subjectDef.name} (Grade ${grade}) — ${year}`;
        const existingExam = await db
          .select({ id: pastExams.id })
          .from(pastExams)
          .where(eq(pastExams.title, examTitle))
          .limit(1);

        if (!existingExam[0]) {
          const [exam] = await db
            .insert(pastExams)
            .values({
              subjectId,
              grade,
              title: examTitle,
              year,
              description: `Full ${year} national exam — take it online with instant answers & explanations.`,
              fileUrl: SAMPLE_PDF,
            })
            .returning();

          for (let qi = 0; qi < bank.length; qi++) {
            const item = bank[qi];
            await db
              .insert(pastExamQuestions)
              .values({
                pastExamId: exam.id,
                questionText: item.q,
                questionType: "multiple_choice",
                options: item.o as never,
                correctAnswer: item.a,
                explanation: `The correct answer is ${item.a}.`,
                orderIndex: qi + 1,
              })
              .onConflictDoNothing()
              .catch(() => {});
          }

          await db
            .update(pastExams)
            .set({ totalQuestions: bank.length })
            .where(eq(pastExams.id, exam.id));
          pastExamCount++;
        }
      }
    }
  }

  seeded = true;
  console.log(
    `[seed] Done — ${subjectCount} subjects, ${courseCount} courses, ${lessonCount} lessons, ${quizCount} quizzes, ${pastExamCount} past exams.`
  );
}
