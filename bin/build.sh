#!/bin/sh

URL_CLI=$((cat ./backend/src/cli-version.json | grep -Eo '"url_cli"[^,]*' | grep -Eo '[^:]*$') | sed -e 's/^.//' -e 's/.$//' -e 's/^.//')

URL_DOWNLOAD=$((cat ./backend/src/cli-version.json | grep -Eo '"url_base"[^,]*' | grep -Eo '[^:]*$') | sed -e 's/^.//' -e 's/.$//' -e 's/^.//')

URL_CONNECTD=$((cat ./backend/src/cli-version.json | grep -Eo '"url_connectd"[^,]*' | grep -Eo '[^:]*$') | sed -e 's/^.//' -e 's/.$//' -e 's/^.//')

CLI_VERSION=$((cat ./backend/src/cli-version.json | grep -Eo '"cli"[^,]*' | grep -Eo '[^:]*$') | sed -e 's/^.//' -e 's/.$//' -e 's/^.//')

MUXER=$((cat ./backend/src/cli-version.json | grep -Eo '"muxer"[^,]*' | grep -Eo '[^:]*$') | sed -e 's/^.//' -e 's/.$//' -e 's/^.//')

DEMUXER=$((cat ./backend/src/cli-version.json | grep -Eo '"demuxer"[^,]*' | grep -Eo '[^:]*$') | sed -e 's/^.//' -e 's/.$//' -e 's/^.//')

CONNECTD=$((cat ./backend/src/cli-version.json | grep -Eo '"connectd"[^,]*' | grep -Eo '[^:]*$') | sed -e 's/^.//' -e 's/.$//' -e 's/^.//')


chmod -R 777 ./bin/

mkdir -m 777 ./bin/CLI/

mkdir -m 777 ./bin/CLI/x64

mkdir -m 777 ./bin/CLI/x86

if [ "$(uname)" == "Darwin" ]; then

    #Mac
    curl https://${URL_CLI}${CLI_VERSION}/remoteit_mac-osx_x86_64 --output ./bin/CLI/remoteit

    curl https://${URL_CONNECTD}${CONNECTD}/connectd.x86_64-osx --output ./bin/CLI/connectd

    curl https://${URL_DOWNLOAD}${DEMUXER}/demuxer.x86_64-osx --output ./bin/CLI/demuxer

    curl https://${URL_DOWNLOAD}${MUXER}/muxer.x86_64-osx --output ./bin/CLI/muxer
    
else

    #32 bits Windows 
    curl https://${URL_CLI}${CLI_VERSION}/remoteit_windows_x86.exe --output ./bin/CLI/X86/remoteit.exe 

    curl https://${URL_CONNECTD}${CONNECTD}/connectd.x86-win.exe --output ./bin/CLI/X86/connectd.exe

    curl https://${URL_DOWNLOAD}${DEMUXER}/demuxer.x86-win.exe --output ./bin/CLI/X86/demuxer.exe

    curl https://${URL_DOWNLOAD}${MUXER}/muxer.x86-win.exe --output ./bin/CLI/X86/muxer.exe


    #64 bits Windows
    curl https://${URL_CLI}${CLI_VERSION}/remoteit_windows_x86_64.exe --output ./bin/CLI/X64/remoteit.exe

    curl https://${URL_CONNECTD}${CONNECTD}/connectd.x86_64-64.exe --output ./bin/CLI/X64/connectd.exe

    curl https://${URL_DOWNLOAD}${DEMUXER}/demuxer.x86_64-64.exe --output ./bin/CLI/X64/demuxer.exe

    curl https://${URL_DOWNLOAD}${MUXER}/muxer.x86_64-64.exe --output ./bin/CLI/X64/muxer.exe

fi