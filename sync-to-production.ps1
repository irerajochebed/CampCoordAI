# ============================================================================
# Sync Localhost Data to Production
# This exports events, proposals, and related data from localhost to production
# ============================================================================

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Sync Localhost to Production" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

$productionDb = "postgresql://campcoord_db_user:xzaFZkcVxAsJp3RqTn29cyWqYofNfHYw@dpg-dbfja50n74is73eknis0-a.frankfurt-postgres.render.com/campcoord_db"

# Step 1: Export Events from Localhost
Write-Host "[1/4] Exporting events from localhost..." -ForegroundColor Yellow

$env:PGPASSWORD = "1234"  # Set your localhost password here

# Export events
psql -U postgres -d camp -c "COPY (SELECT id, name, code, type, status, start_date, end_date, location, venue, description, max_capacity, organization_unit_id, department_id, organizer_id, created_at, updated_at, deleted FROM events ORDER BY id) TO STDOUT WITH CSV HEADER" > events_export.csv

if ($?) {
    Write-Host "  Events exported successfully" -ForegroundColor Green
} else {
    Write-Host "  Failed to export events" -ForegroundColor Red
    exit 1
}

# Export proposals
Write-Host "[2/4] Exporting proposals from localhost..." -ForegroundColor Yellow
psql -U postgres -d camp -c "COPY (SELECT id, title, scope, purpose, status, organization_unit_id, department_id, submitter_id, start_date, end_date, location, expected_attendees, created_at, updated_at, deleted FROM proposals ORDER BY id) TO STDOUT WITH CSV HEADER" > proposals_export.csv

if ($?) {
    Write-Host "  Proposals exported successfully" -ForegroundColor Green
} else {
    Write-Host "  Failed to export proposals" -ForegroundColor Red
}

# Export sessions
Write-Host "[3/4] Exporting sessions from localhost..." -ForegroundColor Yellow
psql -U postgres -d camp -c "COPY (SELECT id, event_id, title, session_type, start_time, end_time, speaker, description, created_at, updated_at FROM sessions ORDER BY id) TO STDOUT WITH CSV HEADER" > sessions_export.csv

if ($?) {
    Write-Host "  Sessions exported successfully" -ForegroundColor Green
} else {
    Write-Host "  Failed to export sessions" -ForegroundColor Red
}

Write-Host ""
Write-Host "[4/4] Importing to production..." -ForegroundColor Yellow

# Clear production data first
Write-Host "  Clearing existing production data..." -ForegroundColor Yellow
psql "$productionDb" -c "DELETE FROM sessions;"
psql "$productionDb" -c "DELETE FROM proposals;"
psql "$productionDb" -c "DELETE FROM events;"

# Import events to production
if (Test-Path "events_export.csv") {
    Write-Host "  Importing events to production..." -ForegroundColor Yellow
    Get-Content "events_export.csv" | psql "$productionDb" -c "COPY events (id, name, code, type, status, start_date, end_date, location, venue, description, max_capacity, organization_unit_id, department_id, organizer_id, created_at, updated_at, deleted) FROM STDIN WITH CSV HEADER"
    
    if ($?) {
        Write-Host "  Events imported successfully!" -ForegroundColor Green
    } else {
        Write-Host "  Failed to import events" -ForegroundColor Red
    }
}

# Import proposals to production
if (Test-Path "proposals_export.csv") {
    Write-Host "  Importing proposals to production..." -ForegroundColor Yellow
    Get-Content "proposals_export.csv" | psql "$productionDb" -c "COPY proposals (id, title, scope, purpose, status, organization_unit_id, department_id, submitter_id, start_date, end_date, location, expected_attendees, created_at, updated_at, deleted) FROM STDIN WITH CSV HEADER"
    
    if ($?) {
        Write-Host "  Proposals imported successfully!" -ForegroundColor Green
    } else {
        Write-Host "  Failed to import proposals" -ForegroundColor Red
    }
}

# Import sessions to production
if (Test-Path "sessions_export.csv") {
    Write-Host "  Importing sessions to production..." -ForegroundColor Yellow
    Get-Content "sessions_export.csv" | psql "$productionDb" -c "COPY sessions (id, event_id, title, session_type, start_time, end_time, speaker, description, created_at, updated_at) FROM STDIN WITH CSV HEADER"
    
    if ($?) {
        Write-Host "  Sessions imported successfully!" -ForegroundColor Green
    } else {
        Write-Host "  Failed to import sessions" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Sync Complete!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Cleaning up temporary files..." -ForegroundColor Yellow
Remove-Item "events_export.csv" -ErrorAction SilentlyContinue
Remove-Item "proposals_export.csv" -ErrorAction SilentlyContinue
Remove-Item "sessions_export.csv" -ErrorAction SilentlyContinue

Write-Host "Done! Check your production app to see the synced data." -ForegroundColor Green
