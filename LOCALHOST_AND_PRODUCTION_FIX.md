# 🔧 Quick Fix: Localhost AND Production Working Together

## Your Current Situation

✅ **Production (Vercel + Render)**: Login works  
❌ **Production**: No events/data visible  
❌ **Localhost**: Can't login anymore  

---

## 🎯 Quick Solution (5 Minutes)

### Fix 1: Get Localhost Working Again

#### Step 1: Check PostgreSQL is Running

Open PowerShell as Administrator:

```powershell
# Check PostgreSQL service
Get-Service postgresql*

# If stopped, start it
Start-Service postgresql-x64-14  # or your version
```

#### Step 2: Verify Database Exists

```bash
# Open psql
psql -U postgres

# List databases
\l

# If 'camp' database doesn't exist, create it
CREATE DATABASE camp;
\q
```

#### Step 3: Check Application.yml

Make sure `src/main/resources/application.yml` has:

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/camp
    username: postgres
    password: 1234  # Your local password
```

#### Step 4: Start Backend

Run your Spring Boot application. It should:
1. Connect to database
2. Create tables automatically
3. Run `data.sql` to seed initial data

#### Step 5: Check Data Loaded

```bash
psql -U postgres -d camp

# Check if data exists
SELECT COUNT(*) FROM organization_units;
SELECT COUNT(*) FROM users;

# Should see numbers, not 0
```

---

### Fix 2: Load Data into Production Database

Your production database is empty! Here's how to populate it:

#### Option A: Via Render Dashboard (Easiest)

1. **Get Database Connection URL**:
   - Go to https://dashboard.render.com/
   - Click on your PostgreSQL database
   - Copy the **External Database URL**
   - It looks like: `postgres://user:password@host/database`

2. **Run the seed file**:

Open PowerShell in your project root:

```powershell
# Replace with your actual Render database URL
$dbUrl = "postgres://camp_user:your_password@host.oregon-postgres.render.com/camp_db"

# Run the data.sql file
psql $dbUrl -f src/main/resources/data.sql
```

#### Option B: Via Render SQL Editor

1. Go to Render Dashboard → Your Database
2. Click **"Access Database"** or **"Connect"**
3. Use Render's online SQL editor
4. Copy contents of `src/main/resources/data.sql`
5. Paste and execute

#### Option C: Force Backend to Re-seed

1. Go to Render Dashboard → Your Backend Service
2. Go to **Environment** tab
3. Find or add this variable:

```
Name:  SPRING_SQL_INIT_MODE
Value: always
```

4. **Save Changes** (triggers redeploy)
5. Wait 3-5 minutes for redeploy
6. Check logs to verify data.sql executed
7. **IMPORTANT**: Change value back to `never` after first run!

---

## 🔍 Verify Both Environments

### Check Localhost:

```bash
# 1. Check PostgreSQL is running
Get-Service postgresql*

# 2. Check database has data
psql -U postgres -d camp -f check-databases.sql

# 3. Try backend API
curl http://localhost:8080/api/v1/org-units/fields

# 4. Check frontend .env
cat Campfront/.env
# Should show: VITE_API_BASE_URL=http://localhost:8080/api
```

### Check Production:

```bash
# 1. Check backend is accessible
curl https://your-backend.onrender.com/api/v1/org-units/fields

# 2. Check Vercel environment
# Go to Vercel Dashboard → Settings → Environment Variables
# Verify: VITE_API_BASE_URL=https://your-backend.onrender.com/api
```

---

## 📊 Quick Health Check Script

Run this to diagnose localhost issues:

```powershell
.\check-localhost.ps1
```

This will check:
- PostgreSQL service status
- Database existence
- Backend running
- API connectivity
- Frontend configuration

---

## 🎯 Expected Result After Fixes

### Localhost:
- ✅ PostgreSQL running
- ✅ Database 'camp' exists with data
- ✅ Backend starts successfully
- ✅ Can login with test account
- ✅ Can see events and data
- ✅ Frontend connects to `localhost:8080`

### Production:
- ✅ Backend running on Render
- ✅ Database has seed data
- ✅ Can login with production account
- ✅ Can see events and data
- ✅ Frontend connects to Render backend

---

## 🔐 Test Accounts

### Create Test Account in BOTH Environments

After data is seeded, you need to **register** a new user in each environment:

**Localhost**: 
1. Go to `http://localhost:5173/register`
2. Register with test email (e.g., `local@test.com`)

**Production**:
1. Go to `https://your-app.vercel.app/register`
2. Register with different email (e.g., `prod@test.com`)

**Note**: Accounts are NOT shared between environments!

---

## 📋 Configuration Summary

### Localhost Environment:

```env
# Frontend: Campfront/.env
VITE_API_BASE_URL=http://localhost:8080/api

# Backend: application.yml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/camp
    username: postgres
    password: 1234
```

### Production Environment:

```env
# Frontend: Vercel Environment Variables
VITE_API_BASE_URL=https://your-backend.onrender.com/api

# Backend: Render Environment Variables
DB_URL=jdbc:postgresql://prod-host/prod-database
DB_USERNAME=prod-user
DB_PASSWORD=prod-password
CORS_ALLOWED_ORIGINS=https://your-app.vercel.app
```

---

## 🚀 Step-by-Step Startup (Localhost)

Every time you want to work locally:

```powershell
# 1. Start PostgreSQL (if not running)
Start-Service postgresql*

# 2. Verify database (optional)
psql -U postgres -d camp -c "SELECT COUNT(*) FROM organization_units;"

# 3. Start Backend (in IDE or terminal)
# - IntelliJ: Click Run
# - Terminal: mvn spring-boot:run

# 4. Start Frontend
cd Campfront
npm run dev

# 5. Open browser
# http://localhost:5173
```

---

## 💡 Understanding Environments

```
┌─────────────────────────┐       ┌────────────────────────┐
│      LOCALHOST          │       │      PRODUCTION        │
│   (Development)         │       │      (Live Users)      │
├─────────────────────────┤       ├────────────────────────┤
│ Frontend:               │       │ Frontend:              │
│   localhost:5173        │       │   Vercel URL           │
│                         │       │                        │
│ Backend:                │       │ Backend:               │
│   localhost:8080        │       │   Render URL           │
│                         │       │                        │
│ Database:               │       │ Database:              │
│   Local PostgreSQL      │       │   Render PostgreSQL    │
│   localhost:5432        │       │   Remote Host          │
│                         │       │                        │
│ Data: Test Data         │       │ Data: Production Data  │
│ Users: Local Accounts   │       │ Users: Real Accounts   │
└─────────────────────────┘       └────────────────────────┘
        ⚡ Fast                          🌍 Accessible
        🔒 Private                       👥 Public
        🧪 Testing                       ✅ Live
```

**They are SEPARATE - data does NOT sync automatically!**

---

## 🆘 Common Issues & Quick Fixes

### Issue: "Can't connect to PostgreSQL on localhost"

```powershell
# Fix 1: Start service
Start-Service postgresql*

# Fix 2: Check it's running
Get-Service postgresql*

# Fix 3: Try connecting
psql -U postgres
```

---

### Issue: "Database 'camp' does not exist"

```bash
# Fix: Create it
psql -U postgres -c "CREATE DATABASE camp;"

# Then restart your Spring Boot app (it will create tables)
```

---

### Issue: "No data in tables"

```bash
# Fix: Manually run data.sql
psql -U postgres -d camp -f src/main/resources/data.sql
```

---

### Issue: "Frontend can't connect to backend"

**Check `.env` file**:
```bash
# Localhost:
cat Campfront/.env
# Should show: VITE_API_BASE_URL=http://localhost:8080/api

# If wrong, fix it:
echo "VITE_API_BASE_URL=http://localhost:8080/api" > Campfront/.env
```

---

### Issue: "Production shows no events"

**Seed production database** - See "Fix 2" above

---

### Issue: "Different users in localhost and production"

**Expected!** They are separate databases. You need to:
- Register new accounts in each environment
- Or use same email/password in both (they're independent)

---

## ✅ Quick Verification Checklist

**Localhost:**
- [ ] PostgreSQL service running
- [ ] Database 'camp' exists
- [ ] Backend starts without errors
- [ ] Can access http://localhost:8080/api/auth/login
- [ ] Frontend .env points to localhost
- [ ] Can register/login at http://localhost:5173
- [ ] Can see organization units and data

**Production:**
- [ ] Render backend deployed and running
- [ ] Render database has data (run check query)
- [ ] Vercel deployed and running
- [ ] Vercel env var points to Render
- [ ] CORS includes Vercel domain
- [ ] Can register/login at Vercel URL
- [ ] Can see organization units and data

---

## 🎯 Next Steps After Both Work

1. ✅ Use **localhost** for development and testing
2. ✅ Test thoroughly on localhost before deploying
3. ✅ Git commit and push when ready
4. ✅ Render and Vercel auto-deploy from GitHub
5. ✅ Test on production after deployment
6. ✅ Keep environments separate - don't share databases

---

**Need more help? Check:**
- `DATABASE_SYNC_GUIDE.md` - Complete database guide
- `check-localhost.ps1` - Automated health check
- `check-databases.sql` - Database inspection queries
