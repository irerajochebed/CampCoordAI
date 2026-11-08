# ============================================================================
# CampCoordAI Localhost Health Check Script
# Run this to diagnose localhost database and backend issues
# ============================================================================

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "CampCoordAI Localhost Health Check" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Check 1: PostgreSQL Service
Write-Host "[1/6] Checking PostgreSQL Service..." -ForegroundColor Yellow
$pgService = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue

if ($pgService) {
    $status = $pgService.Status
    if ($status -eq "Running") {
        Write-Host "  ✓ PostgreSQL is running" -ForegroundColor Green
    } else {
        Write-Host "  ✗ PostgreSQL is $status" -ForegroundColor Red
        Write-Host "  Fix: Start-Service $($pgService.Name)" -ForegroundColor Yellow
    }
} else {
    Write-Host "  ✗ PostgreSQL service not found" -ForegroundColor Red
    Write-Host "  Is PostgreSQL installed?" -ForegroundColor Yellow
}
Write-Host ""

# Check 2: PostgreSQL Port
Write-Host "[2/6] Checking PostgreSQL Port (5432)..." -ForegroundColor Yellow
$pgPort = Test-NetConnection -ComputerName localhost -Port 5432 -WarningAction SilentlyContinue

if ($pgPort.TcpTestSucceeded) {
    Write-Host "  ✓ Port 5432 is open and listening" -ForegroundColor Green
} else {
    Write-Host "  ✗ Port 5432 is not accessible" -ForegroundColor Red
    Write-Host "  PostgreSQL may not be running" -ForegroundColor Yellow
}
Write-Host ""

# Check 3: Database Exists
Write-Host "[3/6] Checking if 'camp' database exists..." -ForegroundColor Yellow
try {
    $dbCheck = psql -U postgres -lqt | Select-String -Pattern "camp"
    if ($dbCheck) {
        Write-Host "  ✓ Database 'camp' exists" -ForegroundColor Green
    } else {
        Write-Host "  ✗ Database 'camp' not found" -ForegroundColor Red
        Write-Host "  Fix: Run 'psql -U postgres' then 'CREATE DATABASE camp;'" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  ⚠ Cannot check database (psql not in PATH or connection failed)" -ForegroundColor Yellow
    Write-Host "  Try connecting manually: psql -U postgres -d camp" -ForegroundColor Cyan
}
Write-Host ""

# Check 4: Backend Port
Write-Host "[4/6] Checking Backend Port (8080)..." -ForegroundColor Yellow
$backendPort = Test-NetConnection -ComputerName localhost -Port 8080 -WarningAction SilentlyContinue

if ($backendPort.TcpTestSucceeded) {
    Write-Host "  ✓ Backend is running on port 8080" -ForegroundColor Green
} else {
    Write-Host "  ✗ Backend is not running" -ForegroundColor Red
    Write-Host "  Start your Spring Boot application" -ForegroundColor Yellow
}
Write-Host ""

# Check 5: Backend API Test
Write-Host "[5/6] Testing Backend API..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8080/api/auth/login" -Method GET -ErrorAction Stop
    Write-Host "  ✓ Backend API is responding (Status: $($response.StatusCode))" -ForegroundColor Green
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 401 -or $statusCode -eq 400 -or $statusCode -eq 405) {
        Write-Host "  ✓ Backend API is working (Status: $statusCode)" -ForegroundColor Green
    } else {
        Write-Host "  ✗ Cannot reach backend API" -ForegroundColor Red
        Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}
Write-Host ""

# Check 6: Frontend .env
Write-Host "[6/6] Checking Frontend Configuration..." -ForegroundColor Yellow
$envPath = "Campfront\.env"
if (Test-Path $envPath) {
    $envContent = Get-Content $envPath -Raw
    if ($envContent -match "VITE_API_BASE_URL=http://localhost:8080/api") {
        Write-Host "  ✓ Frontend .env points to localhost" -ForegroundColor Green
    } else {
        Write-Host "  ⚠ Frontend .env may not be configured for localhost" -ForegroundColor Yellow
        Write-Host "  Check: $envPath" -ForegroundColor Cyan
    }
} else {
    Write-Host "  ⚠ .env file not found at $envPath" -ForegroundColor Yellow
}
Write-Host ""

# Summary
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Summary & Next Steps" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Quick Fixes:" -ForegroundColor Yellow
Write-Host "  1. Start PostgreSQL: " -NoNewline
Write-Host "Start-Service postgresql*" -ForegroundColor Cyan
Write-Host ""
Write-Host "  2. Create database: " -NoNewline
Write-Host "psql -U postgres -c 'CREATE DATABASE camp;'" -ForegroundColor Cyan
Write-Host ""
Write-Host "  3. Check database: " -NoNewline
Write-Host "psql -U postgres -d camp -f check-databases.sql" -ForegroundColor Cyan
Write-Host ""
Write-Host "  4. Start backend: Run your Spring Boot application" -ForegroundColor Cyan
Write-Host ""
Write-Host "  5. Start frontend: " -NoNewline
Write-Host "cd Campfront && npm run dev" -ForegroundColor Cyan
Write-Host ""

Write-Host "For more help, see: DATABASE_SYNC_GUIDE.md" -ForegroundColor Green
