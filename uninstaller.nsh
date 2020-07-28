!macro customUnInstall
    MessageBox MB_YESNO "Would you like to unregister your device?" IDNO false IDYES true
    true:
        ExecWait '"C:\Program Files\remoteit-bin\remoteit.exe" -j uninstall --yes'
        RMDir /r "$APPDATA\remoteit"
        MessageBox MB_OK "Your device was unregistered!" 
        Goto next
    false:
        ExecWait '"C:\Program Files\remoteit-bin\remoteit.exe" -j service uninstall'
        RMDir /r "$APPDATA\remoteit\log"
        Goto next
    next:
    RMDir /r "C:\Program Files\remoteit-bin"
    RMDir /r "$PROFILE\AppData\Local\remoteit"
    RMDir /r "$INSTDIR"
    MessageBox MB_OK "remote.it was successfully removed!" 
!macroend