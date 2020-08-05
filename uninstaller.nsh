!macro customUnInstall
    MessageBox MB_YESNO|MB_DEFBUTTON2 "Would you like to unregister your device?" IDYES true IDNO false
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
!macroend