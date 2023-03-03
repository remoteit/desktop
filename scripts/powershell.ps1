
# remove remoteit machine env vars
[Environment]::SetEnvironmentVariable('PATH', (([Environment]::GetEnvironmentVariable('PATH', 'Machine')).Split(';') | Where-Object { ($_ -notlike '*\remoteit*') -and ($_ -ne '') }) -join ';', 'Machine')

# remove remoteit user env vars
[Environment]::SetEnvironmentVariable('PATH', (([Environment]::GetEnvironmentVariable('PATH', 'User')).Split(';') | Where-Object { ($_ -notlike '*\remoteit*') -and ($_ -ne '') }) -join ';', 'User')

# display env vars
[Environment]::GetEnvironmentVariable("PATH", "Machine")
[Environment]::GetEnvironmentVariable("PATH", "User")

# preview removal logic
$newPath = @()
$existingPath = [Environment]::GetEnvironmentVariable('PATH', [EnvironmentVariableTarget]::Machine).Split(';')

foreach ($path in $existingPath) {
    if (($path -notlike '*\remoteit*') -and ($path -ne '')) {
        $newPath += $path
    }
    else {
        $newPath += "--------- Excluded Path: $path -------------"
    }
}

Write-Output ($newPath -join "`r`n")


# preview set
Write-Output((([Environment]::GetEnvironmentVariable('PATH', [EnvironmentVariableTarget]::Machine)).Split(';') | Where-Object { ($_ -notlike '*\remoteit*') -and ($path -ne '') }) -join ';')
