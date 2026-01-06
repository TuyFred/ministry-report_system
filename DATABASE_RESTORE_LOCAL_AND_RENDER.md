# Database Restore (Local + Render)

This repo uses PostgreSQL via Sequelize. Your backup data targets these tables:

- `"Users"`
- `"Reports"`
- `"Attachments"`
- `"ReportFormTemplates"`

## ✅ Recommended restore SQL

Use the included fixed restore file:

- `server/scripts/report-db-fixed-notx.sql`

It **creates the required tables** (if missing) and then restores the data.

> If you want to use your own SQL backup from Downloads, you can pass it as `-SqlFile`, but make sure it includes `CREATE TABLE ...` statements (or it will fail).

---

## 1) Restore to local PostgreSQL (DB name: `ministry_db`)

### Prerequisites

- PostgreSQL installed
- `psql` available (run `psql --version`)

### Run

From repo root:

```powershell
cd server\scripts
.\restore-local.ps1
```

By default this restores:

- SQL file: `server/scripts/report-db-fixed-notx.sql`
- DB name: `ministry_db`
- DB user: `postgres`
- host/port: `localhost:5432`

If your SQL is somewhere else (example: your Downloads file):

```powershell
cd server\scripts
.\restore-local.ps1 -SqlFile "C:\Users\user\Downloads\report-db.sql"
```

If your local Postgres user/password is different:

```powershell
cd server\scripts
.\restore-local.ps1 -DbUser "postgres" -DbHost "localhost" -DbPort 5432
```

The script will prompt for the password.

---

## 2) Restore to Render PostgreSQL (online)

### Important

- Use **Render Dashboard → PostgreSQL → Internal Database URL**
- Make sure your Render Web Service `DATABASE_URL` uses the same database.

### Run using environment variable

Set `DATABASE_URL` in your PowerShell session and restore:

```powershell
$env:DATABASE_URL = "<paste your Render Internal Database URL here>"
cd server\scripts
.\restore-render.ps1
```

Or pass it directly:

```powershell
cd server\scripts
.\restore-render.ps1 -DatabaseUrl "<paste your Render Internal Database URL here>"
```

The script forces `sslmode=require` automatically.

---

## 3) Verify the app sees the restored data

### Local backend

```powershell
cd server
npm install
npm run dev
```

Then open:

- http://localhost:5000/api/health

### Render backend

After deploying with `DATABASE_URL` set, open:

- https://ministry-report-system.onrender.com/api/health

---

## Notes / Common issues

- **Wrong schema**: If you used `supabase_schema.sql`, it won’t match this Sequelize schema (different table names + UUIDs). Use `report-db-fixed-notx.sql`.
- **Password errors**: See `DATABASE_FIX.md` for resetting local postgres password.
- **Encoding**: The scripts set `PGCLIENTENCODING=UTF8`.
