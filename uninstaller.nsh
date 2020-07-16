!macro customUnInstall
    ExecWait '"C:\Program Files\remoteit-bin\remoteit.exe" -j service uninstall'
    ; RMDir /r "$APPDATA\remoteit"
    RMDir /r "C:\Program Files\remoteit-bin"
    RMDir /r "$PROFILE\AppData\Local\remoteit"
    RMDir /r "$INSTDIR"
    MessageBox MB_OK "Your device was unregistered and all data successfully removed!" 
!macroend

