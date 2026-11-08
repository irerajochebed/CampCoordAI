# Database Synchronization Guide

## Current Status

✅ **Production events cleared** - Now matches a fresh installation
✅ **Ready for your real events**

---

## Recommended Approach: Keep Production Clean

**Best Practice**: Don't sync test data from localhost to production.

Instead:
1. Use **localhost** for development and testing
2. Create **real events** in production through the UI
3. Keep them **separate** so production only has real data

This way:
- Production = Real events for real users
- Localhost = Test events for development

---

## If You Need to Copy Specific Events from Localhost to Production

### Step 1: Export Event from Localhost

```sql
-- Connect to localhost database
psql -U postgres -d camp

-- View your events
SELECT * FROM events;

-- Copy the event details you want
```

### Step 2: Create Same Event in Production

**Option A**: Use the Production UI (Recommended)
1. Login to your Vercel app
2. Go to Events & Camps
3. Click "Create Event"
4. Fill in the details manually

**Option B**: Insert via SQL
```sql
-- Get the SQL INSERT statement for specific event
psql -U postgres -d camp -c "
  SELECT 'INSERT INTO events (name, type, status, start_date, end_date, organization_unit_id, department_id, created_at, updated_at) VALUES (' ||
  quote_literal(name) || ', ' ||
  quote_literal(type) || ', ' ||
  quote_literal(status) || ', ' ||
  quote_literal(start_date::text) || ', ' ||
  quote_literal(end_date::text) || ', ' ||
  organization_unit_id || ', ' ||
  COALESCE(department_id::text, 'NULL') || ', ' ||
  quote_literal(created_at::text) || ', ' ||
  quote_literal(updated_at::text) || ');'
  FROM events WHERE id = 1;  -- Replace with your event ID
"
```

Then run that INSERT on production.

---

## Quick Commands Reference

### Clear All Events in Production
```powershell
psql "postgresql://campcoord_db_user:xzaFZkcVxAsJp3RqTn29cyWqYofNfHYw@dpg-dbfja50n74is73eknis0-a.frankfurt-postgres.render.com/campcoord_db" -c "DELETE FROM events;"
```

### Count Events in Production
```powershell
psql "postgresql://campcoord_db_user:xzaFZkcVxAsJp3RqTn29cyWqYofNfHYw@dpg-dbfja50n74is73eknis0-a.frankfurt-postgres.render.com/campcoord_db" -c "SELECT COUNT(*) FROM events;"
```

### View Events in Production
```powershell
psql "postgresql://campcoord_db_user:xzaFZkcVxAsJp3RqTn29cyWqYofNfHYw@dpg-dbfja50n74is73eknis0-a.frankfurt-postgres.render.com/campcoord_db" -c "SELECT id, name, type, status FROM events;"
```

### Re-seed Production with Sample Data
```powershell
psql "postgresql://campcoord_db_user:xzaFZkcVxAsJp3RqTn29cyWqYofNfHYw@dpg-dbfja50n74is73eknis0-a.frankfurt-postgres.render.com/campcoord_db" -f src/main/resources/data.sql
```

---

## What I Recommend

**For Production (camp-coord-ai-3dhr.vercel.app)**:
1. ✅ Keep it clean (no events currently)
2. ✅ Create real events through the UI as you need them
3. ✅ This keeps production data accurate and meaningful

**For Localhost**:
1. Keep your test events
2. Create more test events as needed
3. Test features thoroughly before deploying

**When to Sync**:
- **DON'T sync** test/fake data from localhost to production
- **DO sync** if you want to copy the organization structure (already done)
- **DO sync** if you have important real events you created in localhost first

---

## Alternative: Remove Events from data.sql

If you don't want ANY events to be seeded by default:

Edit `src/main/resources/data.sql` and remove or comment out the event INSERT statements (around line 270+).

This way, when you run data.sql:
- It will create organization structure ✅
- It will create departments ✅
- It will NOT create any events ✅

---

## Current State

- **Production Database**: Clean, with organization structure, NO events
- **Localhost Database**: Has your 3 test events
- **Both Ready**: To create events as needed

---

**Recommendation**: Leave it as is and create real events in production when you're ready to go live!
