# Supabase Setup Guide

## Your Supabase Project Details

- **Project URL**: https://bgkvzaksjomgenqtzpzb.supabase.co
- **Project Ref**: bgkvzaksjomgenqtzpzb
- **Anon Key**: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJna3Z6YWtzam9tZ2VucXR6cHpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0ODUzMjUsImV4cCI6MjA4MDA2MTMyNX0.SowwsWMYmay5xo7JG3SVzTDStwq0__5YDRDr57F1Les

## Step 1: Get Your Database Connection String

1. Open: https://supabase.com/dashboard/project/bgkvzaksjomgenqtzpzb/settings/database
2. Scroll to **"Connection string"** section
3. Click **"URI"** tab
4. Copy the connection string (looks like):
   ```
   postgresql://postgres.bgkvzaksjomgenqtzpzb:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
   ```
5. Get your database password:
   - On the same page, find "Database password"
   - If you don't have it, click "Reset Database Password"
   - Replace `[YOUR-PASSWORD]` in the connection string above

## Step 2: Run SQL Schema

1. Open Supabase SQL Editor: https://supabase.com/dashboard/project/bgkvzaksjomgenqtzpzb/sql/new
2. Run `server/scripts/supabase_schema.sql` (creates tables, indexes, triggers)
3. Run `server/scripts/seed_admin.sql` (creates admin user: olvet@gmail.com / Olvet123@)

## Step 3: Update Backend Environment

Update your `server/.env` file:

```env
PORT=5000
JWT_SECRET=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9_x3kP9u7dF4rA9QmD7wL0Zt1Xc9R2S8kH3pO6sV1bT2kW8qY5
ADMIN_SECRET_KEY=ministry_admin_secret_2025_secure_key

# Replace with YOUR actual Supabase Postgres URI from Step 1
DATABASE_URL=postgresql://postgres.bgkvzaksjomgenqtzpzb:YOUR_DB_PASSWORD@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require

PGSSLMODE=require
```

## Step 4: Update Frontend Environment (if using Supabase client-side)

If you want to use Supabase Storage or Auth client-side, update `client/.env`:

```env
VITE_API_URL=https://ministry-report-system.onrender.com
VITE_SUPABASE_URL=https://bgkvzaksjomgenqtzpzb.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJna3Z6YWtzam9tZ2VucXR6cHpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0ODUzMjUsImV4cCI6MjA4MDA2MTMyNX0.SowwsWMYmay5xo7JG3SVzTDStwq0__5YDRDr57F1Les
```

**Note**: Your current backend uses Sequelize (direct Postgres), so client-side Supabase keys are optional unless you add Supabase Storage/Auth features.

## Step 5: Deploy

### Deploy Backend to Render

1. Go to your Render dashboard
2. Update environment variables:
   ```
   DATABASE_URL=<paste your Supabase Postgres URI>
   JWT_SECRET=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9_x3kP9u7dF4rA9QmD7wL0Zt1Xc9R2S8kH3pO6sV1bT2kW8qY5
   ADMIN_SECRET_KEY=ministry_admin_secret_2025_secure_key
   PORT=5000
   PGSSLMODE=require
   ```
3. Remove any old DB_* variables
4. Manual Deploy or push to trigger auto-deploy

### Test Backend

```bash
curl https://ministry-report-system.onrender.com/api/health
# Expected: {"status":"ok","db":"connected"}
```

## Step 6: Login

Use admin credentials:
- **Email**: olvet@gmail.com
- **Password**: Olvet123@

## Security Notes

⚠️ **IMPORTANT**: The keys shown in this guide are now publicly visible. For production:

1. **Rotate your Supabase API keys**:
   - Go to: https://supabase.com/dashboard/project/bgkvzaksjomgenqtzpzb/settings/api
   - Generate new `anon` and `service_role` keys

2. **Change your database password**:
   - Go to Database settings
   - Click "Reset Database Password"
   - Update `DATABASE_URL` everywhere

3. **Never commit `.env` files** to GitHub - they should already be in `.gitignore`

## Troubleshooting

### Connection Errors
- Ensure `DATABASE_URL` includes `?pgbouncer=true&sslmode=require`
- Verify database password is correct
- Check Supabase project is not paused

### Admin Login Fails
- Verify you ran `server/scripts/seed_admin.sql` in Supabase
- Check SQL editor for any errors during seeding

### Health Check Returns DB Disconnected
- Verify `DATABASE_URL` is set in production environment
- Check Render logs for connection errors
- Ensure Supabase project is active
