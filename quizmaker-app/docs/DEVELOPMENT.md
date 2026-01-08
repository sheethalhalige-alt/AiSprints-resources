# Development Guide

## Local Development Setup

### Prerequisites

1. Node.js and npm installed
2. Wrangler CLI (included in devDependencies)

### Initial Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Apply database migrations to local database:**
   ```bash
   npm run db:migrate:local
   ```

### Development Workflows

#### Option 1: Full Development with D1 Database (Recommended)

This is the recommended way to develop as it matches the production environment:

```bash
npm run dev
```

This command will:
- Build the application with OpenNext.js for Cloudflare
- Start the preview server with local D1 database access
- Make the app available at `http://localhost:8787` (or another port shown in console)

**Note:** This requires a rebuild each time you make changes, so you'll need to stop and restart the dev server to see updates.

**When to use:**
- Testing authentication and signup flows
- Working with database features
- Testing features that require Cloudflare Workers environment
- Before deploying to production

#### Option 2: Fast Development Without Database

For rapid UI development without database features:

```bash
npm run dev:next
```

This uses the standard Next.js dev server with Turbopack for fast refresh.

**When to use:**
- UI/UX development
- Component development
- Styling and layout work
- Any non-database features

**Limitations:**
- No D1 database access
- No Cloudflare Workers environment bindings
- Authentication/signup will not work

### Database Management

#### Apply Migrations Locally

```bash
npm run db:migrate:local
```

#### List Applied Migrations

```bash
npm run db:migrate:list
```

#### Create New Migration

```bash
wrangler d1 migrations create quizmaker-app-database <migration_name>
```

### Environment Variables

Local environment variables are stored in `.dev.vars`:

```bash
NEXTJS_ENV=development
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-123456789
```

### Building and Previewing

```bash
npm run preview
```

This builds and runs the app locally with the Cloudflare Workers environment (same as `npm run dev`).

### Deployment

```bash
npm run deploy
```

This builds and deploys the application to Cloudflare Workers.

### TypeScript Types

To update Cloudflare environment types:

```bash
npm run cf-typegen
```

## Troubleshooting

### "Database not available in Next.js dev mode" Error

If you see this error, it means you're using `npm run dev:next` which doesn't have database access. Switch to `npm run dev` instead.

### Migration Issues

If migrations fail to apply, ensure:
1. You're in the `quizmaker-app` directory
2. The `.wrangler/state/v3` directory exists
3. No other process is accessing the database

### Port Already in Use

If the port is already in use:
1. Stop any running dev servers
2. Or use a different port: `wrangler dev --port 8788`

## Development Best Practices

1. **Always test with `npm run dev` before deploying** to ensure database features work correctly
2. **Apply migrations locally** before applying them remotely (we don't apply to remote in development)
3. **Use `dev:next` for fast iteration** on UI components, then test with `dev` for full features
4. **Keep `.dev.vars` secure** and never commit sensitive secrets

## Architecture Notes

- **D1 Database:** Local database is stored in `.wrangler/state/v3/d1/`
- **Database Client:** All database operations go through `lib/d1-client.ts`
- **Authentication:** Uses JWT tokens stored in cookies
- **Deployment:** OpenNext.js builds Next.js for Cloudflare Workers compatibility

