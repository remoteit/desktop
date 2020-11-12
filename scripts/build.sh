#!/bin/sh

URL_CLI=$( (cat ./backend/src/cli-version.json | grep -Eo '"cliUrl"[^,]*' | grep -Eo '[^:]*$') | sed -e 's/^.//' -e 's/.$//' -e 's/^.//')

URL_MUXER=$( (cat ./backend/src/cli-version.json | grep -Eo '"muxerUrl"[^,]*' | grep -Eo '[^:]*$') | sed -e 's/^.//' -e 's/.$//' -e 's/^.//')

URL_DEMUXER=$( (cat ./backend/src/cli-version.json | grep -Eo '"demuxerUrl"[^,]*' | grep -Eo '[^:]*$') | sed -e 's/^.//' -e 's/.$//' -e 's/^.//')

URL_CONNECTD=$( (cat ./backend/src/cli-version.json | grep -Eo '"connectdUrl"[^,]*' | grep -Eo '[^:]*$') | sed -e 's/^.//' -e 's/.$//' -e 's/^.//')

CLI_VERSION=$( (cat ./backend/src/cli-version.json | grep -Eo '"cli"[^,]*' | grep -Eo '[^:]*$') | sed -e 's/^.//' -e 's/.$//' -e 's/^.//')

MUXER=$( (cat ./backend/src/cli-version.json | grep -Eo '"muxer"[^,]*' | grep -Eo '[^:]*$') | sed -e 's/^.//' -e 's/.$//' -e 's/^.//')

DEMUXER=$( (cat ./backend/src/cli-version.json | grep -Eo '"demuxer"[^,]*' | grep -Eo '[^:]*$') | sed -e 's/^.//' -e 's/.$//' -e 's/^.//')

CONNECTD=$( (cat ./backend/src/cli-version.json | grep -Eo '"connectd"[^,]*' | grep -Eo '[^:]*$') | sed -e 's/^.//' -e 's/.$//' -e 's/^.//')

set -x

if [ "$(uname)" = "Darwin" ]; then

    mkdir -m 777 ./bin/

    #Mac
    curl -L https://${URL_CLI}${CLI_VERSION}/remoteit_mac-osx_x86_64 --output ./bin/remoteit
    curl -L https://${URL_CONNECTD}${CONNECTD}/connectd.x86_64-osx --output ./bin/connectd
    curl -L https://${URL_DEMUXER}${DEMUXER}/demuxer.x86_64-osx --output ./bin/demuxer
    curl -L https://${URL_MUXER}${MUXER}/muxer.x86_64-osx --output ./bin/muxer

elif [ "$(uname)" = "Linux" ]; then
    
    mkdir -m 777 ./bin/

    #Linux
    curl -L https://${URL_CLI}${CLI_VERSION}/remoteit_linux_x86_64 --output ./bin/remoteit
    curl -L https://${URL_CONNECTD}${CONNECTD}/connectd.x86_64-ubuntu16.04 --output ./bin/connectd
    curl -L https://${URL_DEMUXER}${DEMUXER}/demuxer.x86_64-ubuntu16.04 --output ./bin/demuxer
    curl -L https://${URL_MUXER}${MUXER}/muxer.x86_64-ubuntu16.04 --output ./bin/muxer

else

    mkdir -m 777 ./bin/x64
    mkdir -m 777 ./bin/x86

    #32 bits Windows 
    curl -L https://${URL_CLI}${CLI_VERSION}/remoteit_windows_x86.exe --output ./bin/X86/remoteit.exe 
    curl -L https://${URL_CONNECTD}${CONNECTD}/connectd.x86-win.exe --output ./bin/X86/connectd.exe
    curl -L https://${URL_DEMUXER}${DEMUXER}/demuxer.x86-win.exe --output ./bin/X86/demuxer.exe
    curl -L https://${URL_MUXER}${MUXER}/muxer.x86-win.exe --output ./bin/X86/muxer.exe

    #64 bits Windows
    curl -L https://${URL_CLI}${CLI_VERSION}/remoteit_windows_x86_64.exe --output ./bin/X64/remoteit.exe
    curl -L https://${URL_CONNECTD}${CONNECTD}/connectd.x86_64-64.exe --output ./bin/X64/connectd.exe
    curl -L https://${URL_DEMUXER}${DEMUXER}/demuxer.x86_64-64.exe --output ./bin/X64/demuxer.exe
    curl -L https://${URL_MUXER}${MUXER}/muxer.x86_64-64.exe --output ./bin/X64/muxer.exe

fi

#set permissions
chmod -R 755 ./bin
