# CampCoordAI Localhost Health Check
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "CampCoordAI Localhost Health Check" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Check PostgreSQL Service
Write-Host "[1/5] Checking PostgreSQL Service..." -ForegroundColor Yellow
$pgService = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue
if ($pgService -and $pgService.Status -eq "Running") {
    Write-Host "  OK - PostgreSQL is running" -ForegroundColor Green
} else {
    Write-Host "  PROBLEM - PostgreSQL is not running" -ForegroundColor Red
    Write-Host "  Fix: Start-Service postgresql*" -ForegroundColor Yellow
}
Write-Host ""

# Check PostgreSQL Port
Write-Host "[2/5] Checking PostgreSQL Port (5432)..." -ForegroundColor Yellow
$pgPort = Test-NetConnection -ComputerName localhost -Port 5432 -WarningAction SilentlyContinue -ErrorAction SilentlyContinue
if ($pgPort.TcpTestSucceeded) {
    Write-Host "  OK - Port 5432 is open" -ForegroundColor Green
} else {
    Write-Host "  PROBLEM - Port 5432 is not accessible" -ForegroundColor Red
}
Write-Host ""

# Check Backend Port  
Write-Host "[3/5] Checking Backend Port (8080)..." -ForegroundColor Yellow
$backendPort = Test-NetConnection -ComputerName localhost -Port 8080 -WarningAction SilentlyContinue -ErrorAction SilentlyContinue
if ($backendPort.TcpTestSucceeded) {
    Write-Host "  OK - Backend is running on port 8080" -ForegroundColor Green
} else {
    Write-Host "  PROBLEM - Backend is not running" -ForegroundColor Red
    Write-Host "  Fix: Start your Spring Boot application" -ForegroundColor Yellow
}
Write-Host ""

# Check Backend API
Write-Host "[4/5] Testing Backend API..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8080/api/auth/login" -Method GET -ErrorAction Stop
    Write-Host "  OK - Backend API is responding" -ForegroundColor Green
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 401 -or $statusCode -eq 400 -or $statusCode -eq 405) {
        Write-Host "  OK - Backend API is working" -ForegroundColor Green
    } else {
        Write-Host "  PROBLEM - Cannot reach backend API" -ForegroundColor Red
    }
}
Write-Host ""

# Check Frontend Config
Write-Host "[5/5] Checking Frontend Configuration..." -ForegroundColor Yellow
$envPath = "Campfront\.env"
if (Test-Path $envPath) {
    $envContent = Get-Content $envPath -Raw
    if ($envContent -like "*localhost:8080*") {
        Write-Host "  OK - Frontend points to localhost" -ForegroundColor Green
    } else {
        Write-Host "  PROBLEM - Frontend may not point to localhost" -ForegroundColor Yellow
    }
} else {
    Write-Host "  WARNING - .env file not found" -ForegroundColor Yellow
}
Write-Host ""

# Summary
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Quick Fixes" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Start PostgreSQL:" -ForegroundColor Yellow
Write-Host "   Start-Service postgresql*" -ForegroundColor White
Write-Host ""
Write-Host "2. Create database:" -ForegroundColor Yellow
Write-Host "   psql -U postgres -c 'CREATE DATABASE camp;'" -ForegroundColor White
Write-Host ""
Write-Host "3. Check database:" -ForegroundColor Yellow
Write-Host "   psql -U postgres -d camp -c 'SELECT COUNT(*) FROM organization_units;'" -ForegroundColor White
Write-Host ""
Write-Host "4. Start backend: Run your Spring Boot application" -ForegroundColor Yellow
Write-Host ""
Write-Host "5. Start frontend:" -ForegroundColor Yellow
Write-Host "   cd Campfront" -ForegroundColor White
Write-Host "   npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "For more help, read: LOCALHOST_AND_PRODUCTION_FIX.md" -ForegroundColor Green
