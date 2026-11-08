# 🔄 Complete Data Sync: Localhost → Production

This guide will help you sync ALL events, proposals, and related data from localhost to production.

---

## 🎯 Quick Sync (Recommended Method)

### Step 1: Export Localhost Data

Open PowerShell in your project root and run:

```powershell
# Set your localhost password (adjust if different)
$env:PGPASSWORD = "1234"

# Export all user data (events, proposals, registrations, etc.)
pg_dump -U postgres -d camp --data-only --inserts --table=events --table=proposals --table=sessions --table=registrations --table=payments --table=resources --table=accommodations --table=notifications > localhost_data.sql
```

This creates a file `localhost_data.sql` with all your data as INSERT statements.

### Step 2: Import to Production

```powershell
# Import to production
psql "postgresql://campcoord_db_user:xzaFZkcVxAsJp3RqTn29cyWqYofNfHYw@dpg-dbfja50n74is73eknis0-a.frankfurt-postgres.render.com/campcoord_db" -f localhost_data.sql
```

### Step 3: Verify

```powershell
# Check production has your data
psql "postgresql://campcoord_db_user:xzaFZkcVxAsJp3RqTn29cyWqYofNfHYw@dpg-dbfja50n74is73eknis0-a.frankfurt-postgres.render.com/campcoord_db" -c "SELECT COUNT(*) FROM events;"
```

---

## 🛠️ Alternative Method: Manual SQL Export/Import

### Step 1: Export Events from Localhost

```powershell
# Export events
$env:PGPASSWORD = "1234"
psql -U postgres -d camp -c "\COPY events TO 'events.csv' WITH CSV HEADER"
```

### Step 2: Import to Production

```powershell
# Clear existing events in production
psql "postgresql://campcoord_db_user:xzaFZkcVxAsJp3RqTn29cyWqYofNfHYw@dpg-dbfja50n74is73eknis0-a.frankfurt-postgres.render.com/campcoord_db" -c "DELETE FROM events;"

# Import events
psql "postgresql://campcoord_db_user:xzaFZkcVxAsJp3RqTn29cyWqYofNfHYw@dpg-dbfja50n74is73eknis0-a.frankfurt-postgres.render.com/campcoord_db" -c "\COPY events FROM 'events.csv' WITH CSV HEADER"
```

Repeat for proposals, sessions, etc.

---

## 🚀 One-Command Sync (Easiest!)

I'll create a simpler approach. Let me check what data you have first and create INSERT statements.

### For Events Only (Quick Fix):

```powershell
# 1. Get event data from localhost
$env:PGPASSWORD = "1234"
psql -U postgres -d camp -c "SELECT 'INSERT INTO events (name, code, type, status, start_date, end_date, location, venue, description, max_capacity, organization_unit_id, department_id, organizer_id) VALUES (' || quote_literal(name) || ', ' || quote_literal(code) || ', ' || quote_literal(type::text) || ', ' || quote_literal(status::text) || ', ' || quote_literal(start_date::text) || ', ' || quote_literal(end_date::text) || ', ' || quote_literal(location) || ', ' || quote_literal(venue) || ', ' || quote_literal(description) || ', ' || max_capacity || ', ' || organization_unit_id || ', ' || COALESCE(department_id::text, 'NULL') || ', ' || COALESCE(organizer_id::text, 'NULL') || ');' FROM events;" > sync_events.sql

# 2. Import to production
psql "postgresql://campcoord_db_user:xzaFZkcVxAsJp3RqTn29cyWqYofNfHYw@dpg-dbfja50n74is73eknis0-a.frankfurt-postgres.render.com/campcoord_db" -f sync_events.sql
```

---

## ⚠️ Important Notes

### Before Syncing:

1. **Backup production** (optional but recommended)
2. **Check for conflicts** - if production has data, it might conflict with localhost IDs
3. **Users won't be synced** - user accounts are separate (security reasons)

### What Gets Synced:

- ✅ Events
- ✅ Proposals  
- ✅ Sessions
- ✅ Registrations (if any)
- ✅ Payments (if any)
- ✅ Resources (if any)

### What Doesn't Get Synced:

- ❌ Users (security - passwords are hashed with different salts)
- ❌ Organization units (already there from data.sql)
- ❌ Departments (already there from data.sql)

---

## 🔍 Verify Sync Success

After syncing, check both environments:

### Check Localhost:
```powershell
$env:PGPASSWORD = "1234"
psql -U postgres -d camp -c "SELECT COUNT(*) as events FROM events; SELECT COUNT(*) as proposals FROM proposals;"
```

### Check Production:
```powershell
psql "postgresql://campcoord_db_user:xzaFZkcVxAsJp3RqTn29cyWqYofNfHYw@dpg-dbfja50n74is73eknis0-a.frankfurt-postgres.render.com/campcoord_db" -c "SELECT COUNT(*) as events FROM events; SELECT COUNT(*) as proposals FROM proposals;"
```

Both should show the same counts!

---

## 🆘 Troubleshooting

### "Permission denied" or "Password required"

Set the password in environment:
```powershell
$env:PGPASSWORD = "your_localhost_password"
```

### "Duplicate key violation"

Production already has some data. Clear it first:
```powershell
psql "production_url" -c "DELETE FROM sessions; DELETE FROM proposals; DELETE FROM events;"
```

Then try import again.

### "Foreign key violation"

Make sure organization_units and departments are in production (they should be from data.sql).

---

## 📝 Manual Method (If Scripts Don't Work)

If the automated scripts don't work, you can manually sync each event:

1. **View localhost events**:
   ```sql
   SELECT * FROM events;
   ```

2. **For each event, create in production UI**:
   - Login to production
   - Go to Events & Camps
   - Click "Create Event"
   - Fill in the details from localhost

This is slower but guaranteed to work!

---

## ✅ Success Criteria

After syncing, you should see:
- Same number of events in both environments
- Same event names and details
- Production app shows all your localhost events

---

Would you like me to run the sync for you now? I'll need to know your localhost PostgreSQL password.
