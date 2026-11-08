-- Update Production Events to Have Future Dates
-- This will make events show as "UPCOMING" instead of "COMPLETED"

-- Update event dates to be in the future (2027 instead of 2026)
UPDATE events SET 
    start_date = start_date + INTERVAL '1 year',
    end_date = end_date + INTERVAL '1 year',
    status = 'REGISTRATION_OPEN'
WHERE status = 'COMPLETED';

-- Verify the changes
SELECT id, name, type, status, start_date, end_date 
FROM events 
ORDER BY start_date ASC;
