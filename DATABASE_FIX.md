# Database Connection Fix - PostgreSQL Password Issue

Your PostgreSQL is rejecting password "fred123". Here are 3 solutions:

---

## ✅ OPTION 1: Use pgAdmin (EASIEST)

1. **Open pgAdmin 4** (search in Windows Start menu)
2. **Connect to PostgreSQL** (it may ask for master password)
3. **Expand** Servers → PostgreSQL 16 → Login/Group Roles
4. **Right-click** on `postgres` user → Properties
5. **Go to Definition tab**
6. **Set Password:** `fred123`
7. **Click Save**
8. **Restart your server:** `cd server; npm run dev`

---

## ✅ OPTION 2: Edit pg_hba.conf (TEMPORARY - For Development)

This allows password-free local connections:

1. **Find pg_hba.conf:**
   ```powershell
   Get-ChildItem -Path "C:\Program Files\PostgreSQL" -Recurse -Filter "pg_hba.conf" -ErrorAction SilentlyContinue
   ```

2. **Open as Administrator** in Notepad

3. **Find these lines:**
   ```
   host    all             all             127.0.0.1/32            scram-sha-256
   host    all             all             ::1/128                 scram-sha-256
   ```

4. **Change to:**
   ```
   host    all             all             127.0.0.1/32            trust
   host    all             all             ::1/128                 trust
   ```

5. **Restart PostgreSQL Service:**
   ```powershell
   Restart-Service postgresql-x64-16
   ```

6. **Now set the password:**
   ```powershell
   psql -U postgres -c "ALTER USER postgres WITH PASSWORD 'fred123';"
   ```

7. **Revert pg_hba.conf back** to `scram-sha-256`

8. **Restart PostgreSQL again**

---

## ✅ OPTION 3: Change .env Password (QUICKEST)

If you remember your PostgreSQL password:

1. **Open:** `server/.env`
2. **Change line 3:**
   ```env
   DB_PASS=your_actual_postgres_password
   ```
3. **Save file**
4. **Restart server:** `cd server; npm run dev`

---

## 🔍 Find Your PostgreSQL Password

Your password might be in:
- **Installation notes** (if you just installed PostgreSQL)
- **Password manager**
- **Windows Credential Manager:**
  ```powershell
  rundll32.exe keymgr.dll,KRShowKeyMgr
  ```
  Look for "postgres" entries

---

## ✅ After Fixing

Test connection:
```powershell
cd server
npm run dev
```

You should see:
```
Server running on port 5000
Database connected successfully
```

**Current Status:**
- ✅ Frontend running on http://localhost:3001
- ❌ Backend waiting for database fix
- ✅ All code ready (password reset, compact forms, etc.)

**Choose the easiest option for you!**
