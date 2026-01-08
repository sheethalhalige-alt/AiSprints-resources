# Troubleshooting Guide - QuizMaker Application

## Issue: "Database not available in Next.js dev mode"

### Problem
When accessing the signup page at `http://127.0.0.1:8787/signup`, you see the error:
```
Database not available in Next.js dev mode. Please use "npm run preview" 
to run the app with Cloudflare Workers environment and D1 database access.
```

### Root Cause
The Cloudflare D1 database is only accessible when running in the Cloudflare Workers environment, not in standard Next.js dev mode.

### Solution

#### Step 1: Use the Correct Development Command

Instead of `next dev`, use:

```bash
npm run dev
```

This runs the application using `opennextjs-cloudflare preview` which provides:
- Cloudflare Workers environment
- D1 database access
- Edge runtime compatibility

The app will be available at: **http://127.0.0.1:8787**

#### Step 2: Ensure Database is Migrated

Make sure your local D1 database has the schema:

```bash
npm run db:migrate:local
```

Or manually:

```bash
npx wrangler d1 migrations apply quizmaker-app-database --local
```

#### Step 3: Verify Database Connection

You can verify tables exist by querying the database:

```bash
npx wrangler d1 execute quizmaker-app-database --local --command "SELECT name FROM sqlite_master WHERE type='table';"
```

Expected output should include: `users`, `questions`, `options`, `quiz_attempts`

## Common Issues and Solutions

### Issue 1: Port 8787 Already in Use

**Symptoms:** Error message "Port 8787 is already in use"

**Solution:**
```bash
# Find and kill the process using port 8787
# Windows:
netstat -ano | findstr :8787
taskkill /PID <PID> /F

# Or change the port in wrangler.jsonc
```

### Issue 2: D1 Database Binding Not Found

**Symptoms:** Error "D1 database binding 'quizmaker_app_database' not found"

**Solution:**
1. Check `wrangler.jsonc` has the correct binding:
```json
"d1_databases": [
  {
    "binding": "quizmaker_app_database",
    "database_name": "quizmaker-app-database",
    "database_id": "c3599ec7-e22f-4687-b1e4-e6277caeb45c",
    "preview_database_id": "quizmaker-app-database"
  }
]
```

2. Rebuild the application:
```bash
npm run dev
```

### Issue 3: JWT Token Errors

**Symptoms:** "Invalid or expired token" errors

**Solution:**
1. Ensure `.dev.vars` file exists with JWT_SECRET:
```env
NEXTJS_ENV=development
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-123456789
```

2. Clear browser cookies and try logging in again

### Issue 4: Migration Errors

**Symptoms:** "Table already exists" or migration fails

**Solution:**
1. Check migration status:
```bash
npx wrangler d1 migrations list quizmaker-app-database --local
```

2. If needed, delete local database and reapply:
```bash
# Delete .wrangler/state directory
rm -rf .wrangler/state

# Reapply migrations
npm run db:migrate:local
```

### Issue 5: Build Errors with OpenNext

**Symptoms:** Build fails with module resolution errors

**Solution:**
1. Clear build cache:
```bash
rm -rf .next
rm -rf .open-next
rm -rf node_modules
```

2. Reinstall dependencies:
```bash
npm install
```

3. Rebuild:
```bash
npm run dev
```

## Development Workflow

### Recommended Development Process

1. **Start Development Server:**
```bash
npm run dev
```

2. **Access Application:**
   - Navigate to: http://127.0.0.1:8787
   - NOT http://localhost:3000

3. **Make Code Changes:**
   - Save files
   - Preview mode will rebuild automatically

4. **Test Database Changes:**
```bash
# Create new migration
npx wrangler d1 migrations create quizmaker-app-database my_migration_name

# Apply migration
npm run db:migrate:local
```

### Alternative: Next.js Dev Mode (Limited)

If you need standard Next.js dev tools:

```bash
npm run dev:next
```

**Note:** This runs on port 3000 but **won't have database access**. Use only for:
- UI development
- Component testing
- Layout work

## Environment-Specific Notes

### Local Development (Preview Mode)
- **Port:** 8787
- **Command:** `npm run dev`
- **Database:** Local D1 (SQLite)
- **Runtime:** Cloudflare Workers emulation

### Production Deployment
- **Platform:** Cloudflare Workers
- **Command:** `npm run deploy`
- **Database:** Remote D1
- **Runtime:** Cloudflare Workers edge

## Debugging Tips

### Enable Verbose Logging

Add to your API routes:
```typescript
console.log('Request received:', request.url);
console.log('Environment:', process.env);
```

### Check Request Context

In your API route:
```typescript
import { getRequestContext } from '@cloudflare/next-on-pages';

export async function POST(request: NextRequest) {
  try {
    const context = getRequestContext();
    console.log('Context available:', !!context);
    console.log('Env keys:', Object.keys(context?.env || {}));
    // ... rest of code
  } catch (error) {
    console.error('Context error:', error);
  }
}
```

### Inspect Database

Query your database directly:
```bash
# List all tables
npx wrangler d1 execute quizmaker-app-database --local --command "SELECT name FROM sqlite_master WHERE type='table';"

# Count users
npx wrangler d1 execute quizmaker-app-database --local --command "SELECT COUNT(*) FROM users;"

# View all users
npx wrangler d1 execute quizmaker-app-database --local --command "SELECT id, name, email, role FROM users;"
```

## Quick Reference

### Key Commands
```bash
# Start development
npm run dev

# Start without DB (UI only)
npm run dev:next

# Apply migrations
npm run db:migrate:local

# List migrations
npm run db:migrate:list

# Build for production
npm run build

# Deploy to Cloudflare
npm run deploy
```

### Key Files
- `wrangler.jsonc` - Cloudflare configuration
- `.dev.vars` - Local environment variables
- `src/lib/d1-client.ts` - Database client
- `migrations/*.sql` - Database schema

### Key URLs
- Development: http://127.0.0.1:8787
- Alternative (no DB): http://localhost:3000

## Still Having Issues?

1. **Check Terminal Output:** Look for detailed error messages
2. **Check Browser Console:** Look for client-side errors
3. **Verify File Changes:** Ensure all files are saved
4. **Restart Dev Server:** Stop and restart `npm run dev`
5. **Check Database:** Verify tables exist and are accessible
6. **Review Logs:** Check `.wrangler/` for detailed logs

## Success Checklist

Before reporting an issue, verify:

- [ ] Running `npm run dev` (not `npm run dev:next`)
- [ ] Accessing http://127.0.0.1:8787 (not localhost:3000)
- [ ] `.dev.vars` file exists with JWT_SECRET
- [ ] Database migrations have been applied
- [ ] `wrangler.jsonc` has correct D1 binding
- [ ] Node modules are installed (`npm install`)
- [ ] No port conflicts (8787 available)

If all checks pass and you still have issues, the problem may be specific to your code changes.

