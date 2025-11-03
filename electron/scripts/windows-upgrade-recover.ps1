# -------------------------------------------------------------------
# Remote.It Windows Upgrade Fix Script
# -------------------------------------------------------------------

$logPath = Join-Path (Get-Location).Path "remoteit_fix_upgrade.log"

function Set-Attribute {
    param (
        [string]$attributeName,
        [string]$attributeValue
    )
    Invoke-RestMethod -Uri "https://$env:GRAPHQL_API_PATH/job/attribute/$env:JOB_DEVICE_ID/$attributeName" `
        -Method Post -ContentType "text/plain" -Body $attributeValue
}

function Log {
    param ([string]$message)
    Add-Content -Path $logPath -Value $message
}

Log "=== Script start $(Get-Date) ==="

$timestamp = (Get-Date).ToString("o")

try {
    Log "Searching for Remote.It uninstall key..."

    $uninstallKey = Get-ChildItem HKLM:\Software\Microsoft\Windows\CurrentVersion\Uninstall,
                                   HKLM:\Software\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall |
        Get-ItemProperty |
        Where-Object { $_.Publisher -eq "Remote.It" -and $_.DisplayName -like "Remote.It*" } |
        Select-Object -First 1

    if (-not $uninstallKey) { throw "Could not locate Remote.It in registry" }

    $installDir = Split-Path $uninstallKey.DisplayIcon
    $yamlPath = Join-Path $installDir "resources\app-update.yml"
    $backupPath = $yamlPath + ".bak"

    Log "InstallDir: $installDir"
    Log "YAML Path: $yamlPath"

    if (-not (Test-Path $yamlPath)) {
        throw "app-update.yml not found"
    }

    Log "Backing up YAML..."
    Copy-Item $yamlPath $backupPath -Force

    $content = Get-Content $yamlPath -Raw

    # REMOVE EXACT BLOCK
    $pattern = "(?ms)^publisherName:\s*\n\s*-\s*'.*'\r?\n?"
    $contentModified = [Regex]::Replace($content, $pattern, "")

    if ($content -ne $contentModified) {
        Log "publisherName block removed ✅"
    } else {
        Log "publisherName block not found — already fixed?"
    }

    # Force write even if read-only
    Set-Content -Path $yamlPath -Value $contentModified -Encoding UTF8 -Force
    Log "Wrote modified file"

    # Validate change
    $validate = Get-Content $yamlPath -Raw
    if ($validate -match "publisherName") {
        Copy-Item $backupPath $yamlPath -Force
        throw "publisherName STILL present after modification"
    }

    Remove-Item $backupPath -Force
    Log "Backup cleaned — SUCCESS ✅"

    Set-Attribute "fixResult" "success"
    Set-Attribute "installDir" $installDir
    Set-Attribute "timestamp" $timestamp
    Set-Attribute "logFile" $logPath

} catch {
    $err = $_.Exception.Message
    Log "❌ Error: $err"

    if (Test-Path $backupPath) {
        Copy-Item $backupPath $yamlPath -Force
        Log "Backup restored after failure"
    }

    Set-Attribute "fixResult" "error"
    Set-Attribute "errorMessage" $err
    Set-Attribute "timestamp" $timestamp
    Set-Attribute "logFile" $logPath
}

Log "=== Script end ==="
exit 0
