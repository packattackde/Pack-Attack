# Starts real Chrome with CDP (does not block the terminal).
$ProfileDir = Join-Path $PSScriptRoot "..\.cardmarket\chrome-mkm-profile"
$ProfileDir = [System.IO.Path]::GetFullPath($ProfileDir)
New-Item -ItemType Directory -Force -Path $ProfileDir | Out-Null

$Chrome = "${env:ProgramFiles}\Google\Chrome\Application\chrome.exe"
if (-not (Test-Path $Chrome)) {
  $Chrome = "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe"
}
if (-not (Test-Path $Chrome)) {
  Write-Error "Google Chrome not found."
  exit 1
}

try {
  $null = Invoke-WebRequest -Uri "http://127.0.0.1:9222/json/version" -UseBasicParsing -TimeoutSec 2
  Write-Host "Chrome debug port 9222 already active."
  exit 0
} catch {}

Write-Host "Starting Chrome (CDP :9222). Log into Cardmarket in this window once."
Start-Process -FilePath $Chrome -ArgumentList @(
  "--remote-debugging-port=9222",
  "--user-data-dir=$ProfileDir",
  "https://www.cardmarket.com/en/Account/Login"
)
