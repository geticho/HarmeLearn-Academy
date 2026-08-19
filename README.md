# 🎓 HarmeLearn Academy - AI-Powered Educational LMS

An innovative, modern Learning Management System (LMS) designed specifically for Ethiopian secondary students (Grades 9-12). Built with Next.js, PostgreSQL, and AI-powered learning features.

## 🌟 Features

### For Students
- **Personalized Learning Dashboard** - Track progress, view enrolled courses, and continue learning
- **Course Catalog** - Browse 500+ courses across all subjects and grades
- **Interactive Content** - Videos, PDFs, notes, and multimedia lessons
- **Online Exams & Quizzes** - Practice quizzes, chapter exams, and mock exams with instant results
- **Progress Tracking** - Detailed analytics showing performance by subject
- **AI-Powered Features**:
  - AI Tutor for homework help
  - Weak topic detection
  - Personalized study recommendations
  - Learning streak tracking
- **Certificates** - Auto-generated verified certificates with QR codes
- **Discussion Forum** - Ask questions and learn from peers
- **Bookmarks & Downloads** - Save lessons and download for offline study
- **Live Classes** - Attend interactive live sessions with teachers

### For Teachers
- **Course Creation Tools** - Create and manage complete courses
- **Content Management** - Upload videos, PDFs, PowerPoints, audio, and images
- **Assignment Management** - Create and grade assignments
- **Quiz & Exam Builder** - Design quizzes and exams with various question types
- **Live Classes** - Schedule and conduct live sessions
- **Student Analytics** - Monitor student progress and performance
- **Revenue Dashboard** - Track earnings from premium courses
- **Verification System** - Verified teacher badges

### For Admins & School Leaders
- **User Management** - Manage students, teachers, and school administrators
- **Course Moderation** - Review and publish courses
- **Revenue Analytics** - Track platform revenue and transactions
- **Student Statistics** - Enrollment, completion rates, and performance metrics
- **Teacher Statistics** - Course popularity, ratings, and earnings
- **Announcements** - Broadcast important messages to users
- **Content Library** - Manage subjects, courses, and materials
- **Payment Management** - Handle subscriptions and course purchases
- **Reports & Analytics** - Comprehensive platform analytics

## 🏗️ Technology Stack

### Frontend
- **Next.js 16** (App Router)
- **React 19** with TypeScript
- **Tailwind CSS 4** for styling
- **Modern, responsive design** - Mobile-first approach
- **Client-side interactivity** - Form validation, real-time updates

### Backend
- **Next.js API Routes** - RESTful API endpoints
- **TypeScript** for type safety
- **JWT-based Authentication**
- **Environment variables** for configuration

### Database
- **PostgreSQL** - Reliable, scalable database
- **Drizzle ORM** - Type-safe database queries
- **Relations & Foreign Keys** - Data integrity
- **Migrations-ready schema**

### Authentication
- **JWT Token-based** authentication
- **Password hashing** (PBKDF2)
- **Session management**
- **Email verification ready**
- **Google OAuth** integration ready

## 📊 Database Schema

### Core Tables
- **users** - All platform users with roles
- **students** - Student profiles with grade/stream
- **teachers** - Teacher profiles with specialization
- **schools** - School information and management
- **schoolAdmins** - School admin assignments

### Content Management
- **courses** - Course information and metadata
- **units** - Course chapters/units
- **lessons** - Individual lessons within units
- **videos** - Video content
- **pdfs** - PDF resources
- **assignments** - Assignment definitions
- **assignmentSubmissions** - Student submissions

### Learning & Assessment
- **quizzes** - Quiz definitions
- **questions** - Quiz/exam questions
- **quizResults** - Student quiz results
- **exams** - Final exams
- **examQuestions** - Exam questions
- **examAttempts** - Student exam attempts
- **lessonProgress** - Student lesson progress tracking

### Community & Communication
- **forumPosts** - Discussion forum posts
- **forumReplies** - Forum replies
- **liveClasses** - Scheduled live classes
- **liveClassAttendance** - Attendance tracking
- **notifications** - User notifications

### Analytics & Certificates
- **performanceAnalytics** - Student performance data
- **aiRecommendations** - AI-generated recommendations
- **studySchedules** - Study timetables
- **certificates** - Earned certificates
- **bookmarks** - Saved lessons
- **payments** - Transaction records

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL database
- Environment variables configured

### Installation

```bash
# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your database URL and settings

# Initialize database
npx drizzle-kit push

# Run development server
npm run dev

# Open http://localhost:3000
```

### Build for Production

```bash
# Create optimized production build
npm run build

# Start production server
npm start
```

## 📁 Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── courses/
│   │   │   └── [courseId]/
│   │   │       └── units/
│   │   ├── units/
│   │   │   └── [unitId]/
│   │   │       └── lessons/
│   │   ├── subjects/
│   │   └── health/
│   ├── dashboard/
│   │   ├── student/
│   │   └── teacher/
│   ├── admin/
│   ├── about/
│   ├── contact/
│   ├── courses/
│   ├── login/
│   ├── signup/
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── db/
│   ├── schema.ts (Complete database schema)
│   └── index.ts (Database connection)
├── lib/
│   ├── auth.ts (Authentication utilities)
│   └── utils.ts (Helper functions)
└── components/ (Reusable React components)
```

## 🔐 Authentication Flow

1. **Registration** - User creates account (Student/Teacher)
2. **Email Verification** - Optional email verification
3. **Login** - JWT token issued on successful login
4. **Session Management** - HTTP-only cookies store session
5. **Protected Routes** - Check authentication on dashboard pages

## 💻 API Endpoints

### Authentication
- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - User login

### Courses
- `GET /api/courses` - List all courses (with filtering)
- `POST /api/courses` - Create new course (Teachers)
- `GET /api/subjects` - List all subjects
- `POST /api/subjects` - Create subject (Admin)

### Course Structure
- `GET /api/courses/[courseId]/units` - Get course units
- `POST /api/courses/[courseId]/units` - Create unit
- `GET /api/units/[unitId]/lessons` - Get lessons
- `POST /api/units/[unitId]/lessons` - Create lesson

### Health Check
- `GET /api/health` - Platform health status

## 🎨 Design System

### Color Palette
- **Primary Blue** - #2563eb (Main actions)
- **Secondary Green** - #10b981 (Success states)
- **Accent Orange** - #f97316 (Highlights)
- **Dark** - #1f2937 (Text)
- **Light** - #f9fafb (Backgrounds)

### Components
- Modern card-based layouts
- Glassmorphism effects
- Smooth animations
- Rounded corners (8px-16px)
- Consistent spacing (8px grid)

## 📱 Responsive Design

- **Mobile-first** approach
- **Breakpoints**: 768px (tablet), 1024px (desktop)
- **Touch-friendly** interface
- **Progressive enhancement**

## 🔒 Security Features

- **Password hashing** with PBKDF2
- **JWT authentication** with secure tokens
- **SQL injection protection** via Drizzle ORM
- **XSS protection** with Next.js built-in features
- **CSRF protection** ready
- **Input validation** on all endpoints
- **Role-based access control** (RBAC)

## 📈 Scalability

- **Database optimization** with proper indexes
- **API pagination** ready
- **Caching strategies** can be added
- **CDN ready** for static assets
- **File upload system** designed for cloud storage

## 🎯 User Roles

| Role | Access Level | Capabilities |
|------|---|---|
| **Student** | User | Browse courses, submit assignments, take exams, view analytics |
| **Teacher** | Admin | Create courses, upload content, grade assignments, view student progress |
| **School Admin** | Admin | Manage school users, oversee courses, view reports |
| **Super Admin** | Full | Manage all users, courses, payments, and platform settings |
| **Parent** | Limited | View child's progress (optional feature) |

## 📊 Analytics & Reporting

### Student Analytics
- Performance by subject
- Weak topic identification
- Learning progress charts
- Study time tracking
- Exam predictions

### Teacher Analytics
- Student enrollment trends
- Course performance metrics
- Student success rates
- Engagement analytics

### Admin Analytics
- Platform revenue
- User acquisition
- Course popularity
- Teacher performance
- Traffic patterns

## 🌍 Localization

- **Language** - English (with Amharic ready)
- **Curriculum** - Ethiopian grades 9-12
- **Subjects** - 9 core subjects
- **Cultural context** - Built for Ethiopian education

## 🔄 Integration Ready

The platform is prepared for:
- **Payment Gateway** - Stripe, Chapa integration
- **Video Hosting** - YouTube, Vimeo, AWS
- **Email Service** - SendGrid, AWS SES
- **Analytics** - Google Analytics, Mixpanel
- **Video Conferencing** - Zoom, Google Meet

## 📝 License

MIT License - Built for Ethiopian Education

## 🤝 Contributing

Contributions are welcome! This platform aims to improve education accessibility in Ethiopia.

## 📞 Support

- **Email** - support@harmelearn.com
- **Website** - https://harmelearn.com
- **Forum** - Community discussion forum

## 🎓 Educational Philosophy

HarmeLearn is built on the belief that:
- **Quality education** should be accessible to all
- **Technology** can enhance, not replace, human teaching
- **Personalization** improves learning outcomes
- **Community** supports student success
- **Ethiopian students** deserve world-class resources

---

**Made with ❤️ for Ethiopian Secondary Education**

*Transforming learning. Empowering students. Building futures.*
