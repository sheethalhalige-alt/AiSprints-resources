# Debug Instructions for Signup Issue

## Current Status
The database is connected correctly (we can see the binding in the terminal), but signup requests are returning `400 Bad Request`. I've added detailed logging to help identify the exact problem.

## Steps to Debug:

### 1. Restart the Dev Server

Stop the current server (Ctrl+C) and restart:

```bash
npm run dev
```

Wait for it to fully start and show:
```
Your Worker has access to the following bindings:
env.quizmaker_app_database (quizmaker-app-database)      D1 Database               local
```

### 2. Try Signing Up Again

1. Go to: http://127.0.0.1:8787/signup
2. Fill in the form:
   - Name: Test User
   - Email: test@example.com
   - Password: testpass123
   - Role: Student
3. Click "Sign Up"

### 3. Check Terminal Output

Look for the detailed logs in the terminal. You should see:

**Success Path:**
```
📝 Signup request received: { name: 'Test User', email: 'test@example.com', role: 'student', hasPassword: true }
🔍 Starting registration process...
✓ Input validation passed
🔍 Checking if email exists...
🔍 Executing query: SELECT id FROM users WHERE email = ?1
✓ Query executed successfully, rows: 0
✓ Email is unique
🔒 Hashing password...
✓ Password hashed
✓ User ID generated: [uuid]
💾 Inserting user into database...
💾 Executing mutation: INSERT INTO users (id, name, email, password, role) VALUES (?1, ?2, ?3, ?4, ?5)
✓ Mutation executed successfully
✅ User successfully inserted into database
✅ User registered successfully: [uuid]
```

**Error Path (will show where it fails):**
```
📝 Signup request received: ...
🔍 Starting registration process...
❌ [Error message at the point of failure]
```

### 4. Report Back

Once you see the logs, report:

1. **What step did it reach?** (validation, email check, hashing, insertion?)
2. **What error message appears?** (copy the exact error)
3. **Any stack trace?** (copy if present)

## Common Issues to Look For:

### Issue 1: Database Context Error
If you see: `Failed to get database context` or `Request context is not available`
- **Solution**: Make sure you're running `npm run dev` (not `next dev`)
- **Solution**: Access at `http://127.0.0.1:8787` (not localhost:3000)

### Issue 2: Table Doesn't Exist
If you see: `no such table: users`
- **Solution**: Run `npm run db:migrate:local`

### Issue 3: Password Hashing Error
If it fails at "Hashing password"
- **Possible cause**: bcryptjs not working in edge runtime
- **Solution**: May need to switch to a different hashing library

### Issue 4: Environment Variable Missing
If JWT_SECRET related errors
- **Solution**: Check `.dev.vars` file exists with JWT_SECRET

## Quick Tests

### Test 1: Health Check
Visit: http://127.0.0.1:8787/api/health

Expected response:
```json
{
  "success": true,
  "database": {
    "connected": true,
    "tableCount": 4,
    "tables": ["users", "questions", "options", "quiz_attempts"]
  }
}
```

### Test 2: Direct Database Query
```bash
npx wrangler d1 execute quizmaker-app-database --local --command "SELECT * FROM users;"
```

Should return empty results (if no users yet) or list existing users.

### Test 3: Check Database File
The local database should exist at:
`.wrangler/state/v3/d1/miniflare-D1DatabaseObject/[hash].sqlite`

## Next Steps

After you restart and try again:
1. Copy the full terminal output from the signup attempt
2. Share it so I can see exactly where it's failing
3. I'll provide a targeted fix based on the specific error

The detailed logging will show us exactly what's happening!

