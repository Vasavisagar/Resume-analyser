$ErrorActionPreference = 'Continue'
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$StateFile = Join-Path $Root '.local-services.json'
if (-not (Test-Path $StateFile)) { Write-Host 'No project services are recorded as running.'; exit 0 }
$state = Get-Content -Raw -LiteralPath $StateFile | ConvertFrom-Json
foreach ($pidValue in @($state.frontendPid, $state.apiPid)) {
    if ($pidValue) { & taskkill.exe /PID $pidValue /T /F 2>$null | Out-Null }
}
Remove-Item -LiteralPath $StateFile -Force
Write-Host 'Stopped the frontend and API processes started by this project.'
