!include FileFunc.nsh
!include StrFunc.nsh
!include x64.nsh
!include WinVer.nsh
!include LogicLib.nsh
!define REMOTEIT_BACKUP "$PROFILE\AppData\Local\remoteit-backup"
!define PKGVERSION "3.16.0-alpha.7"
!define LOGNAME "remoteit.log"

Var InstallLocationToRemove

!macro preInit
    !insertmacro openLogFile

    FileWrite $8 "$\r$\nPreInit ${PKGVERSION} (${__DATE__} ${__TIME__})$\r$\n"

    SetRegView 64
    ReadRegStr $1 HKLM "${INSTALL_REGISTRY_KEY}" InstallLocation
    FileWrite $8 "64 installation dir: $1 $\r$\n"
    !insertmacro RemovePathBasename 'sixfour' $1 $2

    ${if} $2 == ""
        SetRegView 32
        ReadRegStr $1 HKLM "${INSTALL_REGISTRY_KEY}" InstallLocation
        FileWrite $8 "32 installation dir: $1 $\r$\n"
        !insertmacro RemovePathBasename 'threetwo' $1 $2
        ${ifNot} $2 == ""
            FileWrite $8 "Change 32 installation dir: $1 -> $2\Remote.It $\r$\n"
            WriteRegExpandStr HKLM "${INSTALL_REGISTRY_KEY}" InstallLocation "$2\Remote.It"
            StrCpy $InstallLocationToRemove $1
        ${endIf}
    ${else}
        FileWrite $8 "Change 64 installation dir: $1 -> $2\Remote.It $\r$\n"
        WriteRegExpandStr HKLM "${INSTALL_REGISTRY_KEY}" InstallLocation "$2\Remote.It"
        StrCpy $InstallLocationToRemove $1
    ${endIf}
!macroend

!macro customInstall
    !insertmacro openLogFile

    FileWrite $8 "$\r$\nInstall ${PKGVERSION} (${__DATE__} ${__TIME__})$\r$\n"
    FileWrite $8 "Installing Service$\r$\n"

    !insertmacro uninstallAgent $8

    ; Install agent
    !insertmacro execCommand '"$INSTDIR\resources\remoteit.exe" agent install'
    
    FileWrite $8 "Setting PATH ... $\r$\n"

    ; REMOVE AFTER v3.16.x -- Remove from machine path env var incase already there
    !insertmacro execCommand "powershell [Environment]::SetEnvironmentVariable('PATH', (([Environment]::GetEnvironmentVariable('PATH', 'Machine')).Split(';') | Where-Object { ($$_ -notlike '*\remoteit*') -and ($$_ -ne '') }) -join ';', 'Machine')"

    ; REMOVE AFTER v3.16.x -- Remove from user path env var incase already there
    !insertmacro execCommand "powershell [Environment]::SetEnvironmentVariable('PATH', (([Environment]::GetEnvironmentVariable('PATH', 'User')).Split(';') | Where-Object { ($$_ -notlike '*\remoteit*') -and ($$_ -ne '') }) -join ';', 'User')"

    ; Add to path env var
    !insertmacro execCommand "powershell [Environment]::SetEnvironmentVariable('PATH',[Environment]::GetEnvironmentVariable('PATH', [EnvironmentVariableTarget]::Machine) + ';$INSTDIR\resources', [EnvironmentVariableTarget]::Machine)"
    FileWrite $8 "DONE $\r$\n"

    ; REMOVE AFTER v3.16.x
    ${ifNot} $InstallLocationToRemove == ""
        FileWrite $8 "$\r$\nRemoving old installation... "
        RMDir /r $InstallLocationToRemove
        FileWrite $8 "DONE$\r$\n"
    ${endIf}

    FileWrite $8 "End Install$\r$\n"
    FileClose $8
!macroend

!macro customRemoveFiles
    !insertmacro openLogFile

    FileWrite $8 "Start Remove Files ${PKGVERSION} (${__DATE__} ${__TIME__})$\r$\n"

    ; Detect auto-update
    ${if} ${IsUpdated}
        FileWrite $8 "Is an update, don't remove config.$\r$\n"
    ${else}
        IfFileExists "$APPDATA\remoteit\config.json" config_found config_not_found
        config_found:
            FileWrite $8 "Config found$\r$\n"
            
            !insertmacro execCommand 'powershell (Get-Content -Raw -Path $APPDATA\remoteit\config.json | ConvertFrom-Json).device.uid.length'
            
            IntCmp $1 0 notDevice notDevice thereIsDevice
                notDevice:
                    ;MessageBox MB_OK "Not device installed"
                    FileWrite $8 "Device not registered$\r$\n"
                    Goto done
                thereIsDevice:
                    MessageBox MB_YESNO|MB_DEFBUTTON2 "Would you like to unregister your device?" IDYES true IDNO false
                    true:
                        FileWrite $8 "...unregister your device: YES$\r$\n"

                        !insertmacro execCommand '"$INSTDIR\resources\remoteit.exe" unregister --yes'

                        ; Waits for unregister to complete
                        !insertmacro execCommand '"$INSTDIR\resources\remoteit.exe" status'

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
    ${endIf}

    FileWrite $8 "Uninstalling...$\r$\n"

    !insertmacro execCommand '"$INSTDIR\resources\remoteit.exe" agent uninstall'
    
    ; Only remove from machine path env var since that's all that's been set here
    !insertmacro execCommand "powershell [Environment]::SetEnvironmentVariable('PATH', (([Environment]::GetEnvironmentVariable('PATH', 'Machine')).Split(';') | Where-Object { ($$_ -notlike '*\remoteit*') -and ($$_ -ne '') }) -join ';', 'Machine')"

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
    !insertmacro execCommand 'powershell (Get-Command remoteit.exe).Path.Contains("resources")'
    
    ; Remove trailing line break from $1
    StrCpy $1 $1 -1

    FileWrite $8 "Is agent installed? '$1'$\r$\n"

    ${if} $1 == "True"
        ; Non blocking message box
        nsExec::Exec 'cmd /c start /min powershell -WindowStyle Hidden -Command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.MessageBox]::Show($\'Please wait while we stop the Remote.It system service...$\', $\'$6$\', [System.Windows.Forms.MessageBoxButtons]::OK, [System.Windows.Forms.MessageBoxIcon]::Information); [System.Windows.Forms.Form]::Activate()"'

        ; Stop the agent
        FileWrite $8 "Stopping Old Service$\r$\n"

        ; Remove agent via path at startup to access old binary
        !insertmacro execCommand "remoteit.exe agent uninstall"

        ; Close the installing window
        nsExec::Exec 'powershell -Command "Get-Process | Where-Object { $$_.MainWindowTitle -eq $\'$6$\' } | ForEach-Object { $$_.CloseMainWindow() }"'
    ${else}
        ; If the output is not "True", do this command
        FileWrite $8 "Service not found$\r$\n"
    ${endIf}
!macroend

!macro execCommand command
    FileWrite $8 "${command}$\r$\n"
    nsExec::ExecToStack ${command}
    Pop $0
    Pop $1
    FileWrite $8 "Result: [$0] $1$\r$\n"
!macroend

!macro openLogFile
    IfFileExists "$TEMP\${LOGNAME}" logFound logNotFound
    logFound:
        FileOpen $8 "$TEMP\${LOGNAME}" a
        FileSeek $8 0 END
        goto logFoundEnd
    logNotFound:
        FileOpen $8 "$TEMP\${LOGNAME}" w
    logFoundEnd:
!macroend

!macro RemovePathBasename prefix input output
    StrCpy ${output} ""
    ; Don't include the trailing backslash
    StrCpy $3 -1 

    ; Find the last backslash in the path
    ${prefix}loop:
        IntOp $3 $3 - 1
        StrCpy $4 ${input} 1 $3
        StrCmp $4 "" ${prefix}exit
        StrCmp $4 "\" ${prefix}found
        Goto ${prefix}loop

    ${prefix}found:
        StrLen $2 ${input}
        IntOp $2 $2 + $3
        StrCpy ${output} ${input} $3

    ${prefix}exit:
!macroend

; test:
; npm run copy-install && npm run build-electron
