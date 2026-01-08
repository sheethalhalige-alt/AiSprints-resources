# QuizMaker Application - Setup & Installation Guide

This guide will help you set up and run the QuizMaker application locally.

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Git (for cloning the repository)

## Installation Steps

### 1. Install Dependencies

First, install all required npm packages:

```bash
npm install
```

This will install:
- Next.js 15.4.6
- Cloudflare Workers integration (@opennextjs/cloudflare)
- Authentication libraries (bcryptjs, jsonwebtoken)
- UI components (shadcn/ui with Radix UI)
- Tailwind CSS 4

### 2. Database Setup

The application uses Cloudflare D1 (SQLite) for data persistence. Apply the database migration:

```bash
# Apply migration to local database
npx wrangler d1 migrations apply quizmaker-app-database --local
```

This will create the following tables:
- `users` - User accounts (students and instructors)
- `questions` - Quiz questions created by instructors
- `options` - Multiple choice options (4 or 6 per question)
- `quiz_attempts` - Student quiz attempts with scores

### 3. Environment Configuration

The `.dev.vars` file contains environment variables for local development. The JWT_SECRET is already configured:

```
NEXTJS_ENV=development
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-123456789
```

**Important:** Change the `JWT_SECRET` to a strong, random value before deploying to production!

### 4. Run the Development Server

Start the Next.js development server with Turbopack:

```bash
npm run dev
```

The application will be available at:
- **Local:** http://localhost:3000
- **Network:** http://[your-ip]:3000

## Application Structure

```
quizmaker-app/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── api/                      # API Routes
│   │   │   ├── auth/                 # Authentication endpoints
│   │   │   ├── questions/            # Question CRUD endpoints
│   │   │   └── quiz/                 # Quiz taking endpoints
│   │   ├── instructor/               # Instructor pages
│   │   │   ├── dashboard/            # Question management
│   │   │   └── questions/            # Create/edit questions
│   │   ├── student/                  # Student pages
│   │   │   ├── quiz/                 # Take quizzes
│   │   │   ├── attempts/             # View attempt history
│   │   │   └── statistics/           # Performance stats
│   │   ├── login/                    # Login page
│   │   ├── signup/                   # Registration page
│   │   └── page.tsx                  # Home page
│   ├── components/                   # React components
│   │   └── ui/                       # shadcn/ui components
│   ├── lib/                          # Shared libraries
│   │   ├── services/                 # Business logic
│   │   │   ├── auth-service.ts       # Authentication
│   │   │   ├── question-service.ts   # Question CRUD
│   │   │   └── quiz-service.ts       # Quiz attempts
│   │   ├── d1-client.ts              # Database client
│   │   └── utils.ts                  # Utility functions
│   └── middleware.ts                 # Authentication middleware
├── migrations/                        # Database migrations
│   └── 0001_create_initial_schema.sql
├── docs/                             # Documentation
│   ├── TECHNICAL_PRD.md              # Product requirements
│   ├── BASIC_AUTHENTICATION.md       # Auth documentation
│   └── MCQ_CRUD.md                   # Question management docs
└── wrangler.jsonc                    # Cloudflare configuration
```

## Using the Application

### For First-Time Users

1. Navigate to http://localhost:3000
2. Click "Sign Up" to create an account
3. Choose your role:
   - **Student:** Take quizzes and track performance
   - **Instructor:** Create and manage questions

### As an Instructor

1. **Create Questions:**
   - Go to Instructor Dashboard
   - Click "Create Question"
   - Enter question text (10-1000 characters)
   - Choose category and difficulty
   - Add 4 or 6 answer options
   - Mark one as correct
   - Submit

2. **Manage Questions:**
   - View all your questions in the dashboard
   - Edit or delete existing questions
   - View question statistics and performance

### As a Student

1. **Take Quizzes:**
   - Go to Student Quiz page
   - A random question will be displayed
   - Select your answer
   - Submit to see if you're correct
   - Click "Next Question" to continue

2. **Track Performance:**
   - View "My Attempts" to see all past quiz attempts
   - Check "Statistics" for overall performance metrics
   - See success rates by category

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login and get JWT token
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user info

### Questions (Instructor Only)
- `POST /api/questions/create` - Create new question
- `GET /api/questions` - List all questions (paginated)
- `GET /api/questions/[id]` - Get question details
- `PUT /api/questions/[id]` - Update question
- `DELETE /api/questions/[id]` - Delete question
- `GET /api/questions/[id]/statistics` - View question stats

### Quiz Taking (Student)
- `GET /api/quiz/random` - Get random question
- `POST /api/quiz/submit` - Submit answer
- `GET /api/quiz/attempts` - Get attempt history
- `GET /api/quiz/attempts/[id]` - Get attempt details
- `GET /api/quiz/statistics` - Get student statistics
- `GET /api/quiz/leaderboard` - View top students

## Database Schema

### Users Table
- `id` - Unique user identifier
- `name` - User's full name
- `email` - Unique email (used for login)
- `password` - Bcrypt hashed password
- `role` - 'student' or 'instructor'
- `created_at` - Account creation timestamp

### Questions Table
- `id` - Unique question identifier
- `instructor_id` - Creator's user ID
- `question_text` - The question (10-1000 chars)
- `category` - Optional category/subject
- `difficulty` - 'easy', 'medium', or 'hard'
- `points` - Points awarded for correct answer
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

### Options Table
- `id` - Unique option identifier
- `question_id` - Parent question ID
- `option_text` - The option text
- `is_correct` - Boolean (1 = correct, 0 = incorrect)
- `option_order` - Display order (1-6)

### Quiz Attempts Table
- `id` - Unique attempt identifier
- `student_id` - User ID of student
- `question_id` - Question attempted
- `selected_option_id` - Option chosen by student
- `is_correct` - Boolean result
- `score` - Points earned
- `time_taken_seconds` - Time to answer
- `attempt_date` - Timestamp of attempt

## Security Features

- **Password Hashing:** bcrypt with 10 salt rounds
- **JWT Authentication:** 24-hour token expiration
- **HTTP-Only Cookies:** Prevents XSS attacks
- **Role-Based Access Control:** Separate permissions for students/instructors
- **SQL Injection Prevention:** Parameterized queries with normalized placeholders
- **Middleware Protection:** All routes authenticated except public pages

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Run production server locally
npm run start

# Lint code
npm run lint

# Generate Cloudflare types
npm run cf-typegen

# Deploy to Cloudflare Workers
npm run deploy

# Preview deployment
npm run preview
```

## Deployment to Production

### 1. Set Production Secrets

Set the JWT secret as a Cloudflare Workers secret:

```bash
npx wrangler secret put JWT_SECRET
```

When prompted, enter a strong, random secret key (NOT the one in .dev.vars!).

### 2. Deploy the Application

```bash
npm run deploy
```

This will:
1. Build the Next.js application
2. Package it for Cloudflare Workers
3. Deploy to your Cloudflare account

### 3. Apply Database Migration (Production)

**IMPORTANT:** The workspace rules specify that you should NOT apply migrations to remote databases automatically. Coordinate with your team before running:

```bash
npx wrangler d1 migrations apply quizmaker-app-database --remote
```

## Troubleshooting

### "Failed to get database context"
- Make sure you're running with `npm run dev` (not just `next dev`)
- Check that wrangler.jsonc has the correct D1 binding

### "Not authenticated" errors
- Check that JWT_SECRET is set in .dev.vars
- Clear your browser cookies and log in again
- Verify middleware.ts is not blocking routes incorrectly

### Migration fails
- Ensure the migrations/ folder exists
- Check that wrangler.jsonc has the correct database_id
- Try deleting .wrangler/state/ folder and reapplying

### TypeScript errors
- Run `npm run cf-typegen` to regenerate Cloudflare types
- Restart your TypeScript server in VS Code

## Testing

To test the application:

1. **Create test users:**
   - Sign up as an instructor
   - Sign up as a student

2. **As instructor:**
   - Create several questions with different difficulties
   - Try editing and deleting questions

3. **As student:**
   - Take multiple quizzes
   - Check your attempt history
   - View your statistics

4. **Test authentication:**
   - Try accessing instructor pages as a student (should redirect)
   - Try accessing student pages as an instructor (should redirect)
   - Log out and verify you're redirected to login

## Next Steps

- Review the [Technical PRD](docs/TECHNICAL_PRD.md) for full feature specifications
- Read the [Authentication Documentation](docs/BASIC_AUTHENTICATION.md) for auth implementation details
- Check the [MCQ Management Guide](docs/MCQ_CRUD.md) for question CRUD operations

## Support

For issues or questions:
1. Check the documentation in the `docs/` folder
2. Review the API endpoint documentation above
3. Inspect browser console and server logs for errors

## License

This project is part of the QuizMaker application. All rights reserved.

