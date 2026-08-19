# 📚 HarmeLearn Academy - API Documentation

Complete RESTful API documentation for HarmeLearn Academy platform.

## Base URL

```
Production: https://api.harmelearn.com
Development: http://localhost:3000/api
```

## Authentication

All authenticated endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <JWT_TOKEN>
```

### Get JWT Token

**Request:**
```
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200 OK):**
```json
{
  "message": "Login successful",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "firstName": "Abebe",
    "lastName": "Kebede",
    "role": "student",
    "avatar": null
  },
  "sessionToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

## Error Responses

All errors follow this format:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "status": 400
}
```

### Error Codes
- `INVALID_EMAIL` - Email format invalid
- `EMAIL_TAKEN` - Email already registered
- `WEAK_PASSWORD` - Password doesn't meet requirements
- `INVALID_CREDENTIALS` - Wrong email/password
- `UNAUTHORIZED` - No valid token
- `FORBIDDEN` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `VALIDATION_ERROR` - Invalid input data

## API Endpoints

### Authentication Endpoints

#### Register User

**Request:**
```
POST /auth/register
Content-Type: application/json

{
  "firstName": "Abebe",
  "lastName": "Kebede",
  "email": "abebe@example.com",
  "password": "SecurePass123",
  "role": "student",
  "grade": "12"
}
```

**Response (201 Created):**
```json
{
  "message": "Registration successful",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "abebe@example.com",
    "firstName": "Abebe",
    "lastName": "Kebede",
    "role": "student"
  }
}
```

**Validation Rules:**
- `firstName`: Required, 2-50 characters
- `lastName`: Required, 2-50 characters
- `email`: Valid email format, unique
- `password`: Min 8 chars, uppercase, lowercase, number
- `role`: One of: student, teacher, school_admin, super_admin
- `grade`: If student, one of: 9, 10, 11, 12

---

### Course Endpoints

#### Get All Courses

**Request:**
```
GET /courses?grade=12&limit=20&offset=0
```

**Query Parameters:**
- `grade`: Filter by grade (9, 10, 11, 12)
- `subjectId`: Filter by subject ID
- `limit`: Number of results (default: 20, max: 100)
- `offset`: Pagination offset (default: 0)
- `search`: Search by title/description

**Response (200 OK):**
```json
{
  "courses": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Mathematics Grade 12",
      "description": "Advanced mathematics for Grade 12",
      "slug": "mathematics-grade-12-1234567890",
      "grade": "12",
      "subjectId": "650e8400-e29b-41d4-a716-446655440001",
      "teacherId": "750e8400-e29b-41d4-a716-446655440002",
      "thumbnail": "https://cdn.example.com/math.jpg",
      "price": "0",
      "isFree": true,
      "totalLessons": 20,
      "totalStudents": 45,
      "rating": "4.8",
      "isPublished": true,
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-20T15:45:00Z"
    }
  ],
  "total": 125
}
```

---

#### Create Course (Teacher Only)

**Request:**
```
POST /courses
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "title": "Physics Grade 12",
  "description": "Complete physics curriculum for Grade 12",
  "subjectId": "550e8400-e29b-41d4-a716-446655440000",
  "grade": "12",
  "price": "0",
  "isFree": true
}
```

**Required Role:** teacher

**Response (201 Created):**
```json
{
  "message": "Course created successfully",
  "course": {
    "id": "850e8400-e29b-41d4-a716-446655440003",
    "title": "Physics Grade 12",
    "slug": "physics-grade-12-1234567890",
    "grade": "12",
    "subjectId": "550e8400-e29b-41d4-a716-446655440000",
    "teacherId": "750e8400-e29b-41d4-a716-446655440002",
    "isFree": true,
    "isPublished": false,
    "totalLessons": 0,
    "totalStudents": 0
  }
}
```

---

### Subject Endpoints

#### Get All Subjects

**Request:**
```
GET /subjects
```

**Response (200 OK):**
```json
{
  "subjects": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Mathematics",
      "code": "MATH",
      "description": "Mathematics for all grades",
      "icon": "🔢",
      "color": "#3b82f6",
      "gradeFrom": "9",
      "gradeTo": "12",
      "createdAt": "2024-01-10T10:00:00Z"
    }
  ],
  "total": 9
}
```

---

### Unit/Chapter Endpoints

#### Get Course Units

**Request:**
```
GET /courses/{courseId}/units
```

**Parameters:**
- `courseId`: UUID of the course

**Response (200 OK):**
```json
{
  "units": [
    {
      "id": "950e8400-e29b-41d4-a716-446655440004",
      "courseId": "850e8400-e29b-41d4-a716-446655440003",
      "title": "Unit 1: Mechanics",
      "description": "Introduction to mechanics",
      "orderIndex": 1,
      "totalLessons": 5,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 5
}
```

---

#### Create Unit

**Request:**
```
POST /courses/{courseId}/units
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "title": "Unit 1: Kinematics",
  "description": "Motion and displacement",
  "orderIndex": 1
}
```

**Required Role:** teacher (must own course)

**Response (201 Created):**
```json
{
  "message": "Unit created successfully",
  "unit": {
    "id": "950e8400-e29b-41d4-a716-446655440004",
    "courseId": "850e8400-e29b-41d4-a716-446655440003",
    "title": "Unit 1: Kinematics",
    "orderIndex": 1,
    "totalLessons": 0
  }
}
```

---

### Lesson Endpoints

#### Get Unit Lessons

**Request:**
```
GET /units/{unitId}/lessons
```

**Response (200 OK):**
```json
{
  "lessons": [
    {
      "id": "a50e8400-e29b-41d4-a716-446655440005",
      "unitId": "950e8400-e29b-41d4-a716-446655440004",
      "title": "Lesson 1: Position and Distance",
      "description": "Understanding position vectors",
      "content": "<p>Lesson content...</p>",
      "orderIndex": 1,
      "durationMinutes": 45,
      "isPublished": true,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 5
}
```

---

#### Create Lesson

**Request:**
```
POST /units/{unitId}/lessons
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "title": "Lesson 1: Velocity",
  "description": "Understanding velocity",
  "content": "<p>Lesson HTML content</p>",
  "orderIndex": 1,
  "durationMinutes": 50
}
```

**Required Role:** teacher

**Response (201 Created):**
```json
{
  "message": "Lesson created successfully",
  "lesson": {
    "id": "a50e8400-e29b-41d4-a716-446655440005",
    "unitId": "950e8400-e29b-41d4-a716-446655440004",
    "title": "Lesson 1: Velocity",
    "orderIndex": 1,
    "durationMinutes": 50,
    "isPublished": true
  }
}
```

---

### Quiz Endpoints

#### Create Quiz

**Request:**
```
POST /lessons/{lessonId}/quizzes
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "title": "Chapter 1 Quiz",
  "description": "Test your understanding",
  "totalQuestions": 10,
  "passingScore": 70,
  "timeLimit": 20
}
```

**Response (201 Created):**
```json
{
  "message": "Quiz created successfully",
  "quiz": {
    "id": "b50e8400-e29b-41d4-a716-446655440006",
    "lessonId": "a50e8400-e29b-41d4-a716-446655440005",
    "title": "Chapter 1 Quiz",
    "totalQuestions": 10,
    "passingScore": 70,
    "timeLimit": 20
  }
}
```

---

### Assignment Endpoints

#### Create Assignment

**Request:**
```
POST /lessons/{lessonId}/assignments
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "title": "Chapter 1 Problems",
  "description": "Solve problems 1-10",
  "dueDate": "2024-02-15T23:59:00Z",
  "totalPoints": 100
}
```

**Response (201 Created):**
```json
{
  "message": "Assignment created successfully",
  "assignment": {
    "id": "c50e8400-e29b-41d4-a716-446655440007",
    "lessonId": "a50e8400-e29b-41d4-a716-446655440005",
    "title": "Chapter 1 Problems",
    "dueDate": "2024-02-15T23:59:00Z",
    "totalPoints": 100
  }
}
```

---

### Student Progress Endpoints

#### Get Student Dashboard

**Request:**
```
GET /dashboard/student
Authorization: Bearer <JWT_TOKEN>
```

**Response (200 OK):**
```json
{
  "enrollments": [
    {
      "courseId": "850e8400-e29b-41d4-a716-446655440003",
      "courseName": "Physics Grade 12",
      "progressPercentage": 65,
      "totalLessons": 20,
      "completedLessons": 13,
      "lastAccessedAt": "2024-01-20T15:30:00Z"
    }
  ],
  "upcomingAssignments": [
    {
      "id": "c50e8400-e29b-41d4-a716-446655440007",
      "title": "Chapter 1 Problems",
      "course": "Physics Grade 12",
      "dueDate": "2024-02-15T23:59:00Z"
    }
  ],
  "analytics": {
    "totalCoursesEnrolled": 5,
    "totalLessonsCompleted": 45,
    "learningStreak": 12,
    "averageScore": 82.5
  }
}
```

---

### Exam Endpoints

#### Create Exam

**Request:**
```
POST /courses/{courseId}/exams
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "title": "Final Exam - Physics Grade 12",
  "description": "Comprehensive final exam",
  "totalQuestions": 50,
  "passingScore": 60,
  "timeLimit": 120,
  "examDate": "2024-03-15T10:00:00Z"
}
```

**Response (201 Created):**
```json
{
  "message": "Exam created successfully",
  "exam": {
    "id": "d50e8400-e29b-41d4-a716-446655440008",
    "courseId": "850e8400-e29b-41d4-a716-446655440003",
    "title": "Final Exam - Physics Grade 12",
    "totalQuestions": 50,
    "passingScore": 60,
    "timeLimit": 120
  }
}
```

---

#### Submit Exam

**Request:**
```
POST /exams/{examId}/submit
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "answers": [
    {
      "questionId": "e50e8400-e29b-41d4-a716-446655440009",
      "answer": "A"
    },
    {
      "questionId": "e50e8400-e29b-41d4-a716-446655440010",
      "answer": "B"
    }
  ],
  "timeTaken": 95
}
```

**Response (200 OK):**
```json
{
  "message": "Exam submitted successfully",
  "result": {
    "attemptId": "f50e8400-e29b-41d4-a716-446655440011",
    "score": 42,
    "totalPoints": 50,
    "percentage": 84,
    "passed": true,
    "submittedAt": "2024-03-15T11:35:00Z"
  }
}
```

---

## Rate Limiting

- **Unauthenticated requests**: 60 requests per minute
- **Authenticated requests**: 300 requests per minute
- **Upload endpoints**: 10 requests per minute

**Rate limit headers:**
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1705857960
```

---

## Pagination

List endpoints support pagination with:
- `limit`: Results per page (default: 20, max: 100)
- `offset`: Number of results to skip (default: 0)

**Example:**
```
GET /courses?limit=10&offset=20
```

---

## Filtering

Supported filters vary by endpoint:
- `grade`: For course-related queries
- `subjectId`: For subject filtering
- `search`: Full-text search
- `status`: For status filtering (published/draft)

---

## Data Types

### User Object
```json
{
  "id": "uuid",
  "email": "string",
  "firstName": "string",
  "lastName": "string",
  "role": "student|teacher|school_admin|super_admin",
  "avatar": "string|null",
  "isActive": "boolean",
  "createdAt": "ISO 8601",
  "updatedAt": "ISO 8601"
}
```

### Course Object
```json
{
  "id": "uuid",
  "title": "string",
  "slug": "string",
  "description": "string|null",
  "grade": "9|10|11|12",
  "subjectId": "uuid",
  "teacherId": "uuid",
  "price": "decimal",
  "isFree": "boolean",
  "totalLessons": "integer",
  "totalStudents": "integer",
  "rating": "decimal",
  "isPublished": "boolean",
  "createdAt": "ISO 8601",
  "updatedAt": "ISO 8601"
}
```

---

## Testing API

### Using cURL

```bash
# Register
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

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123"
  }'

# Get courses
curl http://localhost:3000/api/courses?grade=12
```

### Using Postman

1. Import the Postman collection
2. Set base URL: `http://localhost:3000/api`
3. Set token in Authorization header
4. Start testing endpoints

---

## API Status & Health

**Check API health:**
```
GET /api/health

Response:
{
  "status": "healthy",
  "database": "connected",
  "uptime": 1234567
}
```

---

## Changelog

### v1.0.0 (Current)
- Initial API release
- Auth endpoints
- Course management
- Lesson creation
- Quiz and exam support

---

## Support

For API support:
- Documentation: https://docs.harmelearn.com
- Email: api-support@harmelearn.com
- Community: https://forum.harmelearn.com
