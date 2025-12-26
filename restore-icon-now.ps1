# Restore the original icon from backup
$backupPath = ".\assets\images\icon-original-backup.png"
$iconPath = ".\assets\images\icon.png"

if (Test-Path $backupPath) {
    Copy-Item $backupPath $iconPath -Force
    Write-Host "✅ Original icon restored from backup!"
}
else {
    Write-Host "❌ ERROR: Backup file not found at $backupPath"
    Write-Host "Please manually restore your original icon."
}
