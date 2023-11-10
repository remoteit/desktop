
# Set window title variable
$windowTitle = "My Window Title"

# Check if Remote.It agent is in the path
if ((Get-Command remoteit.exe).Path.Contains('resources')) {
  $remoteitPath = (Get-Command remoteit.exe).Path

  # Display status window
  Add-Type -AssemblyName System.Windows.Forms
  [System.Windows.Forms.MessageBox]::Show('Please wait while we stop the Remote.It system service...', $windowTitle, [System.Windows.Forms.MessageBoxButtons]::OK, [System.Windows.Forms.MessageBoxIcon]::Information)
  [System.Windows.Forms.Form]::Activate()

  # Stop Remote.It agent
  & $remoteitPath agent uninstall

  # Close status window
  Get-Process | Where-Object { $_.MainWindowTitle -eq $windowTitle } | ForEach-Object { $_.CloseMainWindow() }
  exit 1
}
else {
  Write-Output "Remote.It agent not found."
  exit 0
}
