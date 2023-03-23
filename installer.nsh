!include FileFunc.nsh
!include StrFunc.nsh
!include x64.nsh
!include WinVer.nsh
!include LogicLib.nsh
!define REMOTEIT_BACKUP "$PROFILE\AppData\Local\remoteit-backup"
!define PKGVERSION "3.16.0-alpha.7"
!define LOGNAME "remoteit.log"

Var InstallLocationToRemove
Var FileHandle

!macro preInit
    !insertmacro openLogFile

    FileWrite $FileHandle "$\r$\nPreInit ${PKGVERSION} (${__DATE__} ${__TIME__})$\r$\n"
    FileWrite $FileHandle "product filename: ${PRODUCT_FILENAME} $\r$\n"
    FileWrite $FileHandle "version: ${VERSION} $\r$\n"

    SetRegView 64
    ReadRegStr $1 HKLM "${INSTALL_REGISTRY_KEY}" InstallLocation
    FileWrite $FileHandle "64 installation dir: $1 $\r$\n"
    !insertmacro RemovePathBasename $1 $2

    ${if} $2 == ""
        SetRegView 32
        ReadRegStr $1 HKLM "${INSTALL_REGISTRY_KEY}" InstallLocation
        FileWrite $FileHandle "32 installation dir: $1 $\r$\n"
        !insertmacro RemovePathBasename $1 $2

        ${ifNot} $2 == ""
            FileWrite $FileHandle "Change 32 installation dir: $1 -> $2\Remote.It $\r$\n"
            WriteRegExpandStr HKLM "${INSTALL_REGISTRY_KEY}" InstallLocation "$2\Remote.It"
            StrCpy $InstallLocationToRemove $1
        ${endIf}
    ${else}
        FileWrite $FileHandle "Change 64 installation dir: $1 -> $2\Remote.It $\r$\n"
        WriteRegExpandStr HKLM "${INSTALL_REGISTRY_KEY}" InstallLocation "$2\Remote.It"
        StrCpy $InstallLocationToRemove $1
    ${endIf}
!macroend

!macro customInstall
    !insertmacro openLogFile

    FileWrite $FileHandle "$\r$\nInstall ${PKGVERSION} (${__DATE__} ${__TIME__})$\r$\n"
    FileWrite $FileHandle "Installing Service$\r$\n"

    !insertmacro uninstallAgent

    ; Install agent
    !insertmacro logExec '"$INSTDIR\resources\remoteit.exe" agent install'
    
    FileWrite $FileHandle "Setting PATH ... $\r$\n"

    ; REMOVE AFTER v3.16.x -- Remove from machine path env var incase already there
    !insertmacro logExec "powershell [Environment]::SetEnvironmentVariable('PATH', (([Environment]::GetEnvironmentVariable('PATH', 'Machine')).Split(';') | Where-Object { ($$_ -notlike '*\remoteit*') -and ($$_ -ne '') }) -join ';', 'Machine')"

    ; REMOVE AFTER v3.16.x -- Remove from user path env var incase already there
    !insertmacro logExec "powershell [Environment]::SetEnvironmentVariable('PATH', (([Environment]::GetEnvironmentVariable('PATH', 'User')).Split(';') | Where-Object { ($$_ -notlike '*\remoteit*') -and ($$_ -ne '') }) -join ';', 'User')"

    ; Add to path env var
    !insertmacro logExec "powershell [Environment]::SetEnvironmentVariable('PATH',[Environment]::GetEnvironmentVariable('PATH', [EnvironmentVariableTarget]::Machine) + ';$INSTDIR\resources', [EnvironmentVariableTarget]::Machine)"
    FileWrite $FileHandle "DONE $\r$\n"

    ; REMOVE AFTER v3.16.x
    ${ifNot} $InstallLocationToRemove == ""
        FileWrite $FileHandle "$\r$\nRemoving old installation... "
        RMDir /r $InstallLocationToRemove
        FileWrite $FileHandle "DONE$\r$\n"
    ${endIf}

    FileWrite $FileHandle "End Install$\r$\n"
    FileClose $FileHandle
!macroend

!macro customRemoveFiles
    !insertmacro openLogFile

    FileWrite $FileHandle "Start Remove Files ${PKGVERSION} (${__DATE__} ${__TIME__})$\r$\n"

    ; Detect auto-update
    ${if} ${IsUpdated}
        FileWrite $FileHandle "Is an update, don't remove config.$\r$\n"
    ${else}
        IfFileExists "$APPDATA\remoteit\config.json" config_found config_not_found
        config_found:
            FileWrite $FileHandle "Config found$\r$\n"
            
            !insertmacro logExec "powershell (Get-Content -Raw -Path $APPDATA\remoteit\config.json | ConvertFrom-Json).device.uid.length"
            
            IntCmp $1 0 notDevice notDevice thereIsDevice
                notDevice:
                    ;MessageBox MB_OK "Not device installed"
                    FileWrite $FileHandle "Device not registered$\r$\n"
                    Goto done
                thereIsDevice:
                    MessageBox MB_YESNO|MB_DEFBUTTON2 "Would you like to unregister your device?" IDYES true IDNO false
                    true:
                        FileWrite $FileHandle "...unregister your device: YES$\r$\n"

                        !insertmacro logExec '"$INSTDIR\resources\remoteit.exe" unregister --yes'

                        ; Waits for unregister to complete
                        !insertmacro logExec '"$INSTDIR\resources\remoteit.exe" status'

                        MessageBox MB_OK "Your device was unregistered!"

                        RMDir /r "$APPDATA\remoteit"
                        FileWrite $FileHandle "RMDir $APPDATA\remoteit$\r$\n"

                        RMDir /r "${REMOTEIT_BACKUP}"
                        FileWrite $FileHandle "RMDir ${REMOTEIT_BACKUP}$\r$\n"

                        RMDir /r "$PROFILE\AppData\Local\remoteit"
                        FileWrite $FileHandle "RMDir $PROFILE\AppData\Local\remoteit$\r$\n"

                        Goto next
                    false:
                        Goto next
                    next:
                    Goto done
            done:
            goto end_of_config
        config_not_found:
            FileWrite $FileHandle "Device config not found$\r$\n"
        end_of_config:
    ${endIf}

    FileWrite $FileHandle "Uninstalling...$\r$\n"

    !insertmacro logExec '"$INSTDIR\resources\remoteit.exe" agent uninstall'
    
    ; Only remove from machine path env var since that's all that's been set here
    !insertmacro logExec "powershell [Environment]::SetEnvironmentVariable('PATH', (([Environment]::GetEnvironmentVariable('PATH', 'Machine')).Split(';') | Where-Object { ($$_ -notlike '*\remoteit*') -and ($$_ -ne '') }) -join ';', 'Machine')"

    FileWrite $FileHandle "$\r$\nRemoving installation directories... $\r$\n"
    FileWrite $FileHandle "RMDir $INSTDIR$\r$\n"
    RMDir /r "$INSTDIR"
    FileWrite $FileHandle "DONE$\r$\n"

    FileWrite $FileHandle "End Remove Files$\r$\n"
    FileClose $FileHandle 
!macroend

; *******************************************
; Custom macros
; *******************************************

!macro uninstallAgent
    ; Install window title
    StrCpy $6 "Remote.It Pre-Installation"

    ; Check if the agent is installed - must happen before uninstall because of name conflict with desktop app
    !insertmacro logExec 'powershell (Get-Command remoteit.exe).Path.Contains("resources")'
    
    ; Remove trailing line break from $1
    StrCpy $1 $1 -1

    FileWrite $FileHandle "Is agent installed? '$1'$\r$\n"

    ${if} $1 == "True"
        ; Non blocking message box
        nsExec::Exec 'cmd /c start /min powershell -WindowStyle Hidden -Command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.MessageBox]::Show($\'Please wait while we stop the Remote.It system service...$\', $\'$6$\', [System.Windows.Forms.MessageBoxButtons]::OK, [System.Windows.Forms.MessageBoxIcon]::Information); [System.Windows.Forms.Form]::Activate()"'

        ; Stop the agent
        FileWrite $FileHandle "Stopping Old Service$\r$\n"

        ; Remove agent via path at startup to access old binary
        !insertmacro logExec "remoteit.exe agent uninstall"

        ; Close the installing window
        nsExec::Exec 'powershell -Command "Get-Process | Where-Object { $$_.MainWindowTitle -eq $\'$6$\' } | ForEach-Object { $$_.CloseMainWindow() }"'
    ${else}
        ; If the output is not "True", do this command
        FileWrite $FileHandle "Service not found$\r$\n"
    ${endIf}
!macroend

!macro logExec command
    StrCpy $R0 "${command}$\r$\n"
    FileWrite $FileHandle "$R0 $\r$\n"
    nsExec::ExecToStack ${command}
    Pop $0
    Pop $1
    FileWrite $FileHandle "Result: [$0] $1$\r$\n"
!macroend

!macro openLogFile
    IfFileExists "$TEMP\${LOGNAME}" logFound logNotFound
    logFound:
        FileOpen $FileHandle "$TEMP\${LOGNAME}" a
        FileSeek $FileHandle 0 END
        goto logFoundEnd
    logNotFound:
        FileOpen $FileHandle "$TEMP\${LOGNAME}" w
    logFoundEnd:
!macroend

!macro RemovePathBasename input output
    !define ID ${__LINE__}

    StrCpy ${output} ""
    ; Don't include the trailing backslash
    StrCpy $3 -1 

    ; Find the last backslash in the path
    loop${ID}:
        IntOp $3 $3 - 1
        StrCpy $4 ${input} 1 $3
        StrCmp $4 "" exit${ID}
        StrCmp $4 "\" found${ID}
        Goto loop${ID}

    found${ID}:
        StrLen $2 ${input}
        IntOp $2 $2 + $3
        StrCpy ${output} ${input} $3

    exit${ID}:

    !undef ID
!macroend

; test:
; npm run copy-install && npm run build-electron
