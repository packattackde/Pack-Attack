# Pack-Attack Production Deployment Script
# Usage: .\deploy-to-production.ps1

$SSH_KEY = "$env:USERPROFILE\.ssh\packattack-server"
$SERVER = "root@82.165.66.236"

Write-Host "=== Deploying Pack-Attack to production ===" -ForegroundColor Cyan

# Push local changes first
Write-Host "`n[1/2] Pushing to GitHub..." -ForegroundColor Yellow
git push origin main
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Git push failed. Resolve conflicts first." -ForegroundColor Red
    exit 1
}

# Deploy on server
Write-Host "`n[2/2] Deploying on server..." -ForegroundColor Yellow
ssh -i $SSH_KEY $SERVER "cd /var/www/packattack/app && git pull origin main && npm ci --production=false && npx prisma generate && npx prisma db push --accept-data-loss && npm run build && pm2 reload packattack --update-env && pm2 status"

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n=== Deployment successful! ===" -ForegroundColor Green
} else {
    Write-Host "`n=== Deployment failed! Check output above ===" -ForegroundColor Red
}
