-- ============================================================================
-- Add Upcoming Events to Production Database
-- This will add future events with UPCOMING status
-- ============================================================================

-- Insert upcoming events for various departments
-- Note: Adjust organization_unit_id and department_id based on your data

-- Get organization unit IDs (we'll use Rwanda Union Mission and North Rwanda Field)
-- Get department IDs for various ministries

-- Event 1: Youth Camp 2027 - UPCOMING
INSERT INTO events (
    name, 
    description, 
    event_type, 
    status, 
    start_date, 
    end_date, 
    location, 
    expected_attendees, 
    organization_unit_id, 
    department_id,
    deleted,
    created_at, 
    updated_at
)
VALUES (
    'Rwanda Union Youth Camp 2027',
    'Annual youth camp featuring spiritual activities, sports, and fellowship for young Adventists across Rwanda',
    'CAMP',
    'UPCOMING',
    '2027-01-15',
    '2027-01-20',
    'Musanze Campground, Northern Province',
    500,
    (SELECT id FROM organization_units WHERE code = 'RUM' LIMIT 1),
    (SELECT id FROM departments WHERE type = 'YOUTH' LIMIT 1),
    false,
    NOW(),
    NOW()
) ON CONFLICT DO NOTHING;

-- Event 2: Women's Conference - UPCOMING
INSERT INTO events (
    name, 
    description, 
    event_type, 
    status, 
    start_date, 
    end_date, 
    location, 
    expected_attendees, 
    organization_unit_id, 
    department_id,
    deleted,
    created_at, 
    updated_at
)
VALUES (
    'National Women''s Ministries Conference',
    'Empowerment conference for Adventist women leaders focusing on spiritual growth and community service',
    'CONFERENCE',
    'UPCOMING',
    '2027-02-10',
    '2027-02-13',
    'Kigali Convention Center',
    300,
    (SELECT id FROM organization_units WHERE code = 'RUM' LIMIT 1),
    (SELECT id FROM departments WHERE type = 'WOMEN' LIMIT 1),
    false,
    NOW(),
    NOW()
) ON CONFLICT DO NOTHING;

-- Event 3: Pathfinder Leadership Training - UPCOMING
INSERT INTO events (
    name, 
    description, 
    event_type, 
    status, 
    start_date, 
    end_date, 
    location, 
    expected_attendees, 
    organization_unit_id, 
    department_id,
    deleted,
    created_at, 
    updated_at
)
VALUES (
    'Pathfinder Leadership Training Workshop',
    'Training program for Pathfinder club leaders and counselors',
    'WORKSHOP',
    'UPCOMING',
    '2026-12-05',
    '2026-12-08',
    'North Rwanda Field Office, Musanze',
    150,
    (SELECT id FROM organization_units WHERE code = 'NRF' LIMIT 1),
    (SELECT id FROM departments WHERE type = 'YOUTH' LIMIT 1),
    false,
    NOW(),
    NOW()
) ON CONFLICT DO NOTHING;

-- Event 4: Evangelism Crusade - UPCOMING
INSERT INTO events (
    name, 
    description, 
    event_type, 
    status, 
    start_date, 
    end_date, 
    location, 
    expected_attendees, 
    organization_unit_id, 
    department_id,
    deleted,
    created_at, 
    updated_at
)
VALUES (
    'Rwanda Union Evangelism Crusade',
    'Major evangelistic campaign with nightly meetings and community outreach',
    'RETREAT',
    'UPCOMING',
    '2027-03-20',
    '2027-03-27',
    'Various locations across Rwanda',
    2000,
    (SELECT id FROM organization_units WHERE code = 'RUM' LIMIT 1),
    (SELECT id FROM departments WHERE type = 'REVIVAL_REFORMATION' LIMIT 1),
    false,
    NOW(),
    NOW()
) ON CONFLICT DO NOTHING;

-- Event 5: Health Expo - UPCOMING
INSERT INTO events (
    name, 
    description, 
    event_type, 
    status, 
    start_date, 
    end_date, 
    location, 
    expected_attendees, 
    organization_unit_id, 
    department_id,
    deleted,
    created_at, 
    updated_at
)
VALUES (
    'Community Health and Wellness Expo',
    'Free health screenings, wellness education, and vegetarian cooking demonstrations',
    'WORKSHOP',
    'UPCOMING',
    '2026-11-25',
    '2026-11-27',
    'Kigali City Center',
    800,
    (SELECT id FROM organization_units WHERE code = 'RUM' LIMIT 1),
    (SELECT id FROM departments WHERE type = 'HEALTH' LIMIT 1),
    false,
    NOW(),
    NOW()
) ON CONFLICT DO NOTHING;

-- Event 6: Stewardship Revival Week - UPCOMING
INSERT INTO events (
    name, 
    description, 
    event_type, 
    status, 
    start_date, 
    end_date, 
    location, 
    expected_attendees, 
    organization_unit_id, 
    department_id,
    deleted,
    created_at, 
    updated_at
)
VALUES (
    'Stewardship Revival Week 2026',
    'Week-long emphasis on Christian stewardship, tithing, and faithful resource management',
    'CONFERENCE',
    'UPCOMING',
    '2026-11-20',
    '2026-11-23',
    'Rwanda Union Mission Headquarters',
    250,
    (SELECT id FROM organization_units WHERE code = 'RUM' LIMIT 1),
    (SELECT id FROM departments WHERE type = 'STEWARDSHIP' LIMIT 1),
    false,
    NOW(),
    NOW()
) ON CONFLICT DO NOTHING;

-- Event 7: Music & Worship Conference - UPCOMING
INSERT INTO events (
    name, 
    description, 
    event_type, 
    status, 
    start_date, 
    end_date, 
    location, 
    expected_attendees, 
    organization_unit_id, 
    department_id,
    deleted,
    created_at, 
    updated_at
)
VALUES (
    'National Music and Worship Conference',
    'Training and inspiration for church musicians, choir directors, and worship leaders',
    'CONFERENCE',
    'UPCOMING',
    '2026-12-15',
    '2026-12-18',
    'Adventist University of Central Africa',
    400,
    (SELECT id FROM organization_units WHERE code = 'RUM' LIMIT 1),
    (SELECT id FROM departments WHERE type = 'MUSIC' LIMIT 1),
    false,
    NOW(),
    NOW()
) ON CONFLICT DO NOTHING;

-- Event 8: Family Life Convention - UPCOMING
INSERT INTO events (
    name, 
    description, 
    event_type, 
    status, 
    start_date, 
    end_date, 
    location, 
    expected_attendees, 
    organization_unit_id, 
    department_id,
    deleted,
    created_at, 
    updated_at
)
VALUES (
    'Family Life and Marriage Convention',
    'Strengthening Adventist families through biblical principles and practical workshops',
    'CONFERENCE',
    'UPCOMING',
    '2027-01-28',
    '2027-01-31',
    'Huye District, Southern Province',
    350,
    (SELECT id FROM organization_units WHERE code = 'SRF' LIMIT 1),
    (SELECT id FROM departments WHERE type = 'FAMILY' LIMIT 1),
    false,
    NOW(),
    NOW()
) ON CONFLICT DO NOTHING;

-- Verify the inserts
SELECT 
    'UPCOMING EVENTS ADDED' as message,
    COUNT(*) as count 
FROM events 
WHERE status = 'UPCOMING';

-- Show all events by status
SELECT 
    status,
    COUNT(*) as count
FROM events
GROUP BY status
ORDER BY status;

-- Show upcoming events details
SELECT 
    id,
    name,
    status,
    start_date,
    end_date,
    location,
    expected_attendees
FROM events
WHERE status = 'UPCOMING'
ORDER BY start_date;
