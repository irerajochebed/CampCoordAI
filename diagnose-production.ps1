# Production Diagnosis Script for CampCoordAI
# Run this to quickly diagnose production issues

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  CampCoordAI Production Diagnostic" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$backendUrl = "https://campcoordai-backend.onrender.com"
$frontendUrl = "https://camp-coord-ai-3dhr.vercel.app"
$loginEndpoint = "$backendUrl/api/auth/login"

# Test 1: Backend Accessibility
Write-Host "[1/5] Testing Backend Accessibility..." -ForegroundColor Yellow
$startTime = Get-Date
try {
    $response = Invoke-WebRequest -Uri $loginEndpoint -Method GET -TimeoutSec 60 -ErrorAction Stop
    $endTime = Get-Date
    $duration = ($endTime - $startTime).TotalSeconds
    
    Write-Host "  ✓ Backend is ACCESSIBLE" -ForegroundColor Green
    Write-Host "  Response Time: $([math]::Round($duration, 2))s" -ForegroundColor Green
    Write-Host "  Status Code: $($response.StatusCode)" -ForegroundColor Green
    
    if ($duration -gt 10) {
        Write-Host "  -> SLOW RESPONSE (>10s) - Backend was probably sleeping!" -ForegroundColor Yellow
        Write-Host "  -> Solution: Set up UptimeRobot to keep it awake" -ForegroundColor Yellow
    }
} catch {
    $endTime = Get-Date
    $duration = ($endTime - $startTime).TotalSeconds
    
    if ($_.Exception.Message -like "*Method Not Allowed*" -or $_.Exception.Response.StatusCode -eq 405) {
        Write-Host "  ✓ Backend is WORKING (405 Method Not Allowed is expected for GET on login)" -ForegroundColor Green
        Write-Host "  Response Time: $([math]::Round($duration, 2))s" -ForegroundColor Green
    } else {
        Write-Host "  ✗ Backend is NOT ACCESSIBLE" -ForegroundColor Red
        Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "  Response Time: $([math]::Round($duration, 2))s" -ForegroundColor Red
        Write-Host "  -> Check Render dashboard for deployment status" -ForegroundColor Red
    }
}
Write-Host ""

# Test 2: Frontend Accessibility
Write-Host "[2/5] Testing Frontend Accessibility..." -ForegroundColor Yellow
$startTime = Get-Date
try {
    $response = Invoke-WebRequest -Uri $frontendUrl -Method GET -TimeoutSec 30 -ErrorAction Stop
    $endTime = Get-Date
    $duration = ($endTime - $startTime).TotalSeconds
    
    Write-Host "  ✓ Frontend is ACCESSIBLE" -ForegroundColor Green
    Write-Host "  Response Time: $([math]::Round($duration, 2))s" -ForegroundColor Green
    Write-Host "  Status Code: $($response.StatusCode)" -ForegroundColor Green
} catch {
    $endTime = Get-Date
    $duration = ($endTime - $startTime).TotalSeconds
    
    Write-Host "  ✗ Frontend is NOT ACCESSIBLE" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "  Response Time: $([math]::Round($duration, 2))s" -ForegroundColor Red
    Write-Host "  -> Check Vercel dashboard for deployment status" -ForegroundColor Red
}
Write-Host ""

# Test 3: DNS Resolution
Write-Host "[3/5] Testing DNS Resolution..." -ForegroundColor Yellow
try {
    $backendHost = ([System.Uri]$backendUrl).Host
    $backendIPs = [System.Net.Dns]::GetHostAddresses($backendHost)
    Write-Host "  ✓ Backend DNS resolves to: $($backendIPs[0].IPAddressToString)" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Backend DNS resolution failed" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
}

try {
    $frontendHost = ([System.Uri]$frontendUrl).Host
    $frontendIPs = [System.Net.Dns]::GetHostAddresses($frontendHost)
    Write-Host "  ✓ Frontend DNS resolves to: $($frontendIPs[0].IPAddressToString)" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Frontend DNS resolution failed" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 4: CORS Headers
Write-Host "[4/5] Testing CORS Headers..." -ForegroundColor Yellow
try {
    $headers = @{
        "Origin" = $frontendUrl
    }
    $response = Invoke-WebRequest -Uri $loginEndpoint -Method OPTIONS -Headers $headers -TimeoutSec 30 -ErrorAction SilentlyContinue
    
    if ($response.Headers["Access-Control-Allow-Origin"]) {
        Write-Host "  ✓ CORS is configured" -ForegroundColor Green
        Write-Host "  Allowed Origin: $($response.Headers['Access-Control-Allow-Origin'])" -ForegroundColor Green
    } else {
        Write-Host "  ⚠ CORS headers not found in response" -ForegroundColor Yellow
        Write-Host "  -> May need to update CORS_ALLOWED_ORIGINS in Render" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  ℹ Could not test CORS (this is often normal)" -ForegroundColor Cyan
}
Write-Host ""

# Test 5: SSL/TLS
Write-Host "[5/5] Testing SSL/TLS Certificates..." -ForegroundColor Yellow
try {
    $request = [System.Net.WebRequest]::Create($backendUrl)
    $request.Timeout = 10000
    $response = $request.GetResponse()
    Write-Host "  ✓ SSL Certificate is valid" -ForegroundColor Green
    $response.Close()
} catch {
    Write-Host "  ⚠ SSL Certificate issue detected" -ForegroundColor Yellow
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Yellow
}
Write-Host ""

# Summary and Recommendations
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Diagnostic Summary & Recommendations" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Common Issues & Solutions:" -ForegroundColor White
Write-Host ""
Write-Host "1. Backend Slow (>10s response):" -ForegroundColor Yellow
Write-Host "   -> Render free tier cold start (backend was sleeping)" -ForegroundColor White
Write-Host "   -> Solution: Set up UptimeRobot at https://uptimerobot.com" -ForegroundColor Green
Write-Host "   -> Add monitor: $loginEndpoint" -ForegroundColor Cyan
Write-Host "   -> Interval: 5 minutes" -ForegroundColor Cyan
Write-Host ""

Write-Host "2. Backend Not Accessible:" -ForegroundColor Yellow
Write-Host "   -> Check Render dashboard: https://dashboard.render.com" -ForegroundColor White
Write-Host "   -> Verify deployment status and logs" -ForegroundColor White
Write-Host "   -> Check environment variables (DATABASE_URL, etc.)" -ForegroundColor White
Write-Host ""

Write-Host "3. Frontend Not Accessible:" -ForegroundColor Yellow
Write-Host "   -> Check Vercel dashboard: https://vercel.com/dashboard" -ForegroundColor White
Write-Host "   -> Verify latest deployment succeeded" -ForegroundColor White
Write-Host "   -> Check environment variable: VITE_API_BASE_URL" -ForegroundColor White
Write-Host ""

Write-Host "4. CORS Errors:" -ForegroundColor Yellow
Write-Host "   -> Update Render environment variable:" -ForegroundColor White
Write-Host "     CORS_ALLOWED_ORIGINS = $frontendUrl" -ForegroundColor Cyan
Write-Host "   -> Redeploy backend after changing" -ForegroundColor White
Write-Host ""

Write-Host "Quick Actions:" -ForegroundColor White
Write-Host "  • Set up UptimeRobot: 5 minutes (FREE, keeps backend awake)" -ForegroundColor Green
Write-Host "  • Check Render logs: Look for errors or crashes" -ForegroundColor Cyan
Write-Host "  • Clear browser cache: Ctrl+Shift+Delete" -ForegroundColor Cyan
Write-Host "  • Test login: After fixes, try logging in" -ForegroundColor Cyan
Write-Host ""

Write-Host "Documentation:" -ForegroundColor White
Write-Host "  • URGENT_LOGIN_FIX.md - Detailed login troubleshooting" -ForegroundColor Cyan
Write-Host "  • PRODUCTION_SLOW_LOADING_FIX.md - Cold start solutions" -ForegroundColor Cyan
Write-Host "  • IMMEDIATE_ACTIONS_REQUIRED.md - Environment setup" -ForegroundColor Cyan
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Diagnostic Complete!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
