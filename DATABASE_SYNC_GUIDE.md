# 🔄 Database Synchronization Guide

## Understanding the Problem

You have **TWO SEPARATE DATABASES**:
1. **Local Database** (localhost PostgreSQL) - Has all your data
2. **Production Database** (Render PostgreSQL) - Empty or has different data

They DON'T automatically sync! You need to choose one of these solutions:

---

## 🎯 Solution Options

### Option 1: Seed Production Database (Recommended)
Load the initial data into production database

### Option 2: Export/Import Your Local Data
Copy all data from local to production

### Option 3: Use Same Database for Both
Point localhost to production database (NOT recommended)

---

## ✅ Solution 1: Seed Production Database (RECOMMENDED)

Your production database should automatically seed from `data.sql` on first deployment. Let's verify and force it if needed.

### Step 1: Check if Data.sql is Running

1. Go to **Render Dashboard** → Your Backend Service → **Logs**
2. Look for lines like:
   ```
   Executing SQL script from URL [class path resource [data.sql]]
   ```

If you DON'T see this, data.sql didn't run.

### Step 2: Force Data Seeding

**Option A: Redeploy with Fresh Database**

1. In Render Dashboard, go to your PostgreSQL database
2. Click **"Access Database"** (to get credentials)
3. Use a PostgreSQL client or Render's Shell to connect
4. Run this to check if tables have data:
   ```sql
   SELECT COUNT(*) FROM organization_units;
   SELECT COUNT(*) FROM users;
   SELECT COUNT(*) FROM events;
   ```

**Option B: Manually Run data.sql**

1. Go to Render Dashboard → Database → **Shell**
2. Copy the entire contents of your `data.sql` file
3. Paste and execute in the shell

### Step 3: Verify Data is Loaded

Check Render logs or connect to database:
```sql
SELECT * FROM organization_units LIMIT 5;
SELECT * FROM users LIMIT 5;
```

---

## ✅ Solution 2: Export Local Database to Production

If you want to copy ALL your local data (including users, events, etc.) to production:

### Step 1: Export Local Database

Open your terminal and run:

```bash
# Export your local database
pg_dump -U postgres -d camp --data-only --inserts > local_data.sql
```

**Or export specific tables:**
```bash
pg_dump -U postgres -d camp --data-only --inserts \
  --table=users \
  --table=events \
  --table=organization_units \
  --table=departments \
  > local_data_partial.sql
```

### Step 2: Get Production Database Credentials

1. Go to Render Dashboard
2. Click on your PostgreSQL database
3. Copy the **External Database URL**
4. It looks like: `postgres://user:password@host/database`

### Step 3: Import to Production

```bash
# Import to production (replace with your connection URL)
psql postgres://user:password@host/database < local_data.sql
```

**⚠️ WARNING**: This will create conflicts if data already exists!

### Step 4: Handle Conflicts

If you get errors about duplicate keys:

**Option 1: Clear Production Database First**
```sql
-- Connect to production database
TRUNCATE TABLE events CASCADE;
TRUNCATE TABLE registrations CASCADE;
TRUNCATE TABLE users CASCADE;
-- etc.
```

**Option 2: Use ON CONFLICT**
Edit your SQL export to add `ON CONFLICT DO UPDATE` clauses.

---

## ✅ Solution 3: Point Localhost to Production (NOT RECOMMENDED)

### Why Not Recommended:
- Every test affects production
- Slower (network latency)
- Uses production database quota
- Risk of deleting production data

### If You Still Want To:

1. Get production database URL from Render
2. Update your local `application.yml`:
```yaml
spring:
  datasource:
    url: jdbc:postgresql://your-prod-db-host/database
    username: your-prod-username
    password: your-prod-password
```

3. Restart your local backend

---

## 🔧 Fix "Can't Login on Localhost"

### Problem: 
Your local backend is running and trying to connect to local database, but maybe:
1. Local PostgreSQL is not running
2. Database credentials changed
3. Database was deleted

### Solution:

### Step 1: Check if PostgreSQL is Running

**Windows:**
```powershell
# Check if PostgreSQL service is running
Get-Service -Name postgresql*

# Start if stopped
Start-Service postgresql-x64-14  # or your version
```

**Mac/Linux:**
```bash
# Check status
sudo systemctl status postgresql

# Start if stopped
sudo systemctl start postgresql
```

### Step 2: Check Database Exists

```bash
# List databases
psql -U postgres -l

# Should see 'camp' database
```

If `camp` database doesn't exist:
```bash
# Create it
psql -U postgres
CREATE DATABASE camp;
\q

# Run your Spring Boot app (it will create tables and seed data)
```

### Step 3: Verify Application.yml

Check your local `application.yml`:
```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/camp
    username: postgres
    password: 1234  # Your local password
```

### Step 4: Test Connection

```bash
# Try connecting manually
psql -U postgres -d camp

# If connection works, check tables
\dt

# Check if data exists
SELECT COUNT(*) FROM organization_units;
```

---

## 🎯 RECOMMENDED APPROACH

### For Development (Localhost):

1. Keep local PostgreSQL running
2. Use local database with test data
3. Use `application.yml` pointing to localhost

### For Production (Render):

1. Let production database run independently
2. Seed with `data.sql` automatically
3. Create test accounts in production
4. Don't share databases between environments

---

## 📋 Quick Checklist

### Localhost Issues:

- [ ] PostgreSQL service is running
- [ ] Database 'camp' exists
- [ ] `application.yml` points to localhost
- [ ] Can connect with psql
- [ ] Tables exist and have data
- [ ] Backend starts without errors
- [ ] Frontend `.env` points to `http://localhost:8080/api`

### Production Issues:

- [ ] Render database is created and running
- [ ] Backend is deployed successfully
- [ ] `data.sql` executed (check logs)
- [ ] Can see data in production database
- [ ] CORS includes Vercel domain
- [ ] Vercel env var points to Render backend

---

## 🚀 Step-by-Step: Seed Production Database

### Method 1: Via Render Dashboard (Easiest)

1. Go to Render Dashboard → Your Database
2. Click **"Connect"** → Copy External Database URL
3. Open a PostgreSQL client (like DBeaver, pgAdmin, or psql)
4. Connect using the URL
5. Execute your `data.sql` file

### Method 2: Via Command Line

```bash
# Get database URL from Render
# Example: postgres://user:pass@dpg-xxx.oregon-postgres.render.com/dbname

# Run the seed file
psql postgres://user:pass@host/dbname < src/main/resources/data.sql
```

### Method 3: Force Backend to Re-run Data.sql

Update `application.yml` in Render environment:

```yaml
spring:
  sql:
    init:
      mode: always  # This forces re-execution
```

Then redeploy backend.

**⚠️ Warning**: Change back to `never` after first run to avoid re-seeding on every restart!

---

## 💡 Best Practices

### Separate Environments:

```
┌─────────────────┐       ┌──────────────────┐
│  LOCALHOST      │       │  PRODUCTION      │
│  (Development)  │       │  (Live Users)    │
├─────────────────┤       ├──────────────────┤
│ Local Database  │  ≠    │ Render Database  │
│ Test Data       │       │ Real Data        │
│ localhost:5432  │       │ Render DB Host   │
└─────────────────┘       └──────────────────┘
```

### Data Management:

1. **Localhost**: Use for development and testing
2. **Production**: Keep separate, clean data
3. **Staging** (optional): Test with production-like data
4. **Backups**: Always backup production before changes

---

## 🆘 Common Issues

### Issue: "No data showing in production"

**Cause**: Production database is empty

**Fix**: Run data.sql in production database (see Solution 1)

---

### Issue: "Can't login on localhost"

**Cause**: Local database not running or wrong credentials

**Fix**: 
1. Start PostgreSQL service
2. Verify database exists
3. Check application.yml credentials
4. Check backend logs for connection errors

---

### Issue: "Data in localhost but not in production"

**Cause**: They are separate databases!

**Fix**: Choose one of the solutions above to sync them

---

### Issue: "Different users in localhost and production"

**Cause**: Databases don't sync automatically

**Fix**: Either:
- Create same test accounts in both environments
- Export/import user data
- Use production database for testing (not recommended)

---

## 📝 Quick Commands Reference

### Check PostgreSQL Status:
```bash
# Windows
Get-Service postgresql*

# Mac/Linux
systemctl status postgresql
```

### Connect to Database:
```bash
# Local
psql -U postgres -d camp

# Production (get URL from Render)
psql postgres://user:pass@host/database
```

### Check Data:
```sql
SELECT COUNT(*) FROM organization_units;
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM events;
SELECT * FROM users LIMIT 5;
```

### Export Database:
```bash
pg_dump -U postgres -d camp > backup.sql
```

### Import Database:
```bash
psql -U postgres -d camp < backup.sql
```

---

## 🎯 My Recommendation

**For your situation:**

1. ✅ **Keep localhost and production separate**
2. ✅ **Seed production database** using Method 1 or 2 above
3. ✅ **Create test account** in production to verify
4. ✅ **Keep local database** for development

This way:
- Localhost: Fast development, test freely
- Production: Real users, stable data
- No conflicts between environments

---

**Need help with any of these steps? Let me know which solution you want to use!**
