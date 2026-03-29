#Requires -Version 5.1
<#
  Creates Neon branch "packattack-local-dev" and updates .env.local with pooled + direct URLs.

  1. API key: https://console.neon.tech/app/settings/api-keys
  2. Project ID: Neon project → Settings (shown in dashboard URL)

  Copy .neon.env.example to .neon.env, fill values, then: npm run neon:dev-branch
#>
$ErrorActionPreference = 'Stop'
$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
Set-Location $repoRoot

function Load-DotEnv($path) {
  if (-not (Test-Path $path)) { return }
  Get-Content $path | ForEach-Object {
    $line = $_.Trim()
    if (-not $line -or $line.StartsWith('#')) { return }
    $i = $line.IndexOf('=')
    if ($i -lt 1) { return }
    $k = $line.Substring(0, $i).Trim()
    $v = $line.Substring($i + 1).Trim().Trim('"').Trim("'")
    [Environment]::SetEnvironmentVariable($k, $v, 'Process')
  }
}

Load-DotEnv (Join-Path $repoRoot '.neon.env')

$apiKey = $env:NEON_API_KEY
$projectId = $env:NEON_PROJECT_ID
$branchName = 'packattack-local-dev'

if (-not $apiKey -or -not $projectId) {
  Write-Host @"

Set NEON_API_KEY and NEON_PROJECT_ID (env or .neon.env from .neon.env.example), then:

  npm run neon:dev-branch

"@
  exit 1
}

Write-Host "Creating branch if missing: $branchName ..."
$createOut = & npx --yes neonctl@latest branches create --name $branchName --project-id $projectId --api-key $apiKey 2>&1
if ($LASTEXITCODE -ne 0) {
  $s = "$createOut"
  if ($s -match 'already exists|duplicate|409') {
    Write-Host "Branch already present — continuing."
  } else {
    throw "neonctl branches create failed: $s"
  }
}

Write-Host "Fetching connection strings..."
$pooled = (& npx --yes neonctl@latest connection-string $branchName --project-id $projectId --api-key $apiKey --pooled --prisma).Trim()
$direct = (& npx --yes neonctl@latest connection-string $branchName --project-id $projectId --api-key $apiKey --ssl require).Trim()
if (-not $pooled -or -not $direct) { throw "Could not read connection strings from neonctl." }

if ($pooled -notmatch 'connection_limit') {
  $sep = if ($pooled -match '\?') { '&' } else { '?' }
  $pooled = "$pooled${sep}connection_limit=10&pool_timeout=30"
}

$envLocal = Join-Path $repoRoot '.env.local'
$lines = @()
if (Test-Path $envLocal) { $lines = Get-Content $envLocal -Encoding UTF8 }
$rest = [System.Collections.Generic.List[string]]::new()
foreach ($line in $lines) {
  if ($line -match '^\s*DATABASE_URL=') { continue }
  if ($line -match '^\s*DIRECT_DATABASE_URL=') { continue }
  if ($line -match '^\s*# Neon dev branch packattack-local-dev') { continue }
  $rest.Add($line)
}
$all = @(
  "# Neon dev branch $branchName (local only; not committed)"
  "DATABASE_URL=$pooled"
  "DIRECT_DATABASE_URL=$direct"
) + $rest

$utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllLines($envLocal, $all, $utf8NoBom)
Write-Host "Wrote $envLocal — restart npm run dev."
