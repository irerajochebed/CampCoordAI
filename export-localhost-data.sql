-- ============================================================================
-- Export User-Created Data from Localhost
-- This exports events, proposals, registrations, payments, etc.
-- Run this on LOCALHOST database
-- ============================================================================

-- Export Events
\echo '-- Exporting Events...'
COPY (
    SELECT 
        'INSERT INTO events (id, name, code, type, status, start_date, end_date, location, venue, description, max_capacity, organization_unit_id, department_id, organizer_id, created_at, updated_at, deleted) VALUES (' ||
        COALESCE(id::text, 'NULL') || ', ' ||
        COALESCE(quote_literal(name), 'NULL') || ', ' ||
        COALESCE(quote_literal(code), 'NULL') || ', ' ||
        COALESCE(quote_literal(type::text), 'NULL') || ', ' ||
        COALESCE(quote_literal(status::text), 'NULL') || ', ' ||
        COALESCE(quote_literal(start_date::text), 'NULL') || ', ' ||
        COALESCE(quote_literal(end_date::text), 'NULL') || ', ' ||
        COALESCE(quote_literal(location), 'NULL') || ', ' ||
        COALESCE(quote_literal(venue), 'NULL') || ', ' ||
        COALESCE(quote_literal(description), 'NULL') || ', ' ||
        COALESCE(max_capacity::text, 'NULL') || ', ' ||
        COALESCE(organization_unit_id::text, 'NULL') || ', ' ||
        COALESCE(department_id::text, 'NULL') || ', ' ||
        COALESCE(organizer_id::text, 'NULL') || ', ' ||
        COALESCE(quote_literal(created_at::text), 'CURRENT_TIMESTAMP') || ', ' ||
        COALESCE(quote_literal(updated_at::text), 'CURRENT_TIMESTAMP') || ', ' ||
        COALESCE(deleted::text, 'false') || ');'
    FROM events
    ORDER BY id
) TO 'C:/All_Vscode_project/Camp/exported_events.sql';

-- Export Proposals
\echo '-- Exporting Proposals...'
COPY (
    SELECT 
        'INSERT INTO proposals (id, title, scope, purpose, status, organization_unit_id, department_id, submitter_id, start_date, end_date, location, expected_attendees, created_at, updated_at, deleted) VALUES (' ||
        COALESCE(id::text, 'NULL') || ', ' ||
        COALESCE(quote_literal(title), 'NULL') || ', ' ||
        COALESCE(quote_literal(scope::text), 'NULL') || ', ' ||
        COALESCE(quote_literal(purpose), 'NULL') || ', ' ||
        COALESCE(quote_literal(status::text), 'NULL') || ', ' ||
        COALESCE(organization_unit_id::text, 'NULL') || ', ' ||
        COALESCE(department_id::text, 'NULL') || ', ' ||
        COALESCE(submitter_id::text, 'NULL') || ', ' ||
        COALESCE(quote_literal(start_date::text), 'NULL') || ', ' ||
        COALESCE(quote_literal(end_date::text), 'NULL') || ', ' ||
        COALESCE(quote_literal(location), 'NULL') || ', ' ||
        COALESCE(expected_attendees::text, 'NULL') || ', ' ||
        COALESCE(quote_literal(created_at::text), 'CURRENT_TIMESTAMP') || ', ' ||
        COALESCE(quote_literal(updated_at::text), 'CURRENT_TIMESTAMP') || ', ' ||
        COALESCE(deleted::text, 'false') || ');'
    FROM proposals
    ORDER BY id
) TO 'C:/All_Vscode_project/Camp/exported_proposals.sql';

-- Export Sessions
\echo '-- Exporting Sessions...'
COPY (
    SELECT 
        'INSERT INTO sessions (id, event_id, title, session_type, start_time, end_time, speaker, description, created_at, updated_at) VALUES (' ||
        COALESCE(id::text, 'NULL') || ', ' ||
        COALESCE(event_id::text, 'NULL') || ', ' ||
        COALESCE(quote_literal(title), 'NULL') || ', ' ||
        COALESCE(quote_literal(session_type::text), 'NULL') || ', ' ||
        COALESCE(quote_literal(start_time::text), 'NULL') || ', ' ||
        COALESCE(quote_literal(end_time::text), 'NULL') || ', ' ||
        COALESCE(quote_literal(speaker), 'NULL') || ', ' ||
        COALESCE(quote_literal(description), 'NULL') || ', ' ||
        COALESCE(quote_literal(created_at::text), 'CURRENT_TIMESTAMP') || ', ' ||
        COALESCE(quote_literal(updated_at::text), 'CURRENT_TIMESTAMP') || ');'
    FROM sessions
    ORDER BY id
) TO 'C:/All_Vscode_project/Camp/exported_sessions.sql';

\echo 'Export complete! Check the exported_*.sql files in your project directory.'
