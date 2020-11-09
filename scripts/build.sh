#!/bin/sh

URL_CLI=$((cat ./backend/src/cli-version.json | grep -Eo '"url_cli"[^,]*' | grep -Eo '[^:]*$') | sed -e 's/^.//' -e 's/.$//' -e 's/^.//')

URL_DOWNLOAD=$((cat ./backend/src/cli-version.json | grep -Eo '"url_base"[^,]*' | grep -Eo '[^:]*$') | sed -e 's/^.//' -e 's/.$//' -e 's/^.//')

URL_CONNECTD=$((cat ./backend/src/cli-version.json | grep -Eo '"url_connectd"[^,]*' | grep -Eo '[^:]*$') | sed -e 's/^.//' -e 's/.$//' -e 's/^.//')

CLI_VERSION=$((cat ./backend/src/cli-version.json | grep -Eo '"cli"[^,]*' | grep -Eo '[^:]*$') | sed -e 's/^.//' -e 's/.$//' -e 's/^.//')

MUXER=$((cat ./backend/src/cli-version.json | grep -Eo '"muxer"[^,]*' | grep -Eo '[^:]*$') | sed -e 's/^.//' -e 's/.$//' -e 's/^.//')

DEMUXER=$((cat ./backend/src/cli-version.json | grep -Eo '"demuxer"[^,]*' | grep -Eo '[^:]*$') | sed -e 's/^.//' -e 's/.$//' -e 's/^.//')

CONNECTD=$((cat ./backend/src/cli-version.json | grep -Eo '"connectd"[^,]*' | grep -Eo '[^:]*$') | sed -e 's/^.//' -e 's/.$//' -e 's/^.//')


chmod -R 777 ./bin/

mkdir -m 777 ./bin/

mkdir -m 777 ./bin/x64

mkdir -m 777 ./bin/x86

if [ "$(uname)" == "Darwin" ]; then

    #Mac
    echo -e "\n\ndownloading https://${URL_CLI}${CLI_VERSION}/remoteit_mac-osx_x86_64"
    curl -L https://${URL_CLI}${CLI_VERSION}/remoteit_mac-osx_x86_64 --output ./bin/remoteit

    echo -e "\n\ndownloading https://${URL_CONNECTD}${CONNECTD}/connectd.x86_64-osx"
    curl -L https://${URL_CONNECTD}${CONNECTD}/connectd.x86_64-osx --output ./bin/connectd

    echo -e "\n\ndownloading https://${URL_DOWNLOAD}${DEMUXER}/demuxer.x86_64-osx"
    curl -L https://${URL_DOWNLOAD}${DEMUXER}/demuxer.x86_64-osx --output ./bin/demuxer

    echo -e "\n\ndownloading https://${URL_DOWNLOAD}${MUXER}/muxer.x86_64-osx"
    curl -L https://${URL_DOWNLOAD}${MUXER}/muxer.x86_64-osx --output ./bin/muxer
    
else

    #32 bits Windows 
    echo -e "\n\ndownloading https://${URL_CLI}${CLI_VERSION}/remoteit_windows_x86.exe"
    curl -L https://${URL_CLI}${CLI_VERSION}/remoteit_windows_x86.exe --output ./bin/X86/remoteit.exe 

    echo -e "\n\ndownloading https://${URL_CONNECTD}${CONNECTD}/connectd.x86-win.exe"
    curl -L https://${URL_CONNECTD}${CONNECTD}/connectd.x86-win.exe --output ./bin/X86/connectd.exe

    echo -e "\n\ndownloading https://${URL_DOWNLOAD}${DEMUXER}/demuxer.x86-win.exe"
    curl -L https://${URL_DOWNLOAD}${DEMUXER}/demuxer.x86-win.exe --output ./bin/X86/demuxer.exe

    echo -e "\n\ndownloading https://${URL_DOWNLOAD}${MUXER}/muxer.x86-win.exe"
    curl -L https://${URL_DOWNLOAD}${MUXER}/muxer.x86-win.exe --output ./bin/X86/muxer.exe


    #64 bits Windows
    echo -e "\n\ndownloading https://${URL_CLI}${CLI_VERSION}/remoteit_windows_x86_64.exe"
    curl -L https://${URL_CLI}${CLI_VERSION}/remoteit_windows_x86_64.exe --output ./bin/X64/remoteit.exe

    echo -e "\n\ndownloading https://${URL_CONNECTD}${CONNECTD}/connectd.x86_64-64.exe"
    curl -L https://${URL_CONNECTD}${CONNECTD}/connectd.x86_64-64.exe --output ./bin/X64/connectd.exe

    echo -e "\n\ndownloading https://${URL_DOWNLOAD}${DEMUXER}/demuxer.x86_64-64.exe"
    curl -L https://${URL_DOWNLOAD}${DEMUXER}/demuxer.x86_64-64.exe --output ./bin/X64/demuxer.exe

    echo -e "\n\ndownloading https://${URL_DOWNLOAD}${MUXER}/muxer.x86_64-64.exe"
    curl -L https://${URL_DOWNLOAD}${MUXER}/muxer.x86_64-64.exe --output ./bin/X64/muxer.exe

fi

#set permissions
chmod -R 755 ./bin
