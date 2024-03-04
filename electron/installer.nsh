!include FileFunc.nsh
!include StrFunc.nsh
!include x64.nsh
!include WinVer.nsh
!include LogicLib.nsh
!define LOGNAME "remoteit.log"

Var InstallLocationToRemove
Var FileHandle

!macro preInit
    !insertmacro openLogFile "PreInit"

    SetRegView 64
    ReadRegStr $1 HKLM "${INSTALL_REGISTRY_KEY}" InstallLocation
    FileWrite $FileHandle "64bit installation dir: $1 $\r$\n"
    !insertmacro RemovePathBasename $1 $2

    ${if} $2 == ""
        SetRegView 32
        ReadRegStr $1 HKLM "${INSTALL_REGISTRY_KEY}" InstallLocation
        FileWrite $FileHandle "32bit installation dir: $1 $\r$\n"
        !insertmacro RemovePathBasename $1 $2

        ${ifNot} $2 == ""
            ${if} "$2\${PRODUCT_FILENAME}" == $1
                FileWrite $FileHandle "Same 32bit installation dir: $1 $\r$\n"
            ${else}
                FileWrite $FileHandle "Change 32bit installation dir: $1 -> $2\${PRODUCT_FILENAME} $\r$\n"
                WriteRegExpandStr HKLM "${INSTALL_REGISTRY_KEY}" InstallLocation "$2\${PRODUCT_FILENAME}"
                StrCpy $InstallLocationToRemove $1
            ${endIf}
        ${endIf}

    ${else}
        ${if} "$2\${PRODUCT_FILENAME}" == $1
            FileWrite $FileHandle "Same 64bit installation dir: $1 $\r$\n"
        ${else}
            FileWrite $FileHandle "Change 64bit installation dir: $1 -> $2\${PRODUCT_FILENAME} $\r$\n"
            WriteRegExpandStr HKLM "${INSTALL_REGISTRY_KEY}" InstallLocation "$2\${PRODUCT_FILENAME}"
            StrCpy $InstallLocationToRemove $1
        ${endIf}
    ${endIf}

    ${ifNot} $InstallLocationToRemove == ""
        FileWrite $FileHandle "Old installation marked for removal: $InstallLocationToRemove $\r$\n"
    ${endIf}
    
    FileWrite $FileHandle "End PreInit $\r$\n"
    FileClose $FileHandle
!macroend

!macro customInstall
    !insertmacro openLogFile "CustomInstall"

    ; Remove any old agents
    !insertmacro uninstallAnyAgent

    ; Install new agent
    FileWrite $FileHandle "Installing Agent ... $\r$\n"
    !insertmacro logExec "$\"$INSTDIR\resources\remoteit$\" agent install"
    
    ; REMOVE AFTER v3.16.x -- Remove from machine path env var incase already there
    FileWrite $FileHandle "Cleaning up old PATH ... $\r$\n"
    !insertmacro logPowershell "[Environment]::SetEnvironmentVariable('PATH', (([Environment]::GetEnvironmentVariable('PATH', 'Machine')).Split(';') | Where-Object { ($$_ -notlike '*\remoteit*') -and ($$_ -ne '') }) -join ';', 'Machine')"
    !insertmacro logPowershell "[Environment]::SetEnvironmentVariable('PATH', (([Environment]::GetEnvironmentVariable('PATH', 'User')).Split(';') | Where-Object { ($$_ -notlike '*\remoteit*') -and ($$_ -ne '') }) -join ';', 'User')"

    ; Add to path env var
    FileWrite $FileHandle "Setting PATH ... $\r$\n"
    !insertmacro logPowershell "[Environment]::SetEnvironmentVariable('PATH',[Environment]::GetEnvironmentVariable('PATH', [EnvironmentVariableTarget]::Machine) + ';$INSTDIR\resources', [EnvironmentVariableTarget]::Machine)"
    
    ; REMOVE AFTER v3.16.x
    ${ifNot} $InstallLocationToRemove == ""
        FileWrite $FileHandle "$\r$\nRemoving old installation... "
        RMDir /r $InstallLocationToRemove
        FileWrite $FileHandle "DONE$\r$\n"
    ${endIf}

    FileWrite $FileHandle "End CustomInstall$\r$\n"
    FileClose $FileHandle
!macroend

!macro customRemoveFiles
    !insertmacro openLogFile "CustomRemoveFiles"

    ; Detect update (auto or manual)
    ${if} ${IsUpdated}
        FileWrite $FileHandle "Updating... do not check for registered device.$\r$\n"
    ${else}
        FileWrite $FileHandle "Uninstalling...$\r$\n"

        IfFileExists "$APPDATA\remoteit\config.json" config_found config_not_found
        config_found:
            FileWrite $FileHandle "Config found$\r$\n"
            
            !insertmacro logPowershell "(Get-Content -Raw -Path $APPDATA\remoteit\config.json | ConvertFrom-Json).device.uid.length"
            
            IntCmp $1 0 notDevice notDevice thereIsDevice
                notDevice:
                    FileWrite $FileHandle "Device not registered$\r$\n"
                    Goto done
                thereIsDevice:
                    MessageBox MB_YESNO|MB_DEFBUTTON2 "Would you like to unregister your device?" IDYES true IDNO false
                    true:
                        FileWrite $FileHandle "YES unregister device...$\r$\n"

                        !insertmacro logExec "$\"$INSTDIR\resources\remoteit$\" unregister --yes"

                        MessageBox MB_OK "Your device has been unregistered."

                        ; This should be done before removing the app data folder
                        !insertmacro logExec "$\"$INSTDIR\resources\remoteit$\" agent uninstall"

                        FileWrite $FileHandle "RMDir $APPDATA\remoteit$\r$\n"
                        RMDir /r "$APPDATA\remoteit"

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

        ; Remove app data
        FileWrite $FileHandle "RMDir $PROFILE\AppData\Local\remoteit$\r$\n"
        RMDir /r "$PROFILE\AppData\Local\remoteit"
    ${endIf}

    ; Remove agent
    !insertmacro logExec "$\"$INSTDIR\resources\remoteit$\" agent uninstall"
    
    ; Remove from path env var
    !insertmacro logPowershell "[Environment]::SetEnvironmentVariable('PATH', (([Environment]::GetEnvironmentVariable('PATH', 'Machine')).Split(';') | Where-Object { ($$_ -notlike '*\${PRODUCT_FILENAME}*') -and ($$_ -ne '') }) -join ';', 'Machine')"

    ; Remove files
    FileWrite $FileHandle "$\r$\nRemoving installation directories... $\r$\n"
    FileWrite $FileHandle "RMDir $INSTDIR$\r$\n"
    RMDir /r "$INSTDIR"

    FileWrite $FileHandle "End CustomRemoveFiles$\r$\n"
    FileClose $FileHandle 
!macroend

; *******************************************
;
;    Custom macros
;
; *******************************************

!macro uninstallAnyAgent
    ; Install window title
    StrCpy $6 "Remote.It Agent Uninstall"

    ; Check if the agent is installed - must happen before uninstall because of name conflict with desktop app
    !insertmacro logPowershell "(Get-Command remoteit).Path.Contains('resources')"
    
    ; Remove trailing line break from $1
    StrCpy $1 $1 -2

    FileWrite $FileHandle "Is agent installed? '$1'$\r$\n"

    ${if} $1 == "True"
        ; Non blocking message box
        nsExec::Exec 'cmd /c start /min powershell -WindowStyle Hidden -Command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.MessageBox]::Show($\'Please wait while we stop the Remote.It system service...$\', $\'$6$\', [System.Windows.Forms.MessageBoxButtons]::OK, [System.Windows.Forms.MessageBoxIcon]::Information); [System.Windows.Forms.Form]::Activate()"'

        ; Stop the agent
        FileWrite $FileHandle "Stopping Old Service$\r$\n"

        ; Remove agent via path at startup to access old binary
        !insertmacro logExec "remoteit agent uninstall"

        ; Close the installing window
        nsExec::Exec 'powershell -Command "Get-Process | Where-Object { $$_.MainWindowTitle -eq $\'$6$\' } | ForEach-Object { $$_.CloseMainWindow() }"'
    ${else}
        ; If the output is not "True", do this command
        FileWrite $FileHandle "Agent not found in path.$\r$\n"
    ${endIf}
!macroend

!macro logPowershell command
    !insertmacro logExec "powershell -NoProfile -ExecutionPolicy Bypass -Command $\"${command}$\""
!macroend

!macro logExec command
    FileWrite $FileHandle "Command: ${command} $\r$\n"
    nsExec::ExecToStack "${command}"
    Pop $0
    Pop $1
    FileWrite $FileHandle "Result Code: $0$\r$\n"
    FileWrite $FileHandle "Result Output: $1$\r$\n"
!macroend

!macro openLogFile section
    IfFileExists "$TEMP\${LOGNAME}" logFound logNotFound
    logFound:
        FileOpen $FileHandle "$TEMP\${LOGNAME}" a
        FileSeek $FileHandle 0 END
        goto logFoundEnd
    logNotFound:
        FileOpen $FileHandle "$TEMP\${LOGNAME}" w
    logFoundEnd:

    FileWrite $FileHandle "$\r$\nStart ${section} ${VERSION} (${__DATE__} ${__TIME__}) $\r$\n"
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
