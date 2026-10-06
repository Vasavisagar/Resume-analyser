$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$Backend = Join-Path $Root 'backend'
$Python = Join-Path $Backend '.venv\Scripts\python.exe'
$FrontendPort = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
if ($FrontendPort) { throw 'Stop the local Next.js dev server with .\stop-local.ps1 before running the production build audit.' }
if (-not (Test-Path $Python)) { $Python = (Get-Command python -ErrorAction Stop).Source }
Push-Location $Backend
try {
    & $Python -m pip install -r (Join-Path $Backend 'requirements-dev.txt')
    if ($LASTEXITCODE -ne 0) { throw 'Backend development/test dependency installation failed.' }
    & $Python -m unittest discover -s tests -v
    if ($LASTEXITCODE -ne 0) { throw 'Backend unit/integration tests failed.' }
    & $Python backtest.py
    if ($LASTEXITCODE -ne 0) { throw 'Synthetic backtest cases failed.' }
    Push-Location (Join-Path $Root 'frontend')
    try {
        npm run lint
        if ($LASTEXITCODE -ne 0) { throw 'Frontend typecheck failed.' }
        for ($attempt = 1; $attempt -le 2; $attempt++) {
            npm run build
            if ($LASTEXITCODE -eq 0) { break }
            if ($attempt -lt 2) { Write-Warning 'Build failed once; retrying a single time for transient OneDrive/Next manifest I/O errors.' }
        }
        if ($LASTEXITCODE -ne 0) { throw 'Frontend production build failed after one retry.' }
        npm audit
        if ($LASTEXITCODE -ne 0) { throw 'NPM dependency audit found issues.' }
    } finally { Pop-Location }
} finally { Pop-Location }
Write-Host 'Audit and regression backtests passed.' -ForegroundColor Green
