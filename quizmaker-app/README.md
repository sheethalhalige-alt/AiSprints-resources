# QuizMaker App

A quiz-creating application for teachers, built with Next.js 15 and deployed on Cloudflare Workers with D1 database.

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Local Database

Apply database migrations to your local D1 database:

```bash
npm run db:migrate:local
```

### 3. Start Development Server

**For full features with database access (recommended for signup/auth):**

```bash
npm run dev
```

This starts the app with Cloudflare Workers environment and local D1 database access.
Open [http://localhost:8787](http://localhost:8787) (or the port shown in console) with your browser.

**For fast UI development without database:**

```bash
npm run dev:next
```

This uses the standard Next.js dev server with hot reload.
Open [http://localhost:3000](http://localhost:3000) with your browser.

⚠️ **Note:** The `dev:next` command will show "Database not available" errors if you try to use authentication or any database features. Use `npm run dev` for those features.

## Development

See [DEVELOPMENT.md](./docs/DEVELOPMENT.md) for detailed development guide.

### Available Scripts

- `npm run dev` - Full development with D1 database access (recommended)
- `npm run dev:next` - Fast UI development without database
- `npm run preview` - Build and preview locally
- `npm run deploy` - Deploy to Cloudflare Workers
- `npm run db:migrate:local` - Apply database migrations locally
- `npm run db:migrate:list` - List applied migrations

## Project Structure

- `/src/app` - Next.js app directory (pages and routes)
- `/src/components` - React components
- `/src/lib` - Utility functions and services
- `/migrations` - Database migration files
- `/docs` - Project documentation

## Documentation

- [Technical PRD](./docs/TECHNICAL_PRD.md)
- [MCQ CRUD Operations](./docs/MCQ_CRUD.md)
- [Authentication Guide](./docs/BASIC_AUTHENTICATION.md)
- [Development Guide](./docs/DEVELOPMENT.md)
- [Project Overview](./docs/PROJECT_OVERVIEW.md)

## Deploy

Deploy the application to Cloudflare:

```bash
npm run deploy
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!
