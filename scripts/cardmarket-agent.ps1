# One command: Chrome (CDP) + local bridge for Cardmarket automation.
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

Write-Host "Pullforge Cardmarket agent — leave this window open."
Write-Host "1) Chrome opens — log into Cardmarket once if needed."
Write-Host "2) On pack-attack.de Admin -> Automate Cardmarket order."

powershell -ExecutionPolicy Bypass -File "$Root\scripts\cardmarket-chrome-debug.ps1"
Start-Sleep -Seconds 3
npm run cardmarket:local-bridge
