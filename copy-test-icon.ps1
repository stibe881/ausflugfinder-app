# Backup original icon
Copy-Item ".\assets\images\icon.png" ".\assets\images\icon-original-backup.png" -Force

# Copy test icon to replace current icon
$testIconPath = "C:\Users\stefa\.gemini\antigravity\brain\f4bd748b-0a88-4f9f-a5f9-ec4a21ce2b28\test_notification_icon_1766624459982.png"
Copy-Item $testIconPath ".\assets\images\icon.png" -Force

Write-Host "Icon backup created and test icon installed successfully!"
Write-Host "Original icon backed up to: assets/images/icon-original-backup.png"
Write-Host "Test icon now active at: assets/images/icon.png"
