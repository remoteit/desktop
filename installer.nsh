!include FileFunc.nsh
!include x64.nsh
!include LogicLib.nsh
!define REMOTEIT_BACKUP "$PROFILE\AppData\Local\remoteit-backup"
!define PKGVERSION "3.15.0-alpha.0"

!macro customInit
    Var /GLOBAL path_i

    ; create backup directory if doesn't exist
    CreateDirectory "${REMOTEIT_BACKUP}"

    ; remove old backups so the move can occur
    Delete "${REMOTEIT_BACKUP}\config-${PKGVERSION}.json"
    RMDir /r  "${REMOTEIT_BACKUP}\connections-${PKGVERSION}"

    ; copy the config file and connections to backup location ONLY MOVES IF EMPTY (protect against 2.9.2 uninstall bug)
    CopyFiles /SILENT "$APPDATA\remoteit\config.json" "${REMOTEIT_BACKUP}\config-${PKGVERSION}.json"
    CopyFiles /SILENT "$PROFILE\AppData\Local\remoteit\connections" "${REMOTEIT_BACKUP}\connections-${PKGVERSION}"

    ; MessageBox MB_OK "Init: copied files" 
!macroend

!macro customInstall
    Var /GLOBAL ps_command
    Var /GLOBAL install_path
    Var /GLOBAL installLog
    Var /GLOBAL platform

    IfFileExists "$TEMP\remoteit.log" file_found file_not_found

    file_found:
        FileOpen $installLog "$TEMP\remoteit.log" a
        FileSeek $installLog 0 END
        goto end_of_test ;<== important for not continuing on the else branch
    file_not_found:
        FileOpen $installLog "$TEMP\remoteit.log" w
    end_of_test:

    FileWrite $installLog "$\nInstall ${PKGVERSION} (${__DATE__} ${__TIME__}): $\r$\n"
    FileWrite $installLog "-----------------------------$\r$\n"
    
    ; Find the platform
    System::Call 'kernel32::GetSystemInfo(i0)'
    System::Call 'kernel32::GetNativeSystemInfo(i0)'
    System::Call 'kernel32::GetSystemInfo(i.r1)'
    System::Call 'kernel32::GetNativeSystemInfo(i.r2)'
    ${If} $1 == 9
        ; ARM64
        FileWrite $installLog "- Platform x86 or arm64$\r$\n"
        StrCpy $install_path '$INSTDIR\resources\arm64'
    ${ElseIf} $1 == 0
        ; x86 / ia32
        FileWrite $installLog "- Platform x86 or ia32$\r$\n"
        StrCpy $install_path '$INSTDIR\resources\ia32'
    ${Else}
        ; x64 $1 == 5 or Unknown
        FileWrite $installLog "- Platform X64$\r$\n"
        StrCpy $install_path '$INSTDIR\resources\x64'
    ${EndIf}

    ; Add to PATH
    StrCpy $ps_command 'powershell [Environment]::SetEnvironmentVariable("$\'"Path$\'",[Environment]::GetEnvironmentVariable("$\'"Path$\'", [EnvironmentVariableTarget]::"$\'"Machine$\'") + "$\'";$install_path$\'",[EnvironmentVariableTarget]::"$\'"Machine$\'")'
    nsExec::ExecToStack /OEM $ps_command
    Pop $0
    Pop $1
    FileWrite $installLog "$ps_command     [$0]  $1$\r$\n"

    ; removes agent
    StrCpy $ps_command 'powershell "& " "$\'"$install_path\remoteit.exe$\'" -j agent uninstall'
    nsExec::ExecToStack /OEM $ps_command
    Pop $0
    Pop $1
    FileWrite $installLog "$ps_command     [$0]  $1$\r$\n"

    ; install agent
    StrCpy $ps_command 'powershell "& " "$\'"$install_path\remoteit.exe$\'" -j agent install'
    nsExec::ExecToStack /OEM $ps_command
    Pop $0
    Pop $1
    FileWrite $installLog "$ps_command     [$0]  $1$\r$\n"
    
    FileWrite $installLog "$\nEnd Install --------------------$\r$\n"
    FileClose $installLog
!macroend

!macro customRemoveFiles
    Var /GLOBAL get_uid
    Var /GLOBAL ps_command_uninstall
    Var /GLOBAL uninstallLog
    Var /GLOBAL uninstall_path

    IfFileExists "$TEMP\remoteit.log" file_found_u file_not_found_u
    file_found_u:
        FileOpen $uninstallLog "$TEMP\remoteit.log" a
        FileSeek $uninstallLog 0 END
        goto end_of_test_u ;<== important for not continuing on the else branch
    file_not_found_u:
        FileOpen $uninstallLog "$TEMP\remoteit.log" w
    end_of_test_u:

    ; Find the platform and assign uninstall path
    System::Call 'kernel32::GetSystemInfo(i0)'
    System::Call 'kernel32::GetNativeSystemInfo(i0)'
    System::Call 'kernel32::GetSystemInfo(i.r1)'
    System::Call 'kernel32::GetNativeSystemInfo(i.r2)'
    ${If} $1 == 9
        ; ARM64
        FileWrite $installLog "- Platform x86 or arm64$\r$\n"
        StrCpy $uninstall_path '$INSTDIR\resources\arm64'
    ${ElseIf} $1 == 0
        ; x86 / ia32
        FileWrite $installLog "- Platform x86 or ia32$\r$\n"
        StrCpy $uninstall_path '$INSTDIR\resources\ia32'
    ${Else}
        ; x64 $1 == 5 or Unknown
        FileWrite $installLog "- Platform X64$\r$\n"
        StrCpy $uninstall_path '$INSTDIR\resources\x64'
    ${EndIf}

    ; detects auto-update
    ${GetParameters} $R0
    ${GetOptions} $R0 "--update" $R1
        ${IfNot} ${Errors}
            ; This is UPDATE
            ; MessageBox MB_OK "This is a UPDATE!" 
            FileWrite $uninstallLog "$\nUpdate ${PKGVERSION} (${__DATE__} ${__TIME__}): $\r$\n"
            FileWrite $uninstallLog "---------------------------------------------------$\r$\n"
        ${Else}
            FileWrite $uninstallLog "$\nUninstall ${PKGVERSION} (${__DATE__} ${__TIME__}): $\r$\n"
            FileWrite $uninstallLog "------------------------------------------------------$\r$\n"
            IfFileExists "$APPDATA\remoteit\config.json" config_found config_not_found

            config_found:
                StrCpy $get_uid 'powershell  (Get-Content -Raw -Path $APPDATA\remoteit\config.json | ConvertFrom-Json).device.uid.length'
                nsExec::ExecToStack /OEM $get_uid
                Pop $0
                Pop $1
                FileWrite $uninstallLog "$get_uid     [$0]  [$1]$\r$\n"
                IntCmp $1 0 notDevice notDevice thereIsDevice
                    notDevice:
                        ;MessageBox MB_OK "Not device installed"
                        FileWrite $uninstallLog "Device not registered$\r$\n"
                        Goto done
                    thereIsDevice:
                        MessageBox MB_YESNO|MB_DEFBUTTON2 "Would you like to unregister your device?" IDYES true IDNO false
                        true:
                            FileWrite $uninstallLog "...unregister your device: YES$\r$\n"

                            StrCpy $ps_command_uninstall 'powershell "& " "$\'"$uninstall_path\remoteit.exe$\'" -j unregister --yes'
                            nsExec::ExecToStack /OEM $ps_command_uninstall 
                            Pop $0
                            Pop $1
                            FileWrite $uninstallLog "$ps_command_uninstall     [$0]  [$1]$\r$\n"

                            ; Waits for unregister to complete
                            nsExec::ExecToStack /OEM 'powershell "& " "$\'"$uninstall_path\remoteit.exe$\'" -j --skipCloud status'

                            MessageBox MB_OK "Your device was unregistered!"

                            RMDir /r "$APPDATA\remoteit"
                            FileWrite $uninstallLog "RMDir $APPDATA\remoteit$\r$\n"

                            RMDir /r "${REMOTEIT_BACKUP}"
                            FileWrite $uninstallLog "RMDir ${REMOTEIT_BACKUP}$\r$\n"

                            RMDir /r "$PROFILE\AppData\Local\remoteit"
                            FileWrite $uninstallLog "RMDir $PROFILE\AppData\Local\remoteit$\r$\n"

                            Goto next
                        false:
                            Goto next
                        next:
                        Goto done
                done:
                goto end_of_config
            config_not_found:
                FileWrite $uninstallLog "Device config not found$\r$\n"
                ; MessageBox MB_OK "not found" 
            end_of_config:

            StrCpy $ps_command_uninstall 'powershell "& " "$\'"$uninstall_path\remoteit.exe$\'" -j agent uninstall'
            nsExec::ExecToStack /OEM $ps_command_uninstall 
            Pop $0
            Pop $1      
            FileWrite $uninstallLog "$ps_command_uninstall     [$0]  [$1]$\r$\n"
            
            StrCpy $ps_command_uninstall 'powershell [System.Environment]::SetEnvironmentVariable("$\'"PATH$\'",((([System.Environment]::GetEnvironmentVariable("$\'"PATH$\'","$\'"Machine$\'")).Split("$\'";$\'") | Where-Object { $$_ -ne "$\'"C:\Program Files\remoteit\resources\x64$\'" }) -join "$\'";$\'"),"$\'"Machine$\'") ' 
            nsExec::ExecToStack /OEM $ps_command_uninstall
            Pop $0
            Pop $1
            FileWrite $uninstallLog "$ps_command_uninstall     [$0]  [$1]$\r$\n"

            RMDir /r "$INSTDIR"
            FileWrite $uninstallLog "RMDir $INSTDIR$\r$\n"

            FileWrite $uninstallLog "$\nEnd Uninstall --------------------$\r$\n$\r$\n"
            FileClose $uninstallLog 

        ${endif}

!macroend

; test reset:
; rmdir /s %HOMEPATH%\AppData\Local\remoteit-backup && rmdir /s %HOMEPATH%\AppData\Local\remoteit && rmdir /s \ProgramData\remoteit
