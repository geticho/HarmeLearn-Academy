# 🔐 Admin Guide — Closed Mode (Option B)

HarmeLearn Academy runs in **closed mode**: there is **no public sign-up**, and
**only administrators** can create accounts or publish learning material.

---

## 1. Who can do what

| Action | Super Admin | School Admin | Teacher | Student |
|---|:--:|:--:|:--:|:--:|
| Create student accounts | ✅ | ✅ | ❌ | ❌ |
| Create teacher accounts | ✅ | ✅ | ❌ | ❌ |
| Create other admin accounts | ✅ | ❌ | ❌ | ❌ |
| Delete accounts | ✅ | ❌ | ❌ | ❌ |
| Reset a user's password | ✅ | ✅ | ❌ | ❌ |
| Enable / disable a user | ✅ | ✅ | ❌ | ❌ |
| Create subjects | ✅ | ✅ | ❌ | ❌ |
| Create courses / units / lessons | ✅ | ✅ | ❌ | ❌ |
| Upload videos | ✅ | ✅ | ❌ | ❌ |
| Upload PDFs | ✅ | ✅ | ❌ | ❌ |
| Create quizzes & questions | ✅ | ✅ | ❌ | ❌ |
| Teach, grade, run live classes | — | — | ✅ | ❌ |
| Study, take quizzes | — | — | — | ✅ |

---

## 2. First login

Because self-registration is disabled, a missing admin row would lock everybody
out. The platform therefore **creates a Super Admin automatically**:

```
Email:    admin@harmelearn.et
Password: Admin@12345
```

Sign in at `/login` — you are redirected to `/admin`.

### How the auto-seed works

`src/instrumentation.ts` runs once when the server boots and calls
`ensureSuperAdmin()` (`src/lib/bootstrap.ts`). The same function also runs on
every `POST /api/auth/login`, which covers the case where the database was not
migrated yet at boot time.

It is **idempotent and non-destructive**:

* If *any* `super_admin` already exists → does nothing.
* If the default email exists but is not an admin → upgrades that row.
* Otherwise → creates the default account.

So it can never overwrite a real administrator you created yourself, and it can
never leave you locked out of a freshly provisioned database.

Override the defaults with environment variables:

```
ADMIN_EMAIL=principal@yourschool.et
ADMIN_PASSWORD=Str0ng@Passphrase
```

### Manual reset

There is also a CLI tool, useful for rotating a forgotten password:

```bash
node scripts/seed-admin.mjs                              # defaults
node scripts/seed-admin.mjs you@school.et 'Str0ng@Pass'  # custom
```

Unlike the auto-seed, this **does** overwrite the password of an existing
account, so it doubles as admin-lockout recovery.

> ⚠️ Change the default password before real use — it is published in this
> repository.

---

## 3. Recommended set-up order

The Admin Console home page shows this as a live checklist:

1. **Subjects** (`/admin/subjects`) — Mathematics, Physics, Chemistry…
2. **Teachers** (`/admin/teachers`) — register your teaching staff
3. **Curriculum** (`/admin/curriculum`) — Course → Unit → Lesson → Quiz
4. **Videos & PDFs** (`/admin/content`) — attach material to lessons
5. **Question Bank** (`/admin/questions`) — author quiz/exam questions
6. **Students** (`/admin/students`) — enrol your learners

Content must be created in that order because each layer references the one
above it (a video needs a lesson, a lesson needs a unit, a unit needs a course).

---

## 4. Creating a student or teacher

`/admin/students` or `/admin/teachers` → **+ Add**.

* Leave the **password field blank** and the system generates a temporary one
  like `Harme-4821-kt`. It is shown **once**, on screen, right after creation —
  copy it and hand it to the user.
* Students require a **grade** (9–12); a stream (Natural / Social) is optional
  and normally used for grades 11–12.
* Teachers created by an admin are automatically marked **verified**.
* Accounts created this way have `emailVerified = true`, so no email round-trip
  is needed.

**Managing an existing account** — each row has:

* **Reset password** → generates and displays a new temporary password
* **Disable / Enable** → blocks sign-in without deleting data
* **Delete** → permanently removes the account (Super Admin only)

---

## 5. Adding videos, PDFs and questions

All three live behind admin-only APIs and admin-only pages.

**Videos / PDFs** (`/admin/content`) — you store the file wherever you like
(YouTube, Vimeo, S3, school server) and paste the **URL**. The platform
validates that it begins with `http://` or `https://` and that the target lesson
exists.

**Questions** (`/admin/questions`) — pick the quiz, then the type:

| Type | Behaviour |
|---|---|
| Multiple choice | 2–4 options; the correct answer must exactly match one option (validated server-side) |
| True / False | Answer must be `true` or `false` |
| Short answer | Requires a model answer |
| Essay | Stored with marking guidance; graded manually |

Question order and the quiz's `totalQuestions` counter are maintained
automatically.

---

## 6. How the lock-down is enforced

This is enforced **on the server**, not in the browser:

1. **Sessions live in the database.** `POST /api/auth/login` writes a row to the
   `sessions` table and returns an opaque token in an **httpOnly** cookie. The
   browser never holds the role, so editing `localStorage` achieves nothing.
2. **Every privileged API calls `requireAdmin()`** (`src/lib/session.ts`), which
   resolves the session → user → role from Postgres and throws `401`/`403`.
3. **`/admin/*` is guarded by a server layout** (`src/app/admin/layout.tsx`)
   that redirects non-admins to `/not-authorized` before any HTML renders.
4. **`POST /api/auth/register` always returns 403** — the endpoint cannot create
   anything at all.
5. **Every admin write is audited** into `audit_logs` (who, what, when), shown
   on the Admin Console home page.

Verified behaviour:

| Request | Result |
|---|---|
| `POST /api/auth/register` | `403` |
| `POST /api/admin/users` (no session) | `401` |
| `POST /api/admin/videos` (no session) | `401` |
| `POST /api/subjects` (no session) | `401` |
| `POST /api/admin/videos` (student session) | `403` |
| `POST /api/admin/users` (student session) | `403` |
| `GET /admin` (no session) | `307 → /login?next=/admin` |
| `GET /admin` (student session) | `307 → /not-authorized` |

---

## 7. Admin API reference

All require an admin session cookie.

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/admin/users?role=student&search=` | List accounts |
| POST | `/api/admin/users` | **Create** student / teacher / admin |
| PATCH | `/api/admin/users/[id]` | Update, disable, reset password |
| DELETE | `/api/admin/users/[id]` | Delete (Super Admin only) |
| GET | `/api/admin/catalog` | All dropdown data in one call |
| POST | `/api/admin/structure` | Create course / unit / lesson / quiz |
| GET·POST | `/api/admin/videos` | List / add videos |
| GET·POST | `/api/admin/pdfs` | List / add PDFs |
| GET·POST | `/api/admin/questions` | List / add questions |
| DELETE | `/api/admin/content/[type]/[id]` | Delete video, pdf, question, quiz, subject |
| POST | `/api/subjects` | Create subject (admin-gated) |
| POST | `/api/courses` | Create course (admin-gated) |

---

## 8. Public registration (Option A) — currently ENABLED

This deployment runs in **hybrid mode**:

* **Students and teachers can self-register** at `/signup` and are signed in
  immediately. Teachers start with `verificationStatus = pending`.
* **Content stays admin-managed**: subjects, courses, units, lessons, videos,
  PDFs and questions can still only be created by an administrator (the APIs
  all call `requireAdmin()`).
* **Administrator accounts cannot be self-registered** — they are created only
  by the bootstrap (`src/lib/bootstrap.ts`), the seed script, or an existing
  admin.

To close registration again (strict Option B), make `POST /api/auth/register`
return `403` and replace `/signup` with a notice page — nothing else needs to
change.
