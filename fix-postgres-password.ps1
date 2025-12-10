# PostgreSQL Password Fix Script
# Run this script as Administrator

Write-Host "=== PostgreSQL Password Fix ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Stop PostgreSQL
Write-Host "Step 1: Stopping PostgreSQL service..." -ForegroundColor Yellow
Stop-Service postgresql-x64-16
Write-Host "[OK] Service stopped" -ForegroundColor Green
Start-Sleep -Seconds 2

# Step 2: Modify pg_hba.conf
Write-Host "Step 2: Modifying pg_hba.conf to allow trust authentication..." -ForegroundColor Yellow
$configPath = "C:\Program Files\PostgreSQL\16\data\pg_hba.conf"
$content = Get-Content $configPath

$newContent = $content | ForEach-Object {
    if ($_ -match 'host\s+all\s+all\s+127\.0\.0\.1/32\s+scram-sha-256') {
        'host    all             all             127.0.0.1/32            trust'
    }
    elseif ($_ -match 'host\s+all\s+all\s+::1/128\s+scram-sha-256') {
        'host    all             all             ::1/128                 trust'
    }
    else {
        $_
    }
}

$newContent | Set-Content $configPath
Write-Host "[OK] Config modified" -ForegroundColor Green

# Step 3: Start PostgreSQL
Write-Host "Step 3: Starting PostgreSQL service..." -ForegroundColor Yellow
Start-Service postgresql-x64-16
Write-Host "[OK] Service started" -ForegroundColor Green
Start-Sleep -Seconds 3

# Step 4: Set password
Write-Host "Step 4: Setting new password..." -ForegroundColor Yellow
psql -U postgres -c "ALTER USER postgres WITH PASSWORD 'fred123';" | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Password set to 'fred123'" -ForegroundColor Green
} else {
    Write-Host "[FAIL] Failed to set password" -ForegroundColor Red
    exit 1
}

# Step 5: Restore pg_hba.conf security
Write-Host "Step 5: Restoring pg_hba.conf security..." -ForegroundColor Yellow
Stop-Service postgresql-x64-16

$content = Get-Content $configPath
$restoredContent = $content | ForEach-Object {
    if ($_ -match 'host\s+all\s+all\s+127\.0\.0\.1/32\s+trust') {
        'host    all             all             127.0.0.1/32            scram-sha-256'
    }
    elseif ($_ -match 'host\s+all\s+all\s+::1/128\s+trust') {
        'host    all             all             ::1/128                 scram-sha-256'
    }
    else {
        $_
    }
}

$restoredContent | Set-Content $configPath
Write-Host "[OK] Security restored" -ForegroundColor Green

# Step 6: Final restart
Write-Host "Step 6: Final restart..." -ForegroundColor Yellow
Start-Service postgresql-x64-16
Write-Host "[OK] Service started" -ForegroundColor Green

Write-Host ""
Write-Host "=== SUCCESS ===" -ForegroundColor Green
Write-Host "PostgreSQL password has been set to: fred123" -ForegroundColor Cyan
Write-Host ""
Write-Host "Now you can start your server:" -ForegroundColor Yellow
Write-Host "  cd server" -ForegroundColor White
Write-Host "  npm run dev" -ForegroundColor White
Write-Host ""
