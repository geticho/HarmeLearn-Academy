# 🚀 Contributing to HarmeLearn Academy

Thank you for your interest in contributing to HarmeLearn Academy! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on the code, not the person
- Help others learn and grow

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 12+
- Git
- GitHub account

### Setup Development Environment

```bash
# Clone the repository
git clone https://github.com/harmelearn/platform.git
cd platform

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Configure .env with your local database
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5432/harmelearn_dev"

# Initialize database
npx drizzle-kit push

# Start development server
npm run dev

# Open http://localhost:3000
```

## Development Workflow

### 1. Create a Feature Branch

```bash
git checkout -b feature/description-of-feature
# or
git checkout -b fix/description-of-fix
git checkout -b docs/description-of-docs
```

**Branch naming conventions:**
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Adding tests

### 2. Make Your Changes

Follow the coding standards and best practices outlined below.

### 3. Test Your Changes

```bash
# Run TypeScript compiler
npm exec tsc -- --noEmit

# Run linting
npm run lint

# Build the project
npm run build

# Start in production mode to test
npm start
```

### 4. Commit Your Changes

```bash
git add .
git commit -m "feat: add new feature description"
git commit -m "fix: resolve issue with component"
git commit -m "docs: update README with examples"
```

**Commit message conventions:**
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `style:` - Code style changes
- `refactor:` - Code refactoring
- `test:` - Test additions
- `chore:` - Maintenance tasks

### 5. Push and Create Pull Request

```bash
git push origin feature/your-feature
```

Then create a Pull Request on GitHub with:
- Clear title
- Description of changes
- Related issues (if any)
- Screenshots (if UI changes)

## Coding Standards

### TypeScript

```typescript
// Use explicit types
const user: User = {
  id: "123",
  name: "Abebe"
};

// Avoid `any` type
// ❌ Wrong
const data: any = response.data;

// ✅ Correct
interface UserData {
  id: string;
  name: string;
}
const data: UserData = response.data;
```

### React Components

```typescript
// Use functional components
interface UserCardProps {
  userId: string;
  onSelect?: (id: string) => void;
}

export function UserCard({ userId, onSelect }: UserCardProps) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    fetchUser(userId).then(setUser);
  }, [userId]);

  return (
    <div className="card">
      {user && <h3>{user.name}</h3>}
    </div>
  );
}
```

### API Routes

```typescript
// Use proper HTTP methods and status codes
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Validate input
    if (!id) {
      return NextResponse.json(
        { error: "ID required" },
        { status: 400 }
      );
    }

    // Query database
    const data = await db.select().from(table).where(eq(table.id, id));
    
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

### Database Queries

```typescript
// Use Drizzle ORM
import { db } from "@/db";
import { users, courses } from "@/db/schema";
import { eq, and } from "drizzle-orm";

// Single query
const user = await db
  .select()
  .from(users)
  .where(eq(users.id, userId))
  .limit(1);

// Complex query with joins
const data = await db
  .select()
  .from(courses)
  .where(and(
    eq(courses.grade, "12"),
    eq(courses.isPublished, true)
  ))
  .limit(10);
```

### Styling

```typescript
// Use Tailwind CSS classes
export function Button() {
  return (
    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold">
      Click me
    </button>
  );
}

// For complex styles, use CSS modules
// ✅ Recommended approach
import styles from "./component.module.css";

export function Component() {
  return <div className={styles.container}>Content</div>;
}
```

## File Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   ├── courses/
│   │   └── [resource]/
│   ├── dashboard/
│   ├── admin/
│   ├── [public-pages]/
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── common/
│   ├── dashboard/
│   └── forms/
├── db/
│   ├── schema.ts
│   └── index.ts
├── lib/
│   ├── auth.ts
│   ├── utils.ts
│   └── validators.ts
└── types/
    └── index.ts
```

## Testing

### Unit Tests

```typescript
// Example test file: src/lib/__tests__/auth.test.ts
import { hashPassword, verifyPassword } from "@/lib/auth";

describe("Password utilities", () => {
  it("should hash password correctly", () => {
    const password = "TestPass123";
    const hash = hashPassword(password);
    expect(hash).not.toBe(password);
  });

  it("should verify correct password", () => {
    const password = "TestPass123";
    const hash = hashPassword(password);
    expect(verifyPassword(password, hash)).toBe(true);
  });

  it("should reject incorrect password", () => {
    const password = "TestPass123";
    const hash = hashPassword(password);
    expect(verifyPassword("WrongPass123", hash)).toBe(false);
  });
});
```

### Integration Tests

```typescript
// Example: Testing API endpoints
describe("POST /api/auth/register", () => {
  it("should register new user successfully", async () => {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "test@example.com",
        password: "TestPass123",
        firstName: "Test",
        lastName: "User",
      }),
    });

    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.user.email).toBe("test@example.com");
  });
});
```

## Documentation

### Adding Documentation

1. Update README.md for significant changes
2. Add inline code comments for complex logic
3. Update API.md for new endpoints
4. Create JSDoc comments for functions

```typescript
/**
 * Hash a password using PBKDF2 algorithm
 * @param password - The plain text password
 * @returns Hashed password with salt
 * @example
 * const hash = hashPassword("myPassword123");
 */
export function hashPassword(password: string): string {
  // Implementation
}
```

## Security Guidelines

1. **Never commit secrets** - Use environment variables
2. **Validate inputs** - Always validate user input
3. **Sanitize outputs** - Prevent XSS attacks
4. **Use parameterized queries** - Prevent SQL injection (Drizzle handles this)
5. **Implement rate limiting** - Protect API endpoints
6. **Use HTTPS only** - Secure data in transit

```typescript
// ❌ Wrong
const query = `SELECT * FROM users WHERE id = ${id}`;

// ✅ Correct (Drizzle ORM)
const user = await db
  .select()
  .from(users)
  .where(eq(users.id, id));
```

## Performance Guidelines

1. **Minimize database queries** - Use joins and batch operations
2. **Implement caching** - Cache frequently accessed data
3. **Lazy load components** - Use dynamic imports for heavy components
4. **Optimize images** - Use WebP format and proper sizing
5. **Code splitting** - Keep bundle size small

```typescript
// ❌ Wrong - Multiple queries
const user = await db.select().from(users).where(eq(users.id, id));
const courses = await db.select().from(courses).where(eq(courses.studentId, id));

// ✅ Correct - Use relations if available
// Or use a single optimized query
```

## Accessibility (a11y)

```typescript
// Always include alt text for images
<img src="course.jpg" alt="Mathematics course preview" />

// Use semantic HTML
<button onClick={onClick} aria-label="Open menu">☰</button>

// Ensure proper contrast and readable fonts
<p className="text-slate-900 text-base">Readable text</p>

// Support keyboard navigation
<input
  type="text"
  onKeyDown={(e) => {
    if (e.key === "Enter") handleSubmit();
  }}
/>
```

## Pull Request Process

1. **Self-review** - Review your own changes first
2. **Check tests** - Ensure all tests pass
3. **Update docs** - Document any new features
4. **Link issues** - Reference related GitHub issues
5. **Request review** - Ask maintainers for code review
6. **Respond to feedback** - Address reviewer comments
7. **Merge** - Maintainer will merge after approval

## Reporting Issues

### Bug Reports

Include:
- Clear description of the bug
- Steps to reproduce
- Expected behavior
- Actual behavior
- Screenshots/error logs
- Environment (OS, browser, Node version)

### Feature Requests

Include:
- Clear description of the feature
- Use cases and benefits
- Proposed implementation (if any)
- Alternative approaches

## Communication

- **GitHub Issues** - For bug reports and feature requests
- **GitHub Discussions** - For questions and ideas
- **Email** - dev@harmelearn.com for direct communication
- **Discord** - Join our community server

## Licensing

By contributing, you agree that your contributions will be licensed under the MIT License.

## Code Review Checklist

Before submitting a PR, ensure:

- [ ] Code follows project standards
- [ ] TypeScript compiles without errors
- [ ] All tests pass
- [ ] No console.log or debugger statements
- [ ] No commented-out code
- [ ] Proper error handling
- [ ] Updated documentation
- [ ] Commit messages are clear
- [ ] No breaking changes (or documented)

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [Drizzle ORM](https://orm.drizzle.team)
- [PostgreSQL Documentation](https://www.postgresql.org/docs)
- [Tailwind CSS](https://tailwindcss.com)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)

## Questions?

Feel free to reach out:
- GitHub Issues
- GitHub Discussions
- Email: dev@harmelearn.com

## Thank You!

Your contributions make HarmeLearn Academy better for students across Ethiopia. We appreciate your dedication to improving education technology!

---

**Happy coding! 🚀**
