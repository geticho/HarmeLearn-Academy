# 🚀 HarmeLearn Academy - Quick Start Guide

Get started with HarmeLearn Academy in minutes!

## Prerequisites

- Node.js 18 or higher
- npm or yarn
- PostgreSQL 12 or higher
- Git

## Installation (5 minutes)

### 1. Clone the Repository

```bash
git clone https://github.com/harmelearn/platform.git
cd platform
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Environment

```bash
cp .env.example .env
```

Edit `.env` and set your database URL:

```
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5432/harmelearn"
```

### 4. Initialize Database

```bash
npx drizzle-kit push
```

### 5. Start Development Server

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

---

## 📚 First Steps

### Try as a Student
1. Go to http://localhost:3000
2. Click "Sign Up"
3. Create account with role "Student" and Grade "12"
4. Login and explore the dashboard
5. Browse available courses

### Try as a Teacher
1. Click "Sign Up"
2. Select role "Teacher"
3. Login to teacher dashboard
4. Create your first course
5. Add units and lessons

### Try as Admin
1. Manually set user role to "super_admin" in database
2. Login and visit http://localhost:3000/admin
3. Manage users, courses, and platform

---

## 📖 Available Test Accounts

Create test accounts with:

**Student Account:**
```
Email: student@example.com
Password: Student123
Grade: 12
```

**Teacher Account:**
```
Email: teacher@example.com
Password: Teacher123
Specialization: Mathematics
```

---

## 🔧 Common Commands

```bash
# Development
npm run dev                    # Start dev server on :3000

# Building
npm run build                  # Build for production
npm start                      # Start production server

# Type Checking
npm exec tsc -- --noEmit      # Check TypeScript

# Linting
npm run lint                   # Run ESLint

# Database
npx drizzle-kit push          # Apply schema changes
npx drizzle-kit generate      # Generate migrations
```

---

## 🌍 Key URLs

### Public Pages
- Home: http://localhost:3000
- About: http://localhost:3000/about
- Contact: http://localhost:3000/contact
- Courses: http://localhost:3000/courses

### Authentication
- Login: http://localhost:3000/login
- Sign Up: http://localhost:3000/signup

### Dashboards
- Student Dashboard: http://localhost:3000/dashboard/student
- Teacher Dashboard: http://localhost:3000/dashboard/teacher
- Admin Dashboard: http://localhost:3000/admin
- Admin Courses: http://localhost:3000/admin/courses

### API
- Health Check: http://localhost:3000/api/health

---

## 📡 API Quick Reference

### Authentication

**Register User:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Abebe",
    "lastName": "Kebede",
    "email": "test@example.com",
    "password": "TestPass123",
    "role": "student",
    "grade": "12"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123"
  }'
```

### Courses

**Get All Courses:**
```bash
curl "http://localhost:3000/api/courses?grade=12&limit=10"
```

**Create Course:**
```bash
curl -X POST http://localhost:3000/api/courses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "Advanced Mathematics",
    "description": "Grade 12 Mathematics",
    "subjectId": "550e8400-e29b-41d4-a716-446655440000",
    "grade": "12",
    "isFree": true
  }'
```

### Subjects

**Get All Subjects:**
```bash
curl http://localhost:3000/api/subjects
```

### Health Check

**Check API Health:**
```bash
curl http://localhost:3000/api/health
```

---

## 🎨 Customization

### Branding
Edit `src/app/page.tsx` to customize:
- Logo and branding
- Colors (modify in globals.css)
- Hero section content
- Features list

### Features
Enable/disable in `.env`:
```
ENABLE_LIVE_CLASSES=true
ENABLE_AI_TUTOR=true
ENABLE_PAYMENTS=true
```

### Database
Modify schema in `src/db/schema.ts` and run:
```bash
npx drizzle-kit push
```

---

## 🐛 Troubleshooting

### Database Connection Error
```
Error: Connection refused
```
- Check PostgreSQL is running
- Verify DATABASE_URL in .env
- Ensure database exists

### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::3000
```
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### TypeScript Errors
```bash
# Clear Next.js cache
rm -rf .next

# Regenerate types
npx next typegen

# Check types
npm exec tsc -- --noEmit
```

### Build Failures
```bash
# Clean and rebuild
rm -rf node_modules .next
npm install
npm run build
```

---

## 📚 Documentation

After getting started, explore:

- **[README.md](README.md)** - Complete project overview
- **[API.md](API.md)** - Detailed API documentation
- **[DATABASE.md](DATABASE.md)** - Database schema reference
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Production deployment guide
- **[CONTRIBUTING.md](CONTRIBUTING.md)** - Development guidelines
- **[PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)** - Project statistics

---

## 🚀 Next Steps

### 1. Explore the Platform
- Browse all pages and features
- Test user flows (signup → course enrollment → quiz)
- Try admin features

### 2. Customize for Your Needs
- Add your school information
- Customize colors and branding
- Configure payment processors
- Set up email notifications

### 3. Add Content
- Create subjects and courses
- Upload videos and PDFs
- Create lessons and quizzes
- Build your curriculum

### 4. Deploy to Production
- Choose hosting platform (Vercel, AWS, Docker)
- Configure production environment
- Set up database backups
- Enable monitoring

---

## 💡 Pro Tips

1. **Use Postman** - Import API endpoints and test them
2. **Browser DevTools** - Check network tab for API calls
3. **Database GUI** - Use pgAdmin for database management
4. **Logs** - Check browser console for client-side errors
5. **Environment** - Create .env.local for local overrides

---

## 🔗 Useful Resources

- **Next.js**: https://nextjs.org/docs
- **React**: https://react.dev
- **Drizzle ORM**: https://orm.drizzle.team
- **Tailwind CSS**: https://tailwindcss.com
- **PostgreSQL**: https://www.postgresql.org/docs
- **TypeScript**: https://www.typescriptlang.org/docs

---

## 📞 Need Help?

### Support Channels
- 📧 Email: dev@harmelearn.com
- 💬 GitHub Issues: https://github.com/harmelearn/platform/issues
- 📚 Documentation: https://docs.harmelearn.com
- 👥 Community Forum: https://forum.harmelearn.com

### Report Issues
When reporting issues, include:
- Steps to reproduce
- Expected vs actual behavior
- Error messages/logs
- Environment details (Node version, OS, etc.)

---

## ✅ Verification Checklist

After installation, verify everything works:

- [ ] `npm install` completes successfully
- [ ] `npx drizzle-kit push` succeeds
- [ ] `npm run dev` starts without errors
- [ ] http://localhost:3000 loads
- [ ] Can signup and create account
- [ ] Can login with test account
- [ ] Dashboard loads with data
- [ ] API endpoints respond
- [ ] `npm run build` succeeds
- [ ] No TypeScript errors

---

## 🎉 You're Ready!

Congratulations! HarmeLearn Academy is now running on your machine.

**What's next?**
1. Explore the full documentation
2. Create your first course
3. Customize the platform
4. Deploy to production

**Happy learning! 🚀**

---

**Version:** 1.0.0  
**Last Updated:** 2024  
**Built with ❤️ for Ethiopian Education**
