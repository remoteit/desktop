; !define PATH_REMOTE_DIR "C:\Program Files\remoteit-bin"
; !define REMOTE_CLI_EXE "$PATH_REMOTE_DIR\remoteit.exe"

!macro customInstall
    Var /GLOBAL PATH_REMOTE_DIR
    Var /GLOBAL REMOTE_CLI_EXE

    StrCpy $0 $INSTDIR -9  # = "path without remoteit folder"
    StrCpy $PATH_REMOTE_DIR "$0\Program Files\remoteit-bin"
    StrCpy $REMOTE_CLI_EXE "$PATH_REMOTE_DIR\remoteit.exe"

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
     
    Var /GLOBAL VERSION
    FileOpen $4 "$INSTDIR\resources\cli-version.txt" r
    FileRead $4 $VERSION
    FileClose $4

    Var /GLOBAL PLATFORM
    ${If} ${RunningX64}
        StrCpy $PLATFORM "remoteit_windows_x86_64.exe"
        FileWrite $installLog "- Platform X64$\r$\n"
    ${Else}
        StrCpy $PLATFORM "remoteit_windows_x86.exe"
        FileWrite $installLog "- Platform X86$\r$\n"
    ${EndIf}
    !define DOWNLOAD_URL_CLI "https://downloads.remote.it/cli/v$VERSION/$PLATFORM" 
    !define DOWNLOAD_PATH_CLI "$PATH_REMOTE_DIR\$PLATFORM"

    CreateDirectory "$PATH_REMOTE_DIR"
    nsExec::ExecToStack /OEM 'powershell (new-object System.Net.WebClient).DownloadFile\
    ($\'"${DOWNLOAD_URL_CLI}"$\', $\'"${DOWNLOAD_PATH_CLI}"$\') '
    Pop $0
    Pop $1
    ${If} $0 == 0
        StrCpy $0 "OK"
    ${Else}
        StrCpy $0 "ERROR"
    ${EndIf}
    FileWrite $installLog "- Download File ${DOWNLOAD_URL_CLI} send to ${DOWNLOAD_PATH_CLI}    [$0]  $1 $\r$\n"
    
    Rename "${DOWNLOAD_PATH_CLI}" "$REMOTE_CLI_EXE"
    FileWrite $installLog "- Rename ${DOWNLOAD_PATH_CLI} $REMOTE_CLI_EXE $\r$\n"
    
    IfFileExists "$REMOTE_CLI_EXE" found_remoteIt not_found_remoteIt
    found_remoteIt:
        nsExec::ExecToStack /OEM 'powershell "& " $\'"$REMOTE_CLI_EXE$\'"  '
        Pop $0
        Pop $1
        ${If} $0 == 0
            StrCpy $0 "OK"
        ${Else}
            StrCpy $0 "ERROR"
        ${EndIf}
        FileWrite $installLog "- powershell $REMOTE_CLI_EXE     [$0]  $1$\r$\n"

        nsExec::ExecToStack /OEM 'powershell "& " "icacls $\'"$REMOTE_CLI_EXE$\'" /T /C /Q /grant "*S-1-5-32-545:RX" '
        Pop $0
        Pop $1
        ${If} $0 == 0
            StrCpy $0 "OK"
        ${Else}
            StrCpy $0 "ERROR"
        ${EndIf}
        FileWrite $installLog "- icacls $REMOTE_CLI_EXE /T /C /Q /grant *S-1-5-32-545:RX      [$0]  $1$\r$\n"

        nsExec::ExecToStack /OEM 'powershell "& " "$\'"$REMOTE_CLI_EXE$\'" -j tools install --update'
        Pop $0
        Pop $1
        ${If} $0 == 0
            StrCpy $0 "OK"
        ${Else}
            StrCpy $0 "ERROR"
        ${EndIf}
        FileWrite $installLog "- $REMOTE_CLI_EXE -j tools install --update      [$0]  $1$\r$\n" 

        nsExec::ExecToStack /OEM 'powershell "& " "$\'"$REMOTE_CLI_EXE$\'" -j service uninstall'
        Pop $0
        Pop $1
        ${If} $0 == 0
            StrCpy $0 "OK"
        ${Else}
            StrCpy $0 "ERROR"
        ${EndIf}
        FileWrite $installLog "- $REMOTE_CLI_EXE -j service uninstall     [$0]  $1$\r$\n"

        nsExec::ExecToStack /OEM 'powershell "& " "$\'"$REMOTE_CLI_EXE$\'" -j service install'
        Pop $0
        Pop $1
        ${If} $0 == 0
            StrCpy $0 "OK"
        ${Else}
            StrCpy $0 "ERROR"
        ${EndIf}
        FileWrite $installLog "- $REMOTE_CLI_EXE -j service install     [$0]  $1$\r$\n"

        goto end_of_remoteIt
    not_found_remoteIt:
        ; MessageBox MB_OK "Error file not found: $REMOTE_CLI_EXE"
        FileWrite $installLog "- [Error] file not found: $REMOTE_CLI_EXE$\r$\n"
    end_of_remoteIt:

    

    FileWrite $installLog "$\n***** End Install ******$\r$\n"
    FileClose $installLog
!macroend

!macro customUnInstall

    Var /GLOBAL PATH_REMOTE_DIR_U
    Var /GLOBAL REMOTE_CLI_EXE_U

    StrCpy $0 $INSTDIR -9  # = "path without remoteit folder"
    StrCpy $PATH_REMOTE_DIR_U "$0\Program Files\remoteit-bin"
    StrCpy $REMOTE_CLI_EXE_U "$PATH_REMOTE_DIR_U\remoteit.exe"


  ${GetOptions} $R0 "--update" $R1
        ${IfNot} ${Errors}
            ; This is UPDATE
            ; MessageBox MB_OK "This is a UPDATE!" 
        ${Else}

            Var /GLOBAL uninstallLog
            IfFileExists "$TEMP\remoteit.log" file_found file_not_found
            file_found:
                FileOpen $uninstallLog "$TEMP\remoteit.log" a 
                FileSeek $uninstallLog 0 END
                goto end_of_test ;<== important for not continuing on the else branch
            file_not_found:
                FileOpen $uninstallLog "$TEMP\remoteit.log" w 
            end_of_test:
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

                            nsExec::ExecToStack /OEM 'powershell "& " "$\'$REMOTE_CLI_EXE_U$\'" -j uninstall --yes'
                            Pop $0
                            Pop $1       
                            ${If} $0 == 0
                                StrCpy $0 "OK"
                            ${Else}
                                StrCpy $0 "ERROR"
                            ${EndIf}
                            FileWrite $uninstallLog "- $REMOTE_CLI_EXE_U -j uninstall --yes     [$0]  $1$\r$\n"

                            nsExec::ExecToStack /OEM 'powershell "& " "$\'$REMOTE_CLI_EXE_U$\'" -j status' ; waits for processes to stop so can cleanly remove files
                            Pop $0
                            Pop $1
                            ${If} $0 == 0
                                StrCpy $0 "OK"
                            ${Else}
                                StrCpy $0 "ERROR"
                            ${EndIf}
                            FileWrite $uninstallLog "- $REMOTE_CLI_EXE_U -j status     [$0]  $1$\r$\n"

                            RMDir /r "$APPDATA\remoteit"
                            FileWrite $uninstallLog "- RMDir $APPDATA\remoteit$\r$\n"

                            MessageBox MB_OK "Your device was unregistered!" 
                            Goto next
                        false:
                            FileWrite $uninstallLog "- ...unregister your device: NO$\r$\n"

                            nsExec::ExecToStack /OEM 'powershell "& " "$\'$REMOTE_CLI_EXE_U$\'" -j service uninstall'
                            Pop $0
                            Pop $1
                            ${If} $0 == 0
                                StrCpy $0 "OK"
                            ${Else}
                                StrCpy $0 "ERROR"
                            ${EndIf}
                            FileWrite $uninstallLog "- $REMOTE_CLI_EXE_U -j service uninstall     [$0]  $1$\r$\n"

                            nsExec::ExecToStack /OEM 'powershell "& " "$\'$REMOTE_CLI_EXE_U$\'" -j status' ; waits for processes to stop so can cleanly remove files
                            Pop $0
                            Pop $1
                            ${If} $0 == 0
                                StrCpy $0 "OK"
                            ${Else}
                                StrCpy $0 "ERROR"
                            ${EndIf}
                            FileWrite $uninstallLog "- $REMOTE_CLI_EXE_U -j status     [$0]  $1$\r$\n"

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


            RMDir /r "$PATH_REMOTE_DIR_U"
            FileWrite $uninstallLog "- RMDir $PATH_REMOTE_DIR_U$\r$\n"

            RMDir /r "$PROFILE\AppData\Local\remoteit"
            FileWrite $uninstallLog "- RMDir $PROFILE\AppData\Local\remoteit$\r$\n"

            RMDir /r "$INSTDIR"
            FileWrite $uninstallLog "- RMDir $INSTDIR$\r$\n"

            FileWrite $uninstallLog "$\n***** End Uninstall ******$\r$\n"
            FileClose $uninstallLog 

        ${endif}

!macroend