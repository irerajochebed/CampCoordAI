-- ============================================================================
-- Database Health Check Script
-- Run this in both LOCAL and PRODUCTION databases to compare
-- ============================================================================

-- Show current database info
SELECT current_database() as database_name, 
       current_user as current_user,
       version() as postgres_version;

-- Count records in each table
SELECT 'organization_units' as table_name, COUNT(*) as record_count FROM organization_units
UNION ALL
SELECT 'departments', COUNT(*) FROM departments
UNION ALL
SELECT 'users', COUNT(*) FROM users
UNION ALL
SELECT 'events', COUNT(*) FROM events
UNION ALL
SELECT 'proposals', COUNT(*) FROM proposals
UNION ALL
SELECT 'registrations', COUNT(*) FROM registrations
UNION ALL
SELECT 'payments', COUNT(*) FROM payments
UNION ALL
SELECT 'sessions', COUNT(*) FROM sessions
UNION ALL
SELECT 'resources', COUNT(*) FROM resources
UNION ALL
SELECT 'notifications', COUNT(*) FROM notifications
UNION ALL
SELECT 'ai_insights', COUNT(*) FROM ai_insights
ORDER BY table_name;

-- Show sample users (first 5)
SELECT id, first_name, last_name, email, role, position, organization_unit_id
FROM users
ORDER BY id
LIMIT 5;

-- Show organization hierarchy summary
SELECT level, COUNT(*) as count
FROM organization_units
GROUP BY level
ORDER BY 
    CASE level
        WHEN 'UNION' THEN 1
        WHEN 'FIELD' THEN 2
        WHEN 'DISTRICT' THEN 3
        WHEN 'CHURCH' THEN 4
    END;

-- Show events summary
SELECT status, COUNT(*) as count
FROM events
GROUP BY status;

-- Show latest events
SELECT id, name, event_type, status, start_date, end_date, organization_unit_id
FROM events
ORDER BY created_at DESC
LIMIT 5;

-- Check if initial data was loaded (should have Rwanda Union Mission)
SELECT name, code, level 
FROM organization_units 
WHERE code = 'RUM'
LIMIT 1;

-- Show database size
SELECT 
    pg_size_pretty(pg_database_size(current_database())) as database_size;
