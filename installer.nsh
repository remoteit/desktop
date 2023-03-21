!include FileFunc.nsh
!include StrFunc.nsh
!include x64.nsh
!include WinVer.nsh
!include LogicLib.nsh
!define REMOTEIT_BACKUP "$PROFILE\AppData\Local\remoteit-backup"
!define PKGVERSION "3.16.0-alpha.7"
!define LOGNAME "remoteit.log"

!macro customInit
    !insertmacro openLogFile
    Pop $8
    FileWrite $8 "$\r$\n$\r$\n________________________________________________$\r$\n"
    FileWrite $8 "Init ${PKGVERSION} (${__DATE__} ${__TIME__})$\r$\n"

    !insertmacro uninstallAgent $8

    ; create backup directory if doesn't exist
    FileWrite $8 "Starting Back up of config and connections ... "
    CreateDirectory "${REMOTEIT_BACKUP}"

    ; remove old backups so the move can occur
    Delete "${REMOTEIT_BACKUP}\config-${PKGVERSION}.json"
    RMDir /r "${REMOTEIT_BACKUP}\connections-${PKGVERSION}"

    ; copy the config file and connections to backup location ONLY MOVES IF EMPTY (protect against 2.9.2 uninstall bug)
    CopyFiles /SILENT "$APPDATA\remoteit\config.json" "${REMOTEIT_BACKUP}\config-${PKGVERSION}.json"
    CopyFiles /SILENT "$PROFILE\AppData\Local\remoteit\connections" "${REMOTEIT_BACKUP}\connections-${PKGVERSION}"
    FileWrite $8 "Init complete$\r$\n"
    FileClose $8
!macroend

!macro customUnInit
    !insertmacro openLogFile
    Pop $8
    FileWrite $8 "Uninstall Init ${PKGVERSION} (${__DATE__} ${__TIME__})$\r$\n"

    !insertmacro uninstallAgent $8

    FileWrite $8 "Uninstall Init complete$\r$\n"
    FileClose $8
!macroend

!macro customInstall
    !insertmacro openLogFile
    Pop $8
    FileWrite $8 "$\r$\nInstall ${PKGVERSION} (${__DATE__} ${__TIME__})$\r$\n"
    FileWrite $8 "Installing Service$\r$\n"

    ; Install agent
    StrCpy $7 '"$INSTDIR\resources\remoteit.exe" agent install'
    nsExec::ExecToStack $7
    Pop $0
    Pop $1
    FileWrite $8 "$7 [$0] $1"
    
    FileWrite $8 "Setting PATH ... $\r$\n"

    ; REMOVE AFTER v3.16.x -- Remove from machine path env var incase already there
    StrCpy $7 "powershell [Environment]::SetEnvironmentVariable('PATH', (([Environment]::GetEnvironmentVariable('PATH', 'Machine')).Split(';') | Where-Object { ($$_ -notlike '*\remoteit*') -and ($$_ -ne '') }) -join ';', 'Machine')"
    FileWrite $8 "$7$\r$\n"
    nsExec::ExecToStack $7
    Pop $0
    Pop $1
    FileWrite $8 "Result: [$0] $1$\r$\n"

    ; REMOVE AFTER v3.16.x -- Remove from user path env var incase already there
    StrCpy $7 "powershell [Environment]::SetEnvironmentVariable('PATH', (([Environment]::GetEnvironmentVariable('PATH', 'User')).Split(';') | Where-Object { ($$_ -notlike '*\remoteit*') -and ($$_ -ne '') }) -join ';', 'User')"
    FileWrite $8 "$7$\r$\n"
    nsExec::ExecToStack $7
    Pop $0
    Pop $1
    FileWrite $8 "Result: [$0] $1$\r$\n"

    ; Add to path env var
    StrCpy $7 "powershell [Environment]::SetEnvironmentVariable('PATH',[Environment]::GetEnvironmentVariable('PATH', [EnvironmentVariableTarget]::Machine) + ';$INSTDIR\resources', [EnvironmentVariableTarget]::Machine)"
    FileWrite $8 "$7$\r$\n"
    nsExec::ExecToStack $7
    Pop $0
    Pop $1
    FileWrite $8 "Result: [$0] $1$\r$\n"
    FileWrite $8 "DONE $\r$\n"

    ; REMOVE AFTER v3.16.x
    FileWrite $8 "$\r$\nRemoving deprecated binaries... "
    RMDir /r "$INSTDIR\resources\arm64"
    RMDir /r "$INSTDIR\resources\ia32"
    RMDir /r "$INSTDIR\resources\x64"
    RMDir /r "$INSTDIR\resources\x86"
    FileWrite $8 "DONE$\r$\n"

    FileWrite $8 "End Install$\r$\n"
    FileClose $8
!macroend

!macro customRemoveFiles
    !insertmacro openLogFile
    Pop $8
    FileWrite $8 "$\r$\nStart Remove Files ${PKGVERSION} (${__DATE__} ${__TIME__})$\r$\n"

    ; Detect auto-update
    ${If} ${IsUpdated}
        FileWrite $8 "$\r$\nIs an update, don't remove config.$\r$\n"
    ${Else}
        IfFileExists "$APPDATA\remoteit\config.json" config_found config_not_found
        config_found:
            FileWrite $8 "$\r$\nConfig found$\r$\n"
            StrCpy $6 'powershell (Get-Content -Raw -Path $APPDATA\remoteit\config.json | ConvertFrom-Json).device.uid.length'
            nsExec::ExecToStack $6
            Pop $0
            Pop $1
            FileWrite $8 "$6     [$0]  [$1] $\r$\n"
            IntCmp $1 0 notDevice notDevice thereIsDevice
                notDevice:
                    ;MessageBox MB_OK "Not device installed"
                    FileWrite $8 "Device not registered$\r$\n"
                    Goto done
                thereIsDevice:
                    MessageBox MB_YESNO|MB_DEFBUTTON2 "Would you like to unregister your device?" IDYES true IDNO false
                    true:
                        FileWrite $8 "...unregister your device: YES$\r$\n"

                        StrCpy $7 '"$INSTDIR\resources\remoteit.exe" unregister --yes'
                        nsExec::ExecToStack $7
                        Pop $0
                        Pop $1
                        FileWrite $8 "$7 [$0] $1"

                        ; Waits for unregister to complete
                        nsExec::ExecToStack '"$INSTDIR\resources\remoteit.exe" status'

                        MessageBox MB_OK "Your device was unregistered!"

                        RMDir /r "$APPDATA\remoteit"
                        FileWrite $8 "RMDir $APPDATA\remoteit$\r$\n"

                        RMDir /r "${REMOTEIT_BACKUP}"
                        FileWrite $8 "RMDir ${REMOTEIT_BACKUP}$\r$\n"

                        RMDir /r "$PROFILE\AppData\Local\remoteit"
                        FileWrite $8 "RMDir $PROFILE\AppData\Local\remoteit$\r$\n"

                        Goto next
                    false:
                        Goto next
                    next:
                    Goto done
            done:
            goto end_of_config
        config_not_found:
            FileWrite $8 "Device config not found$\r$\n"
        end_of_config:
    ${endif}

    FileWrite $8 "Uninstalling...$\r$\n"

    StrCpy $7 '"$INSTDIR\resources\remoteit.exe" agent uninstall'
    nsExec::ExecToStack $7
    Pop $0
    Pop $1      
    FileWrite $8 "$7 [$0] $1"
    
    ; Only remove from machine path env var since that's all that's been set here
    StrCpy $7 "powershell [Environment]::SetEnvironmentVariable('PATH', (([Environment]::GetEnvironmentVariable('PATH', 'Machine')).Split(';') | Where-Object { ($$_ -notlike '*\remoteit*') -and ($$_ -ne '') }) -join ';', 'Machine')"
    FileWrite $8 "$7$\r$\n"
    nsExec::ExecToStack $7
    Pop $0
    Pop $1
    FileWrite $8 "Result: [$0] $1"

    FileWrite $8 "$\r$\nRemoving installation directories... $\r$\n"
    FileWrite $8 "RMDir $INSTDIR$\r$\n"
    RMDir /r "$INSTDIR"
    FileWrite $8 "DONE$\r$\n"

    FileWrite $8 "End Remove Files$\r$\n"
    FileClose $8 
!macroend

!macro uninstallAgent $8
    ; Install window title
    StrCpy $6 "Remote.It Pre-Installation"

    ; Check if the agent is installed - must happen before uninstall because of name conflict with desktop app
    StrCpy $7 'powershell (Get-Command remoteit.exe).Path.Contains("resources")'
    nsExec::ExecToStack $7
    Pop $0
    Pop $1
    ${If} $1 == "True"
        ; Non blocking message box
        nsExec::Exec 'cmd /c start /min powershell -WindowStyle Hidden -Command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.MessageBox]::Show($\'Please wait while we stop the Remote.It system service...$\', $\'$6$\', [System.Windows.Forms.MessageBoxButtons]::OK, [System.Windows.Forms.MessageBoxIcon]::Information); [System.Windows.Forms.Form]::Activate()"'

        ; Stop the agent
        FileWrite $8 "Stopping Old Service$\r$\n"

        ; Remove agent via path at startup to access old binary
        StrCpy $7 "remoteit.exe agent uninstall"
        nsExec::ExecToStack $7
        Pop $0
        Pop $1
        FileWrite $8 "$7     [$0] $1"

        ; Close the installing window
        nsExec::Exec 'powershell -Command "Get-Process | Where-Object { $$_.MainWindowTitle -eq $\'$6$\' } | ForEach-Object { $$_.CloseMainWindow() }"'
    ${Else}
        ; If the output is not "True", do this command
        FileWrite $8 "Service not found$\r$\n"
    ${EndIf}
!macroend

!macro openLogFile
    IfFileExists "$TEMP\${LOGNAME}" custom_init_log_found custom_init_log_not_found
    custom_init_log_found:
        FileOpen $0 "$TEMP\${LOGNAME}" a
        FileSeek $0 0 END
        goto custom_init_log_end
    custom_init_log_not_found:
        FileOpen $0 "$TEMP\${LOGNAME}" w
    custom_init_log_end:
    Push $0
!macroend

; test:
; npm run copy-install && npm run build-electron
