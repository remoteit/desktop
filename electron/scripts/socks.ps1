param (
    [string]$path,
    [string]$proxy
)

# Import necessary functions from user32.dll
Add-Type @"
    using System;
    using System.Runtime.InteropServices;
    public class User32 {
        [DllImport("user32.dll", CharSet=CharSet.Auto)]
        public static extern IntPtr FindWindow(string lpClassName, string lpWindowName);
        [DllImport("user32.dll", CharSet=CharSet.Auto)]
        public static extern int SendMessage(IntPtr hWnd, int Msg, IntPtr wParam, IntPtr lParam);
    }
"@

# Constants for the window message
$WM_CLOSE = 0x0010

# Extract the process name from the browser path
$processName = [System.IO.Path]::GetFileNameWithoutExtension($path)

# Check if the browser is running
$browserProcesses = Get-Process -Name $processName -ErrorAction SilentlyContinue
if ($browserProcesses) {
    foreach ($process in $browserProcesses) {
        $hwnd = [User32]::FindWindow("Chrome_WidgetWin_1", $process.MainWindowTitle)
        if ($hwnd -ne [IntPtr]::Zero) {
            [User32]::SendMessage($hwnd, $WM_CLOSE, [IntPtr]::Zero, [IntPtr]::Zero)
        }
    }
    
    # Wait for the processes to close
    Start-Sleep -Seconds 2
}

if ($proxy) {
    # Start the browser with the proxy server
    Start-Process -FilePath $path -ArgumentList "--proxy-server=$proxy"
} else {
    # Start the browser without the proxy server
    Start-Process -FilePath $path
}
