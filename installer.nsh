; !define PATH_REMOTE_DIR "C:\Program Files\remoteit-bin"
  

!macro customInstall
    Var /GLOBAL ps_command
    Var /GLOBAL path_
    Var /GLOBAL installLog
    IfFileExists "$TEMP\remoteit.log" file_found file_not_found
    file_found:
        FileOpen $installLog "$TEMP\remoteit.log" a 
        FileSeek $installLog 0 END
        goto end_of_test ;<== important for not continuing on the else branch
    file_not_found:
        FileOpen $installLog "$TEMP\remoteit.log" w 
    end_of_test:
    
    FileWrite $installLog "$\nInstall (${__DATE__} ${__TIME__}): $\r$\n"
    FileWrite $installLog "-----------------------------$\r$\n"

    ${If} ${RunningX64}
        FileWrite $installLog "- Platform X64$\r$\n"
        StrCpy $path_ '$INSTDIR\resources\x64'
        
    ${Else}
        FileWrite $installLog "- Platform X86$\r$\n"
        StrCpy $path_ '$INSTDIR\resources\x86'
        
    ${EndIf} 
    
    StrCpy $ps_command 'powershell $\n\
    ([System.Environment]::SetEnvironmentVariable("$\'"remoteit$\'","$\'"$path_\remoteit.exe$\'", [System.EnvironmentVariableTarget]::User)) ; $\n\
    ([System.Environment]::SetEnvironmentVariable("$\'"muxer$\'","$\'"$path_\muxer.exe$\'", [System.EnvironmentVariableTarget]::User)) ; $\n\
    ([System.Environment]::SetEnvironmentVariable("$\'"demuxer$\'","$\'"$path_\demuxer.exe$\'", [System.EnvironmentVariableTarget]::User)) ; $\n\
    ([System.Environment]::SetEnvironmentVariable("$\'"connectd$\'","$\'"$path_\connectd.exe$\'", [System.EnvironmentVariableTarget]::User)) $\n\
    '
    nsExec::ExecToStack /OEM $ps_command
    Pop $0
    Pop $1
    FileWrite $installLog "$ps_command     [$0]  $1$\r$\n"

    StrCpy $ps_command 'powershell "& " ([System.Environment]::GetEnvironmentVariable("$\'"remoteit$\'","$\'"user$\'")) -j service uninstall'
    nsExec::ExecToStack /OEM $ps_command 
    Pop $0
    Pop $1
    FileWrite $installLog '$ps_command     [$0]  $1$\r$\n'

    StrCpy $ps_command 'powershell "& " ([System.Environment]::GetEnvironmentVariable("$\'"remoteit$\'","$\'"user$\'")) -j service install'
    nsExec::ExecToStack /OEM $ps_command 
    Pop $0
    Pop $1
    FileWrite $installLog '$ps_command     [$0]  $1$\r$\n'
    

    FileWrite $installLog "$\n***** End Install ******$\r$\n"
    FileClose $installLog
!macroend

!macro customUnInstall

    Var /GLOBAL ps_command_uninstall

    Var /GLOBAL uninstallLog
    IfFileExists "$TEMP\remoteit.log" file_found_u file_not_found_u
    file_found_u:
        FileOpen $uninstallLog "$TEMP\remoteit.log" a 
        FileSeek $uninstallLog 0 END
        goto end_of_test_u ;<== important for not continuing on the else branch
    file_not_found_u:
        FileOpen $uninstallLog "$TEMP\remoteit.log" w 
    end_of_test_u:

    ${GetOptions} $R0 "--update" $R1
        ${IfNot} ${Errors}
            ; This is UPDATE
            ; MessageBox MB_OK "This is a UPDATE!" 
            FileWrite $uninstallLog "$\nUpdate (${__DATE__} ${__TIME__}): $\r$\n"
            FileWrite $uninstallLog "-----------------------------$\r$\n"
        ${Else}

            
            FileWrite $uninstallLog "$\nUninstall (${__DATE__} ${__TIME__}): $\r$\n"
            FileWrite $uninstallLog "-----------------------------$\r$\n"

            IfFileExists "$APPDATA\remoteit\config.json" config_found config_not_found
            config_found:
                StrCpy $ps_command_uninstall 'powershell  (Get-Content -Raw -Path $APPDATA\remoteit\config.json | ConvertFrom-Json).device.createdtimestamp'
                nsExec::ExecToStack /OEM $ps_command_uninstall
                Pop $0
                Pop $1
                FileWrite $uninstallLog "-$ps_command_uninstall     [$0]  $1$\r$\n"

                IntCmp $1 0 notDevice thereIsDevice
                    notDevice:
                        ;MessageBox MB_OK "Not device installed"
                        Goto done
                    thereIsDevice:
                        MessageBox MB_YESNO|MB_DEFBUTTON2 "Would you like to unregister your device?" IDYES true IDNO false
                        true:
                            FileWrite $uninstallLog "- ...unregister your device: YES$\r$\n"
                            StrCpy $ps_command_uninstall 'powershell "& " ([System.Environment]::GetEnvironmentVariable("$\'"remoteit$\'","$\'"user$\'")) -j uninstall --yes'
                            nsExec::ExecToStack /OEM $ps_command_uninstall 
                            Pop $0
                            Pop $1      
                            FileWrite $uninstallLog "$ps_command_uninstall     [$0]  $1$\r$\n"

                            StrCpy $ps_command_uninstall 'powershell "& " ([System.Environment]::GetEnvironmentVariable("$\'"remoteit$\'","$\'"user$\'")) -j status'
                            nsExec::ExecToStack /OEM $ps_command_uninstall
                            Pop $0
                            Pop $1
                            FileWrite $uninstallLog "-$ps_command_uninstall     [$0]  $1$\r$\n"

                            RMDir /r "$APPDATA\remoteit"
                            FileWrite $uninstallLog "- RMDir $APPDATA\remoteit$\r$\n"

                            MessageBox MB_OK "Your device was unregistered!" 
                            Goto next
                        false:
                            FileWrite $uninstallLog "- ...unregister your device: NO$\r$\n"

                            StrCpy $ps_command_uninstall 'powershell "& " ([System.Environment]::GetEnvironmentVariable("$\'"remoteit$\'","$\'"user$\'")) -j service uninstall'
                            nsExec::ExecToStack /OEM $ps_command_uninstall
                            Pop $0
                            Pop $1
                            FileWrite $uninstallLog "-$ps_command_uninstall     [$0]  $1$\r$\n"

                            StrCpy $ps_command_uninstall 'powershell "& " ([System.Environment]::GetEnvironmentVariable("$\'"remoteit$\'","$\'"user$\'")) -j status'
                            nsExec::ExecToStack /OEM $ps_command_uninstall 
                            Pop $0
                            Pop $1
                            FileWrite $uninstallLog "-$ps_command_uninstall     [$0]  $1$\r$\n"

                            RMDir /r "$APPDATA\remoteit\log"
                            FileWrite $uninstallLog "- RMDir $APPDATA\remoteit\log$\r$\n"
                            Goto next
                        next:
                        Goto done
                done:
                
                goto end_of_config
            config_not_found:
                ;config.json not found
                ; MessageBox MB_OK "not found" 
            end_of_config:

            StrCpy $ps_command_uninstall 'powershell $\n\
            [Environment]::SetEnvironmentVariable("$\'"remoteit$\'","$\'"$\'","$\'"user$\'"); $\n\
            [Environment]::SetEnvironmentVariable("$\'"muxer$\'","$\'"$\'","$\'"user$\'"); $\n\
            [Environment]::SetEnvironmentVariable("$\'"demuxer$\'","$\'"$\'","$\'"user$\'"); $\n\
            [Environment]::SetEnvironmentVariable("$\'"connectd$\'","$\'"$\'","$\'"user$\'") ' 
            nsExec::ExecToStack /OEM $ps_command_uninstall
            FileWrite $uninstallLog "-$ps_command_uninstall     [$0]  $1$\r$\n"


            FileWrite $uninstallLog "$\n***** End Uninstall ******$\r$\n"
            FileClose $uninstallLog 

        ${endif}

!macroend