!macro customUnInstall
    ExecWait '"C:\Program Files\remoteit-bin\remoteit.exe" -j uninstall --yes'
    RMDir /r "$APPDATA\remoteit"
    RMDir /r "C:\Program Files\remoteit-bin"
    RMDir /r "$PROFILE\AppData\Local\remoteit"
    MessageBox MB_OK "Your device was unregistered and all data successfully removed!" 
!macroend

