# QuizMaker Project Overview

**Last Updated**: January 2026  
**Status**: ✅ Phase 2 Complete (Core Features Fully Implemented)

## Project Description

QuizMaker is a web-based quiz application that enables instructors to create and manage multiple-choice questions (MCQs) and allows students to take quizzes, with automated scoring and attempt tracking. The application supports role-based access control with two primary user roles: Students and Instructors.

**Key Features Implemented**:
- ✅ Full CRUD operations for quiz questions (4 or 6 option MCQs)
- ✅ JWT-based authentication with role-based access control
- ✅ Quiz taking with automatic grading and immediate feedback
- ✅ Comprehensive analytics (student performance, question statistics, leaderboard)
- ✅ Complete UI for both instructor and student workflows

## Technology Stack

### Core Framework & Platform

- **Next.js 15.4.6** - React framework with App Router
- **Cloudflare Workers** - Serverless deployment platform
- **@opennextjs/cloudflare** - Integration layer for deploying Next.js to Cloudflare Workers
- **React Server Components** - Server-side rendering for optimal performance

### Database

- **Cloudflare D1** - SQLite database for data persistence
  - Database Name: `quizmaker-app-database`
  - Database ID: `c3599ec7-e22f-4687-b1e4-e6277caeb45c`
  - Binding: `quizmaker_app_database`
  - Migration System: Wrangler migrations (1 migration applied)

### Styling & UI

- **Tailwind CSS 4** - Utility-first CSS framework for styling
- **shadcn/ui** - High-quality, accessible UI component library
- **Geist Fonts** - Modern typography (Geist Sans & Geist Mono)

### Authentication & Security

- **JWT** - Token-based authentication with edge-compatible crypto
- **Bcrypt** - Password hashing with proper salt rounds
- **HTTP-only Cookies** - Secure token storage preventing XSS attacks
- **Middleware** - Route protection and role-based access control

### Development Tools

- **TypeScript** - Type safety and enhanced development experience
- **Wrangler** - Cloudflare CLI tool for deployment and database management
- **ESLint** - Code linting and formatting
- **Vitest** - Testing framework (configured, tests to be written)

## Architecture

### Application Architecture

```
┌─────────────────────────────────────────┐
│         UI Layer (Pages)                │
│  - Instructor Dashboard                 │
│  - Question Management                  │
│  - Student Quiz Interface               │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│      API Layer (Route Handlers)         │
│  - /api/questions/*                     │
│  - /api/quiz/*                          │
│  - /api/auth/*                          │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│     Service Layer (Business Logic)      │
│  - QuestionService                      │
│  - QuizService                          │
│  - AuthService                          │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│    Database Client (D1 Client)          │
│  - executeQuery / executeMutation       │
│  - Parameter normalization              │
│  - Connection management                │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│      Cloudflare D1 (SQLite)             │
│  - Tables: users, questions, options,   │
│            quiz_attempts                │
└─────────────────────────────────────────┘
```

### Deployment Configuration

- **Platform**: Cloudflare Workers
- **Runtime**: Node.js compatibility enabled
- **Assets**: Static assets served via Cloudflare Workers
- **Observability**: Enabled for monitoring and debugging
- **Build Tool**: OpenNext.js for Cloudflare compatibility

### Database Schema

**Implemented Tables**:

1. **users** - Instructors and students with role-based access
   - Fields: id, name, email, password (hashed), role, created_at, updated_at
   - Indexes: email (unique)

2. **questions** - Quiz questions created by instructors
   - Fields: id, instructor_id, question_text, category, difficulty, points, created_at, updated_at
   - Foreign Keys: instructor_id → users(id) ON DELETE CASCADE
   - Indexes: instructor_id

3. **options** - Answer options for questions (4 or 6 per question)
   - Fields: id, question_id, option_text, is_correct, option_order
   - Foreign Keys: question_id → questions(id) ON DELETE CASCADE
   - Indexes: question_id
   - Constraint: Exactly one correct answer per question

4. **quiz_attempts** - Student quiz attempts with scoring
   - Fields: id, student_id, question_id, selected_option_id, is_correct, score, time_taken_seconds, attempt_date
   - Foreign Keys: student_id → users(id), question_id → questions(id), selected_option_id → options(id)
   - Indexes: student_id, question_id, attempt_date

### Database Migrations

- **Tool**: Wrangler migrations commands
- **Status**: ✅ Initial schema migration applied
- **Migration Files**: `/migrations/0001_create_initial_schema.sql`
- **Commands**:
  - Create: `wrangler d1 migrations create quizmaker-app-database <name>`
  - List: `npm run db:migrate:list`
  - Apply local: `npm run db:migrate:local`
  - **Note**: Remote migrations NOT applied per project rules

## Project Structure

```
quizmaker-app/
├── app/                           # DEPRECATED - old structure
├── src/                           # Current source directory
│   ├── app/                       # Next.js app directory (App Router)
│   │   ├── api/                   # API route handlers
│   │   │   ├── auth/              # Authentication endpoints
│   │   │   │   ├── signup/        # User registration
│   │   │   │   ├── login/         # User login
│   │   │   │   ├── logout/        # User logout
│   │   │   │   └── me/            # Get current user
│   │   │   ├── questions/         # Question management
│   │   │   │   ├── create/        # Create question
│   │   │   │   ├── [id]/          # Get/Update/Delete question
│   │   │   │   └── [id]/statistics/ # Question analytics
│   │   │   └── quiz/              # Quiz taking APIs
│   │   │       ├── random/        # Get random question
│   │   │       ├── submit/        # Submit answer
│   │   │       ├── attempts/      # View attempts
│   │   │       ├── statistics/    # Student performance
│   │   │       └── leaderboard/   # Top students
│   │   ├── instructor/            # Instructor pages
│   │   │   ├── dashboard/         # Instructor dashboard
│   │   │   └── questions/         # Question management UI
│   │   │       ├── new/           # Create question form
│   │   │       └── [id]/          # View/Edit question
│   │   ├── student/               # Student pages
│   │   │   ├── quiz/              # Quiz taking interface
│   │   │   ├── attempts/          # Attempt history
│   │   │   └── statistics/        # Performance dashboard
│   │   ├── login/                 # Login page
│   │   ├── signup/                # Registration page
│   │   ├── globals.css            # Global styles with Tailwind
│   │   ├── layout.tsx             # Root layout component
│   │   └── page.tsx               # Home page
│   ├── components/                # React components
│   │   └── ui/                    # shadcn/ui components
│   ├── lib/                       # Utility functions and services
│   │   ├── services/              # Business logic layer
│   │   │   ├── auth-service.ts    # Authentication service
│   │   │   ├── question-service.ts # Question CRUD service
│   │   │   └── quiz-service.ts    # Quiz taking service
│   │   ├── d1-client.ts           # Database client wrapper
│   │   ├── jwt-edge.ts            # JWT utilities (edge-compatible)
│   │   ├── crypto-edge.ts         # Crypto utilities (edge-compatible)
│   │   └── utils.ts               # General utilities
│   └── middleware.ts              # Next.js middleware (auth & routing)
├── migrations/                    # Database migrations
│   └── 0001_create_initial_schema.sql
├── docs/                          # Project documentation
│   ├── TECHNICAL_PRD.md           # Technical requirements
│   ├── MCQ_CRUD.md                # CRUD operations guide
│   ├── DEVELOPMENT.md             # Development guide
│   └── BASIC_AUTHENTICATION.md    # Auth implementation
├── public/                        # Static assets
├── .dev.vars                      # Local environment variables
├── wrangler.jsonc                 # Cloudflare Workers configuration
├── cloudflare-env.d.ts            # TypeScript definitions for Cloudflare
├── next.config.ts                 # Next.js configuration
├── open-next.config.ts            # OpenNext.js Cloudflare configuration
├── components.json                # shadcn/ui configuration
├── tsconfig.json                  # TypeScript configuration
├── tailwind.config.ts             # Tailwind CSS configuration
└── package.json                   # Dependencies and scripts
```

## Environment Configuration

### Local Development

- **Environment Variables**: Stored in `.dev.vars`
- **Current Variables**:
  - `NEXTJS_ENV=development`
  - `JWT_SECRET=<secret-key>` (JWT token signing)

### Cloudflare Environment

- **Configuration**: Managed via `wrangler.jsonc`
- **Database Binding**: `quizmaker_app_database` → `quizmaker-app-database`
- **Assets Binding**: `ASSETS` → `.open-next/assets`
- **Node.js Compatibility**: Enabled via `nodejs_compat` flag

### TypeScript Environment

- **Cloudflare Types**: Generated in `cloudflare-env.d.ts`
- **Update Command**: `wrangler types --env-interface CloudflareEnv ./cloudflare-env.d.ts`

### Development Modes

**Option 1: Full Development with D1 (Recommended)**
```bash
npm run dev
```
- ✅ Complete Cloudflare Workers environment
- ✅ Local D1 database access
- ✅ All features functional (auth, database, etc.)
- ⚠️ Requires rebuild on changes

**Option 2: Fast Development (UI Only)**
```bash
npm run dev:next
```
- ✅ Next.js Turbopack fast refresh
- ✅ Rapid UI iteration
- ❌ No database access
- ❌ No authentication functionality

## Available Scripts

### Development
- `npm run dev` - Start development with D1 database (port 8787)
- `npm run dev:next` - Fast Next.js development (no database, port 3000)
- `npm run build` - Build the application for production
- `npm run preview` - Build and preview locally with Cloudflare environment

### Database Management
- `npm run db:migrate:local` - Apply migrations to local D1 database
- `npm run db:migrate:list` - List all migrations and their status
- `wrangler d1 migrations create quizmaker-app-database <name>` - Create new migration

### Deployment & Tools
- `npm run deploy` - Build and deploy to Cloudflare Workers
- `npm run cf-typegen` - Generate Cloudflare TypeScript definitions
- `npm run lint` - Run ESLint code linting

### Testing
- `npm run test` - Run test suite with Vitest (when implemented)
- `npm run test:watch` - Run tests in watch mode (when implemented)

## Implemented Features (Phase 1 & 2 Complete)

### ✅ Authentication & Authorization (Phase 1)
1. **User Registration & Login**
   - JWT-based authentication with edge-compatible crypto
   - Bcrypt password hashing with proper salt rounds
   - HTTP-only cookie token storage (prevents XSS)
   - Role-based user creation (student/instructor)
   - Email validation and uniqueness checks
   - Implementation: `src/lib/services/auth-service.ts`

2. **Middleware Protection**
   - Automatic route protection based on authentication
   - Role-based access control (instructor vs student routes)
   - Token verification with JWT expiration (24 hours)
   - Automatic redirection for unauthorized access
   - Implementation: `src/middleware.ts`

3. **API Endpoints**
   - `POST /api/auth/signup` - User registration
   - `POST /api/auth/login` - User authentication
   - `POST /api/auth/logout` - Session termination
   - `GET /api/auth/me` - Get current user info

### ✅ Question Management (Phase 2 - Instructor)
1. **Create Questions**
   - Support for 4 or 6 option MCQs
   - Question validation (10-1000 characters)
   - Difficulty levels (easy, medium, hard)
   - Optional categorization
   - Points/scoring configuration
   - Batch option insertion
   - Implementation: `src/lib/services/question-service.ts` (createQuestion)

2. **Read/List Questions**
   - Paginated question list (20 per page)
   - Full-text search on question text
   - Filter by category and difficulty
   - Ownership-based access
   - Option count display
   - Implementation: `src/lib/services/question-service.ts` (listQuestions, getQuestionById)

3. **Update Questions**
   - Partial updates supported
   - Ownership verification
   - Full question and options update
   - Validation on all fields
   - Maintains data integrity
   - Implementation: `src/lib/services/question-service.ts` (updateQuestion)

4. **Delete Questions**
   - Soft delete with attempt check (default)
   - Force delete option (?force=true)
   - Cascade deletion of options and attempts
   - Ownership verification
   - Implementation: `src/lib/services/question-service.ts` (deleteQuestion)

5. **API Endpoints**
   - `POST /api/questions/create` - Create question
   - `GET /api/questions` - List questions (paginated, searchable)
   - `GET /api/questions/[id]` - Get question details
   - `PUT /api/questions/[id]` - Update question
   - `DELETE /api/questions/[id]` - Delete question
   - `GET /api/questions/[id]/statistics` - Question analytics

### ✅ Quiz Taking (Phase 2 - Student)
1. **Quiz Interface**
   - Random question selection
   - Option to exclude already attempted questions
   - Clean question display
   - Single-choice selection (radio buttons)
   - Submit functionality
   - Implementation: `src/app/student/quiz/page.tsx`

2. **Answer Submission**
   - Automatic grading
   - Immediate feedback with correct answer reveal
   - Score calculation
   - Attempt recording with timestamp
   - Time tracking per question
   - Implementation: `src/lib/services/quiz-service.ts` (submitAnswer)

3. **Attempt History**
   - Paginated attempt list
   - Shows correct/incorrect status
   - Detailed attempt review
   - Question details included
   - Time taken display
   - Implementation: `src/app/student/attempts/page.tsx`

4. **API Endpoints**
   - `GET /api/quiz/random` - Get random question
   - `POST /api/quiz/submit` - Submit answer
   - `GET /api/quiz/attempts` - List attempts (paginated)
   - `GET /api/quiz/attempts/[id]` - View attempt details

### ✅ Analytics & Reporting (Phase 2)
1. **Question Statistics (Instructor)**
   - Total attempts count
   - Success rate percentage
   - Average time per question
   - Option distribution analysis
   - Identifies confusing distractors
   - Implementation: `src/lib/services/question-service.ts` (getQuestionStatistics)

2. **Student Performance**
   - Overall statistics dashboard
   - Total and correct attempts
   - Total and average scores
   - Success rate calculation
   - Progress tracking
   - Implementation: `src/lib/services/quiz-service.ts` (getStudentStatistics)
   - Page: `src/app/student/statistics/page.tsx`

3. **Leaderboard**
   - Top students ranking
   - Configurable limit (default top 10)
   - Total and average scores
   - Attempt count display
   - Gamification support
   - Implementation: `src/lib/services/quiz-service.ts` (getLeaderboard)

4. **API Endpoints**
   - `GET /api/questions/[id]/statistics` - Question analytics
   - `GET /api/quiz/statistics` - Student performance
   - `GET /api/quiz/leaderboard` - Top students ranking

### ✅ User Interface (Phase 2)
1. **Instructor Pages**
   - Dashboard with overview (`/instructor/dashboard`)
   - Question list with search/filter (`/instructor/questions`)
   - Create question form (`/instructor/questions/new`)
   - Edit question form (`/instructor/questions/[id]/edit`)
   - View question details (`/instructor/questions/[id]`)

2. **Student Pages**
   - Quiz taking interface (`/student/quiz`)
   - Attempt history (`/student/attempts`)
   - Performance statistics (`/student/statistics`)

3. **Public Pages**
   - Login page (`/login`)
   - Registration page (`/signup`)
   - Home page (`/`)

### ✅ Infrastructure & Security
1. **Database Client**
   - Automatic parameter normalization (? → ?1, ?2, ?3)
   - D1 compatibility helpers
   - Batch operation support
   - Boolean conversion utilities
   - UUID generation
   - Implementation: `src/lib/d1-client.ts`

2. **Security Measures**
   - SQL injection prevention (parameterized queries)
   - Password hashing (bcrypt)
   - XSS protection (React escaping, HTTP-only cookies)
   - Role-based access control
   - Ownership verification
   - Correct answer visibility control

3. **Service Layer Architecture**
   - Clean separation of concerns
   - Business logic isolated from API routes
   - Reusable service methods
   - Comprehensive error handling
   - Type-safe interfaces

## Development Workflow

### 1. Local Development
**Recommended**: Use `npm run dev` for full-feature development
- Complete Cloudflare Workers environment
- Local D1 database access
- Authentication and all features functional
- Port: `http://localhost:8787`

**Alternative**: Use `npm run dev:next` for rapid UI iteration
- Fast refresh with Turbopack
- UI/UX development only
- No database or authentication
- Port: `http://localhost:3000`

### 2. Database Changes
1. Create migration: `wrangler d1 migrations create quizmaker-app-database <name>`
2. Write SQL in `/migrations/<timestamp>_<name>.sql`
3. Apply locally: `npm run db:migrate:local`
4. Test changes with `npm run dev`
5. **Note**: Do NOT apply migrations to remote database (per project rules)

### 3. Code Changes
1. Make changes to source files in `src/`
2. Services go in `src/lib/services/`
3. API routes go in `src/app/api/`
4. UI pages go in `src/app/instructor/` or `src/app/student/`
5. Shared components go in `src/components/`

### 4. Deployment
1. Test locally: `npm run dev`
2. Build: `npm run build`
3. Preview: `npm run preview`
4. Deploy: `npm run deploy` (when ready)

### 5. Testing
- Run linting: `npm run lint`
- Fix linter errors before committing
- Write tests in `*.test.ts` files (Vitest framework configured)

## Implementation Status Summary

| Component | Status | Completion | Location |
|-----------|--------|------------|----------|
| Database Schema | ✅ Complete | 100% | `/migrations/0001_create_initial_schema.sql` |
| Authentication | ✅ Complete | 100% | `src/lib/services/auth-service.ts`, `src/middleware.ts` |
| Question CRUD | ✅ Complete | 100% | `src/lib/services/question-service.ts` |
| Quiz Taking | ✅ Complete | 100% | `src/lib/services/quiz-service.ts` |
| Analytics | ✅ Complete | 100% | Question & student statistics implemented |
| Middleware | ✅ Complete | 100% | `src/middleware.ts` |
| Instructor UI | ✅ Complete | 90% | `/instructor/*` pages |
| Student UI | ✅ Complete | 90% | `/student/*` pages |
| API Endpoints | ✅ Complete | 100% | All CRUD and quiz APIs functional |
| Database Client | ✅ Complete | 100% | `src/lib/d1-client.ts` |
| Testing | ⏳ Configured | 10% | Vitest configured, tests to be written |
| Deployment Config | ✅ Complete | 100% | `wrangler.jsonc`, ready to deploy |

### Phase Completion Status

**✅ Phase 1: Foundation (COMPLETE)**
- Database schema with all tables and indexes
- JWT-based authentication with bcrypt
- Middleware for route protection
- User registration and login
- Role-based access control

**✅ Phase 2: Core Features (COMPLETE)**
- Full question CRUD operations
- Quiz taking with automatic grading
- Attempt tracking and history
- Analytics and statistics
- Leaderboard functionality
- Complete UI for instructors and students

**🚧 Phase 3: Polish & Testing (IN PROGRESS)**
- Service layer architecture complete
- Error handling implemented
- UI/UX improvements ongoing
- Testing suite to be implemented
- Performance optimization planned

**⏳ Phase 4: Deployment (CONFIGURED, NOT DEPLOYED)**
- Configuration complete
- Local testing successful
- Production deployment pending
- Documentation complete

## Future Enhancements (Post-Launch)

### Planned Features
- ⏳ **Rich Text Editor** - Formatting, images, code blocks in questions
- ⏳ **Question Import/Export** - Bulk operations via CSV/JSON
- ⏳ **Advanced Filtering** - Multi-criteria search and filtering
- ⏳ **Question Versioning** - Track changes over time
- ⏳ **Tags System** - Flexible categorization with multiple tags
- ⏳ **Explanation Field** - Show explanations after submission
- ⏳ **Question Pools** - Create quizzes from question pools
- ⏳ **Timed Quizzes** - Add time limits to quizzes
- ⏳ **Multi-Question Quizzes** - Bundle questions into complete quizzes
- ⏳ **AI-Powered Features** - Question generation and difficulty adjustment

### Already Implemented Beyond Original Plan
- ✅ Leaderboard system with ranking
- ✅ Random question selection with filtering
- ✅ Detailed analytics with option distribution
- ✅ Time tracking per question
- ✅ Comprehensive attempt history
- ✅ Force delete option for questions

## Key Technical Details

### Database Client (`src/lib/d1-client.ts`)
**Critical Implementation**: Parameter normalization for D1 compatibility
- Automatically converts `?` placeholders to `?1`, `?2`, `?3` format
- Prevents binding errors in local development
- Provides safe query execution helpers:
  - `executeQuery<T>()` - For SELECT queries returning multiple rows
  - `executeQueryFirst<T>()` - For SELECT queries returning single row
  - `executeMutation()` - For INSERT/UPDATE/DELETE operations
  - `executeBatch()` - For multiple operations in one call
- Boolean conversion utilities (`toBoolean()`, `fromBoolean()`)
- UUID generation with `generateId()`

### Authentication Service (`src/lib/services/auth-service.ts`)
**Implementation Highlights**:
- Edge-compatible JWT using Web Crypto API
- Bcrypt password hashing with 10 salt rounds
- Token expiration: 24 hours
- Email validation and uniqueness checks
- Password minimum length: 8 characters
- Token storage: HTTP-only cookies named 'auth_token'

### Question Service (`src/lib/services/question-service.ts`)
**Key Methods**:
- `createQuestion()` - Batch insert for options efficiency
- `getQuestionById()` - Role-based correct answer visibility
- `listQuestions()` - Pagination, search, filtering
- `updateQuestion()` - Ownership verification, full updates
- `deleteQuestion()` - Soft delete with attempt check, force delete option
- `getRandomQuestion()` - Random selection with exclusion filters
- `getQuestionStatistics()` - Analytics with option distribution

**Validation**:
- Question text: 10-1000 characters
- Options: exactly 4 or 6
- Correct answers: exactly 1
- Option text: 1-500 characters
- Points: minimum 1
- Difficulty: 'easy' | 'medium' | 'hard'

### Quiz Service (`src/lib/services/quiz-service.ts`)
**Key Methods**:
- `submitAnswer()` - Automatic grading, score calculation
- `getStudentAttempts()` - Paginated attempt history
- `getAttemptById()` - Detailed review with all options
- `getStudentStatistics()` - Overall performance metrics
- `getLeaderboard()` - Top students ranking
- `getStudentPerformanceByCategory()` - Category breakdown (bonus feature)

### Middleware (`src/middleware.ts`)
**Route Protection**:
- Public routes: `/`, `/login`, `/signup`, `/api/auth/*`
- Instructor routes: `/instructor/*` (requires instructor role)
- Student routes: `/student/*` (requires student role)
- API routes: Protected with 401/403 responses
- Automatic redirects for unauthorized access
- Token validation on every protected request

### Security Implementation
**SQL Injection Prevention**:
- All queries use parameterized statements
- Parameter normalization prevents concatenation
- No string interpolation in SQL

**Authentication Security**:
- Passwords hashed with bcrypt (never stored plain text)
- JWT tokens with expiration
- HTTP-only cookies (prevents XSS access to tokens)
- Token verification on every protected route

**Authorization**:
- Role-based access control at middleware level
- Resource ownership verification in services
- Proper HTTP status codes (401, 403, 404)

**Data Protection**:
- Correct answers hidden from students during quiz
- Students see only their own attempts
- Instructors manage only their own questions
- Cascade deletes maintain data integrity

## Documentation

Comprehensive documentation available in `quizmaker-app/docs/`:

1. **TECHNICAL_PRD.md** - Complete technical requirements and API specifications
2. **MCQ_CRUD.md** - Detailed CRUD operations guide with code examples
3. **DEVELOPMENT.md** - Development setup and workflow guide
4. **BASIC_AUTHENTICATION.md** - Authentication implementation details

## Project Status

**Current State**: ✅ Phase 2 Complete - Core features fully implemented and functional

**Production Ready**: Yes, for core features
- ✅ All CRUD operations working
- ✅ Authentication and authorization complete
- ✅ Quiz taking functional with immediate feedback
- ✅ Analytics and reporting implemented
- ✅ UI complete for all major workflows
- ✅ Security measures properly implemented

**Remaining Work**:
- ⏳ Write comprehensive test suite
- ⏳ UI/UX polish and improvements
- ⏳ Performance optimization
- ⏳ Production deployment
- ⏳ Advanced features (rich text, question pools, AI integration)

**Last Updated**: January 6, 2026
