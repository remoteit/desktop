!define CLI_VERSION "1.6.5"
!define PATH_REMOTE_DIR "C:\Program Files\remoteit-bin"
!define REMOTE_CLI_EXE "${PATH_REMOTE_DIR}\remoteit.exe" 

!macro customInstall
    Var /GLOBAL PLATFORM
    ${If} ${RunningX64}
        StrCpy $PLATFORM "remoteit_windows_x86_64.exe"
    ${Else}
        StrCpy $PLATFORM "remoteit_windows_x86.exe"
    ${EndIf}
    !define DOWNLOAD_URL_CLI "https://downloads.remote.it/cli/v${CLI_VERSION}/$PLATFORM" 
    !define DOWNLOAD_PATH_CLI "${PATH_REMOTE_DIR}\$PLATFORM"

    CreateDirectory "${PATH_REMOTE_DIR}"
    nsExec::Exec 'powershell (new-object System.Net.WebClient).DownloadFile\
    ($\'"${DOWNLOAD_URL_CLI}"$\', $\'"${DOWNLOAD_PATH_CLI}"$\') '
    Rename "${DOWNLOAD_PATH_CLI}" "${REMOTE_CLI_EXE}"
    nsExec::Exec 'powershell  "& ""${REMOTE_CLI_EXE}""  "'
    nsExec::Exec 'powershell  "& " "icacls $\'"${REMOTE_CLI_EXE}$\'" /T /C /Q /grant "*S-1-5-32-545:RX" '
    nsExec::Exec '"${REMOTE_CLI_EXE}" -j tools install --update' 
    nsExec::Exec '"${REMOTE_CLI_EXE}" -j service uninstall'
    nsExec::Exec '"${REMOTE_CLI_EXE}" -j service install'
!macroend

!macro customUnInstall
    MessageBox MB_YESNO|MB_DEFBUTTON2 "Would you like to unregister your device?" IDYES true IDNO false
    true:
        nsExec::Exec '"${REMOTE_CLI_EXE}" -j uninstall --yes'
        RMDir /r "$APPDATA\remoteit"
        MessageBox MB_OK "Your device was unregistered!" 
        Goto next
    false:
        nsExec::Exec '"${REMOTE_CLI_EXE}" -j service uninstall'
        nsExec::Exec '"${REMOTE_CLI_EXE}" -j status' ; waits for processes to stop so can cleanly remove files
        RMDir /r "$APPDATA\remoteit\log"
        Goto next
    next:
    RMDir /r "${PATH_REMOTE_DIR}"
    RMDir /r "$PROFILE\AppData\Local\remoteit"
    RMDir /r "$INSTDIR"
!macroend