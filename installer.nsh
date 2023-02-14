!include FileFunc.nsh
!include x64.nsh
!include WinVer.nsh
!include LogicLib.nsh
!define REMOTEIT_BACKUP "$PROFILE\AppData\Local\remoteit-backup"
!define PKGVERSION "3.15.1"

!macro customInit
    IfFileExists "$TEMP\remoteit.log" file_found file_not_found
    file_found:
        FileOpen $8 "$TEMP\remoteit.log" a
        FileSeek $8 0 END
        goto end_of_test ;<== important for not continuing on the else branch
    file_not_found:
        FileOpen $8 "$TEMP\remoteit.log" w
    end_of_test:
    FileWrite $8 "$\r$\n$\r$\n________________________________________________$\r$\n"
    FileWrite $8 "Init ${PKGVERSION} (${__DATE__} ${__TIME__})$\r$\n"

    ; Find the platform and set install path
    ${If} ${RunningX64}
        ${If} ${IsNativeAMD64}
            ; x64
            FileWrite $8 "Platform X64$\r$\n"
            StrCpy $9 '$INSTDIR\resources\x64'
        ${ElseIf} ${IsNativeARM64}
            ; ARM64
            FileWrite $8 "Platform x86 or arm64$\r$\n"
            StrCpy $9 '$INSTDIR\resources\arm64'
        ${Else}
            ; Unknown architecture
            FileWrite $8 "Unknown architecture - using Platform X64$\r$\n"
            StrCpy $9 '$INSTDIR\resources\x64'
        ${EndIf}
    ${Else}
        ; x86 / ia32
        FileWrite $8 "Platform x86 or ia32$\r$\n"
        StrCpy $9 '$INSTDIR\resources\ia32'
    ${EndIf}

    ; Non blocking message box
    nsExec::Exec 'cmd /c start /min powershell -WindowStyle Hidden -Command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.MessageBox]::Show($\'Please wait while we stop the Remote.It system service...$\', $\'Remote.It Installer$\', [System.Windows.Forms.MessageBoxButtons]::OK, [System.Windows.Forms.MessageBoxIcon]::Information)"'

    ; Stop the agent
    FileWrite $8 "Stopping Service$\r$\n"
    nsExec::ExecToStack '"$9\remoteit.exe" agent uninstall' 

    ; create backup directory if doesn't exist
    FileWrite $8 "Starting Back up of config and connections ... "
    CreateDirectory "${REMOTEIT_BACKUP}"

    ; remove old backups so the move can occur
    Delete "${REMOTEIT_BACKUP}\config-${PKGVERSION}.json"
    RMDir /r  "${REMOTEIT_BACKUP}\connections-${PKGVERSION}"

    ; copy the config file and connections to backup location ONLY MOVES IF EMPTY (protect against 2.9.2 uninstall bug)
    CopyFiles /SILENT "$APPDATA\remoteit\config.json" "${REMOTEIT_BACKUP}\config-${PKGVERSION}.json"
    CopyFiles /SILENT "$PROFILE\AppData\Local\remoteit\connections" "${REMOTEIT_BACKUP}\connections-${PKGVERSION}"
    FileWrite $8 "Backup complete$\r$\n"
    FileClose $8
!macroend

!macro customInstall
    IfFileExists "$TEMP\remoteit.log" file_found file_not_found
    file_found:
        FileOpen $8 "$TEMP\remoteit.log" a
        FileSeek $8 0 END
        goto end_of_test ;<== important for not continuing on the else branch
    file_not_found:
        FileOpen $8 "$TEMP\remoteit.log" w
    end_of_test:
    FileWrite $8 "$\r$\nInstall ${PKGVERSION} (${__DATE__} ${__TIME__})$\r$\n"
    
    ; Find the platform and set install path
    ${If} ${RunningX64}
        ${If} ${IsNativeAMD64}
            ; x64
            FileWrite $8 "Platform X64$\r$\n"
            StrCpy $9 '$INSTDIR\resources\x64'
        ${ElseIf} ${IsNativeARM64}
            ; ARM64
            FileWrite $8 "Platform x86 or arm64$\r$\n"
            StrCpy $9 '$INSTDIR\resources\arm64'
        ${Else}
            ; Unknown architecture
            FileWrite $8 "Unknown architecture - using Platform X64$\r$\n"
            StrCpy $9 '$INSTDIR\resources\x64'
        ${EndIf}
    ${Else}
        ; x86 / ia32
        FileWrite $8 "Platform x86 or ia32$\r$\n"
        StrCpy $9 '$INSTDIR\resources\ia32'
    ${EndIf}

    ; Remove from path env var incase already there
    StrCpy $7 'powershell [Environment]::SetEnvironmentVariable("$\'PATH$\'",((([Environment]::GetEnvironmentVariable("$\'PATH$\'","$\'Machine$\'")).Split("$\';$\'") | Where-Object { $$_ -notlike "$\'*\remoteit\resources\*$\'" }) -join "$\';$\'"),"$\'Machine$\'")' 
    nsExec::ExecToStack $7
    Pop $0
    Pop $1
    FileWrite $8 "$7     [$0]  [$1]$\r$\n"

    ; Add to path env var
    StrCpy $7 'powershell [Environment]::SetEnvironmentVariable("$\'PATH$\'",[Environment]::GetEnvironmentVariable("$\'PATH$\'", [EnvironmentVariableTarget]::"$\'Machine$\'") + "$\';$9$\'",[EnvironmentVariableTarget]::"$\'Machine$\'")'
    nsExec::ExecToStack $7
    Pop $0
    Pop $1
    FileWrite $8 "$7     [$0]  [$1]$\r$\n"

    ; Remove agent just in case
    StrCpy $7 '"$9\remoteit.exe" agent uninstall'
    nsExec::ExecToStack $7
    Pop $0
    Pop $1
    FileWrite $8 "$7     [$0]  [$1]$\r$\n"

    ; Install agent
    StrCpy $7 '"$9\remoteit.exe" agent install'
    nsExec::ExecToStack $7
    Pop $0
    Pop $1
    FileWrite $8 "$7     [$0]  [$1]$\r$\n"
    
    FileWrite $8 "$\nEnd Install $\r$\n"
    FileClose $8
!macroend

!macro customRemoveFiles
    IfFileExists "$TEMP\remoteit.log" file_found_u file_not_found_u
    file_found_u:
        FileOpen $8 "$TEMP\remoteit.log" a
        FileSeek $8 0 END
        goto end_of_test_u ;<== important for not continuing on the else branch
    file_not_found_u:
        FileOpen $8 "$TEMP\remoteit.log" w
    end_of_test_u:
    FileWrite $8 "$\r$\nRemoveFiles ${PKGVERSION} (${__DATE__} ${__TIME__})$\r$\n"

    ; Find the platform and assign uninstall path
    ${If} ${RunningX64}
        ${If} ${IsNativeAMD64}
            ; x64
            FileWrite $8 "Platform X64$\r$\n"
            StrCpy $9 '$INSTDIR\resources\x64'
        ${ElseIf} ${IsNativeARM64}
            ; ARM64
            FileWrite $8 "Platform x86 or arm64$\r$\n"
            StrCpy $9 '$INSTDIR\resources\arm64'
        ${Else}
            ; Unknown architecture
            FileWrite $8 "Unknown architecture - using Platform X64$\r$\n"
            StrCpy $9 '$INSTDIR\resources\x64'
        ${EndIf}
    ${Else}
        ; x86 / ia32
        FileWrite $8 "Platform x86 or ia32$\r$\n"
        StrCpy $9 '$INSTDIR\resources\ia32'
    ${EndIf}

    ; Detect auto-update
    ${If} ${IsUpdated}
        FileWrite $8 "$\nUpdate ${PKGVERSION} (${__DATE__} ${__TIME__})$\r$\n"
    ${Else}
        FileWrite $8 "$\nUninstall ${PKGVERSION} (${__DATE__} ${__TIME__})$\r$\n"
        IfFileExists "$APPDATA\remoteit\config.json" config_found config_not_found

        config_found:
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

                        StrCpy $7 '"$9\remoteit.exe" unregister --yes'
                        nsExec::ExecToStack $7
                        Pop $0
                        Pop $1
                        FileWrite $8 "$7     [$0]  [$1]$\r$\n"

                        ; Waits for unregister to complete
                        nsExec::ExecToStack '"$9\remoteit.exe" status'

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

        StrCpy $7 '"$9\remoteit.exe" agent uninstall'
        nsExec::ExecToStack $7
        Pop $0
        Pop $1      
        FileWrite $8 "$7     [$0]  [$1]$\r$\n"
        
        ; Remove from path env var
        StrCpy $7 'powershell [Environment]::SetEnvironmentVariable("$\'PATH$\'",((([Environment]::GetEnvironmentVariable("$\'PATH$\'","$\'Machine$\'")).Split("$\';$\'") | Where-Object { $$_ -notlike "$\'*\remoteit\resources\*$\'" }) -join "$\';$\'"),"$\'Machine$\'")' 
        nsExec::ExecToStack $7
        Pop $0
        Pop $1
        FileWrite $8 "$7     [$0]  [$1]$\r$\n"

        RMDir /r "$INSTDIR"
        FileWrite $8 "RMDir $INSTDIR$\r$\n"
    ${endif}

    FileWrite $8 "$\r$\nEnd Remove Files$\r$\n$\r$\n"
    FileClose $8 
!macroend

; test:
; npm run copy-install && npm run build-electron

; test reset:
; rmdir /s %HOMEPATH%\AppData\Local\remoteit-backup && rmdir /s %HOMEPATH%\AppData\Local\remoteit && rmdir /s \ProgramData\remoteit

; switch to node installer:   
; nsExec::Exec '"$INSTDIR\resources\service\node.exe" "$INSTDIR\resources\service\src\install.js"'