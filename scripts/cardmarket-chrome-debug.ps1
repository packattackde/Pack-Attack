# Real Chrome with remote debugging — use THIS window for Cardmarket (passes bot checks).
$ProfileDir = Join-Path $PSScriptRoot "..\.cardmarket\chrome-mkm-profile"
$ProfileDir = [System.IO.Path]::GetFullPath($ProfileDir)
New-Item -ItemType Directory -Force -Path $ProfileDir | Out-Null

$Chrome = "${env:ProgramFiles}\Google\Chrome\Application\chrome.exe"
if (-not (Test-Path $Chrome)) {
  $Chrome = "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe"
}
if (-not (Test-Path $Chrome)) {
  Write-Error "Google Chrome not found. Install Chrome or set path in this script."
  exit 1
}

Write-Host "Profile: $ProfileDir"
Write-Host "Log into Cardmarket in this Chrome window. Leave it open for auto-fill."
& $Chrome `
  --remote-debugging-port=9222 `
  "--user-data-dir=$ProfileDir" `
  "https://www.cardmarket.com/en/Account/Login"
