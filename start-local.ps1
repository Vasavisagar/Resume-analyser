param([switch]$NoInstall)
$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$Backend = Join-Path $Root 'backend'
$Frontend = Join-Path $Root 'frontend'
$VenvPython = Join-Path $Backend '.venv\Scripts\python.exe'
$StateFile = Join-Path $Root '.local-services.json'
$LogDir = Join-Path $Root 'logs'
New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

if (Test-Path $StateFile) { throw 'A previous local run is recorded. Stop it with .\stop-local.ps1 first.' }
foreach ($port in 8000,3000) {
    $busy = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    if ($busy) { throw "Port $port is already in use. Stop that process before starting this project." }
}

$envFile = Join-Path $Root '.env'
if (Test-Path $envFile) {
    foreach ($line in Get-Content -LiteralPath $envFile) {
        if ($line -match '^\s*#' -or $line -notmatch '=') { continue }
        $parts = $line.Split('=', 2); $name = $parts[0].Trim(); $value = $parts[1].Trim().Trim('"').Trim("'")
        if ($name -match '^[A-Za-z_][A-Za-z0-9_]*$') { Set-Item -Path "Env:$name" -Value $value }
    }
}
if (-not $env:SUPABASE_URL -and $env:NEXT_PUBLIC_SUPABASE_URL) { $env:SUPABASE_URL = $env:NEXT_PUBLIC_SUPABASE_URL }
if (-not $env:SUPABASE_ANON_KEY -and $env:NEXT_PUBLIC_SUPABASE_ANON_KEY) { $env:SUPABASE_ANON_KEY = $env:NEXT_PUBLIC_SUPABASE_ANON_KEY }
if ($env:SUPABASE_URL) { $env:NEXT_PUBLIC_SUPABASE_URL = $env:SUPABASE_URL }
if ($env:SUPABASE_ANON_KEY) { $env:NEXT_PUBLIC_SUPABASE_ANON_KEY = $env:SUPABASE_ANON_KEY }
if ($env:AUTH_REQUIRED -match '^(1|true|yes)$' -and (-not $env:SUPABASE_URL -or -not $env:SUPABASE_ANON_KEY)) {
    throw 'AUTH_REQUIRED is enabled but Supabase URL/key are missing. Fill .env locally; never paste keys into chat.'
}
if (-not $env:SUPABASE_URL -or -not $env:SUPABASE_ANON_KEY) { Write-Warning 'Starting local demo mode without authentication or Supabase persistence. Do not expose this server to a network.' }
if (-not $env:NVIDIA_API_KEY) { Write-Warning 'NVIDIA assistance is disabled until NVIDIA_API_KEY is set in .env.' }

if (-not (Test-Path $VenvPython)) {
    if ($NoInstall) { throw 'Backend virtual environment is missing; rerun without -NoInstall.' }
    python -m venv (Join-Path $Backend '.venv')
}
if (-not (Test-Path (Join-Path $Frontend 'node_modules'))) {
    if ($NoInstall) { throw 'Frontend dependencies are missing; rerun without -NoInstall.' }
    Push-Location $Frontend
    try { npm ci } finally { Pop-Location }
}
if (-not $NoInstall) {
    & $VenvPython -m pip install -r (Join-Path $Backend 'requirements.txt')
    if ($LASTEXITCODE -ne 0) { throw 'Backend dependency installation failed.' }
}
$env:NEXT_PUBLIC_API_URL = 'http://localhost:8000'
$apiLog = Join-Path $LogDir 'api.log'; $webLog = Join-Path $LogDir 'frontend.log'
$api = Start-Process -FilePath $VenvPython -ArgumentList @('-m','uvicorn','app.main:app','--host','127.0.0.1','--port','8000') -WorkingDirectory $Backend -WindowStyle Hidden -RedirectStandardOutput $apiLog -RedirectStandardError (Join-Path $LogDir 'api-error.log') -PassThru
$npm = (Get-Command npm.cmd -ErrorAction Stop).Source
$web = Start-Process -FilePath $npm -ArgumentList @('run','dev','--','--hostname','127.0.0.1') -WorkingDirectory $Frontend -WindowStyle Hidden -RedirectStandardOutput $webLog -RedirectStandardError (Join-Path $LogDir 'frontend-error.log') -PassThru
@{ apiPid = $api.Id; frontendPid = $web.Id } | ConvertTo-Json | Set-Content -Encoding utf8 $StateFile

$ready = $false
for ($attempt = 0; $attempt -lt 30; $attempt++) {
    Start-Sleep -Seconds 1
    try { $health = Invoke-RestMethod 'http://127.0.0.1:8000/health' -TimeoutSec 2; $ready = $true; break } catch { }
}
if (-not $ready) { & (Join-Path $Root 'stop-local.ps1'); throw "API did not become ready. Inspect $LogDir\api-error.log" }
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Green
Write-Host "API docs:  http://localhost:8000/docs" -ForegroundColor Green
Write-Host "API health: auth=$($health.auth_mode); Supabase configured=$($health.supabase_configured); NVIDIA configured=$($health.nvidia_configured)"
if ($env:SUPABASE_URL -and $env:SUPABASE_ANON_KEY) {
    try {
        $null = Invoke-WebRequest -Uri "$($env:SUPABASE_URL)/rest/v1/analyses?select=id&limit=0" -Headers @{ apikey = $env:SUPABASE_ANON_KEY } -TimeoutSec 8
        Write-Host 'Supabase REST is reachable and the analyses table is visible.' -ForegroundColor Green
    } catch { Write-Warning 'Supabase REST check failed. Check URL/key and apply supabase/migrations/0001_initial.sql to the linked project.' }
}
Write-Host 'Use .\stop-local.ps1 to stop both services. Logs are in .\logs.'
