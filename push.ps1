cd "c:\Users\faisa\ebook-pro-kilat"
Write-Host "Current branch: $(git rev-parse --abbrev-ref HEAD)"
Write-Host "Status:"
git status --short
Write-Host ""
Write-Host "Pushing to origin/main..."
$result = git push origin main
Write-Host $result
if ($LASTEXITCODE -eq 0) {
    Write-Host "Push successful!"
} else {
    Write-Host "Push failed with code $LASTEXITCODE"
}
