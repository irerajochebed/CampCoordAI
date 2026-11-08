-- FINAL Import of ALL Events from Localhost to Production
-- With correct department IDs mapped

-- Events without departments (already imported, but let's make sure):
-- Youth Retreats x2, Rwanda General Conference Camp Meeting, youth, YIM

-- Now add events with correct department mappings:

-- Rwanda Youth Congress 2026 (Youth Ministries - ID: 1)
INSERT INTO events (name, event_code, type, status, start_date, end_date, venue, max_participants, department_id, coordinator_id, created_at, updated_at, deleted) 
VALUES ('Rwanda Youth Congress 2026', 'EVT-RYC-2026-PROD', 'CONFERENCE', 'COMPLETED', '2026-06-12', '2026-06-16', 'Kigali Convention Centre', 3500, 1, 7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, false);

-- Pastors Advisory Council (Ministerial - ID: 5)
INSERT INTO events (name, event_code, type, status, start_date, end_date, venue, max_participants, department_id, coordinator_id, created_at, updated_at, deleted) 
VALUES ('Pastors Advisory Council', 'EVT-PAC-2026-PROD', 'SEMINAR', 'COMPLETED', '2026-05-20', '2026-05-23', 'Gitwe', 250, 5, 7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, false);

-- Pathfinder Camporee (Youth Ministries/Children - ID: 1 or 3)
INSERT INTO events (name, event_code, type, status, start_date, end_date, venue, max_participants, department_id, coordinator_id, created_at, updated_at, deleted) 
VALUES ('Pathfinder Camporee', 'EVT-PFC-2026-PROD', 'CAMP', 'COMPLETED', '2026-07-04', '2026-07-10', 'Lake Kivu Camp', 1800, 1, 7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, false);

-- Health Ministries Training (Health - ID: 9)
INSERT INTO events (name, event_code, type, status, start_date, end_date, venue, max_participants, department_id, coordinator_id, created_at, updated_at, deleted) 
VALUES ('Health Ministries Training', 'EVT-HMT-2026-PROD', 'TRAINING', 'COMPLETED', '2026-04-15', '2026-04-18', 'Mugonero', 400, 9, 7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, false);

-- Stewardship Conference (Stewardship - ID: 11)
INSERT INTO events (name, event_code, type, status, start_date, end_date, venue, max_participants, department_id, coordinator_id, created_at, updated_at, deleted) 
VALUES ('Stewardship Conference', 'EVT-STW-2026-PROD', 'CONFERENCE', 'COMPLETED', '2026-08-22', '2026-08-25', 'Huye', 600, 11, 7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, false);

-- Women's Ministries Workshop (Women - ID: 2)
INSERT INTO events (name, event_code, type, status, start_date, end_date, venue, max_participants, department_id, coordinator_id, created_at, updated_at, deleted) 
VALUES ('Women''s Ministries Workshop', 'EVT-WMW-2026-PROD', 'WORKSHOP', 'COMPLETED', '2026-03-30', '2026-04-02', 'Rwamagana', 300, 2, 7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, false);
