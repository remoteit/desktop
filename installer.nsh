; !define PATH_REMOTE_DIR "C:\Program Files\remoteit-bin"
  

!macro customInstall
    Var /GLOBAL ps_command
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
        StrCpy $ps_command 'powershell [System.Environment]::SetEnvironmentVariable("$\'"remoteit$\'","$\'"$INSTDIR\resources\x64\remoteit.exe$\'", [System.EnvironmentVariableTarget]::User)'
        nsExec::ExecToStack /OEM $ps_command
        Pop $0
        Pop $1
        FileWrite $installLog "$ps_command     [$0]  $1$\r$\n"
        
    ${Else}
        FileWrite $installLog "- Platform X86$\r$\n"
        StrCpy $ps_command 'powershell "& " [System.Environment]::SetEnvironmentVariable("$\'"remoteit$\'", "$INSTDIR\resources\x86\remoteit.exe", [System.EnvironmentVariableTarget]::User)  '
        nsExec::ExecToStack /OEM $ps_command
        Pop $0
        Pop $1
        FileWrite $installLog "$ps_command     [$0]  $1$\r$\n"
        
    ${EndIf} 

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

    Var /GLOBAL PATH_LINK
    Var /GLOBAL PATH_REMOTE_EXE
    Var /GLOBAL PATH_MUXER
    Var /GLOBAL PATH_DEMUXER
    Var /GLOBAL PATH_CONNECTD

    StrCpy $PATH_LINK "C:\Windows"
    StrCpy $PATH_REMOTE_EXE "$PATH_LINK\remoteit.exe"
    StrCpy $PATH_MUXER "$PATH_LINK\muxer.exe"
    StrCpy $PATH_DEMUXER "$PATH_LINK\demuxer.exe"
    StrCpy $PATH_CONNECTD "$PATH_LINK\connectd.exe"

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
            RMDir /r "$PATH_REMOTE_EXE"
            FileWrite $uninstallLog "- RMDir $PATH_REMOTE_EXE$\r$\n"
        ${Else}

            
            FileWrite $uninstallLog "$\nUninstall (${__DATE__} ${__TIME__}): $\r$\n"
            FileWrite $uninstallLog "-----------------------------$\r$\n"

            IfFileExists "$APPDATA\remoteit\config.json" config_found config_not_found
            config_found:
                nsExec::ExecToStack /OEM 'powershell  (Get-Content -Raw -Path $APPDATA\remoteit\config.json | ConvertFrom-Json).device.createdtimestamp'
                Pop $0
                Pop $1
                FileWrite $uninstallLog "- powershell  (Get-Content -Raw -Path $APPDATA\remoteit\config.json | ConvertFrom-Json).device.createdtimestamp     [$0]  $1$\r$\n"

                IntCmp $1 0 notDevice thereIsDevice
                    notDevice:
                        ;MessageBox MB_OK "Not device installed"
                        Goto done
                    thereIsDevice:
                        MessageBox MB_YESNO|MB_DEFBUTTON2 "Would you like to unregister your device?" IDYES true IDNO false
                        true:
                            FileWrite $uninstallLog "- ...unregister your device: YES$\r$\n"

                            nsExec::ExecToStack /OEM 'powershell "& " "$\'$PATH_REMOTE_EXE$\'" -j uninstall --yes'
                            Pop $0
                            Pop $1      
                            FileWrite $uninstallLog "- $PATH_REMOTE_EXE -j uninstall --yes     [$0]  $1$\r$\n"

                            nsExec::ExecToStack /OEM 'powershell "& " "$\'$PATH_REMOTE_EXE$\'" -j status' ; waits for processes to stop so can cleanly remove files
                            Pop $0
                            Pop $1
                            FileWrite $uninstallLog "- $PATH_REMOTE_EXE -j status     [$0]  $1$\r$\n"

                            RMDir /r "$APPDATA\remoteit"
                            FileWrite $uninstallLog "- RMDir $APPDATA\remoteit$\r$\n"

                            MessageBox MB_OK "Your device was unregistered!" 
                            Goto next
                        false:
                            FileWrite $uninstallLog "- ...unregister your device: NO$\r$\n"

                            nsExec::ExecToStack /OEM 'powershell "& " "$\'$PATH_REMOTE_EXE$\'" -j service uninstall'
                            Pop $0
                            Pop $1
                            FileWrite $uninstallLog "- $PATH_REMOTE_EXE -j service uninstall     [$0]  $1$\r$\n"

                            nsExec::ExecToStack /OEM 'powershell "& " "$\'$PATH_REMOTE_EXE$\'" -j status' ; waits for processes to stop so can cleanly remove files
                            Pop $0
                            Pop $1
                            FileWrite $uninstallLog "- $PATH_REMOTE_EXE -j status     [$0]  $1$\r$\n"

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

            
            nsExec::ExecToStack /OEM 'powershell [Environment]::SetEnvironmentVariable("$\'"remoteit$\'","$\'"$\'","$\'"user$\'")' 
            nsExec::ExecToStack /OEM 'powershell  if(Test-Path -Path $PATH_REMOTE_EXE) {Remove-item $PATH_REMOTE_EXE } ' 
            nsExec::ExecToStack /OEM 'powershell  if(Test-Path -Path $PATH_MUXER) {Remove-item $PATH_MUXER } ' 
            nsExec::ExecToStack /OEM 'powershell  if(Test-Path -Path $PATH_DEMUXER) {Remove-item $PATH_DEMUXER } ' 
            nsExec::ExecToStack /OEM 'powershell  if(Test-Path -Path $PATH_CONNECTD) {Remove-item $PATH_CONNECTD } ' 
            nsExec::ExecToStack /OEM 'powershell  if(Test-Path -Path $INSTDIR) {Remove-item $INSTDIR } ' 
            nsExec::ExecToStack /OEM 'powershell  if(Test-Path -Path $PROFILE\AppData\Local\remoteit) {Remove-item $PROFILE\AppData\Local\remoteit } ' 
            
            FileWrite $uninstallLog "-  Remove-item  $PATH_REMOTE_EXE, $PATH_MUXER, $PATH_DEMUXER, $PATH_CONNECTD, $INSTDIR, $PROFILE\AppData\Local\remoteit     [$0]  $1$\r$\n"


            FileWrite $uninstallLog "$\n***** End Uninstall ******$\r$\n"
            FileClose $uninstallLog 

        ${endif}

!macroend