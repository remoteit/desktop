#!/bin/sh

URL_CLI=$( (cat ./backend/src/cli-version.json | grep -Eo '"cliUrl"[^,]*' | grep -Eo '[^:]*$') | sed -e 's/^.//' -e 's/.$//' -e 's/^.//')

URL_MUXER=$( (cat ./backend/src/cli-version.json | grep -Eo '"muxerUrl"[^,]*' | grep -Eo '[^:]*$') | sed -e 's/^.//' -e 's/.$//' -e 's/^.//')

URL_DEMUXER=$( (cat ./backend/src/cli-version.json | grep -Eo '"demuxerUrl"[^,]*' | grep -Eo '[^:]*$') | sed -e 's/^.//' -e 's/.$//' -e 's/^.//')

URL_CONNECTD=$( (cat ./backend/src/cli-version.json | grep -Eo '"connectdUrl"[^,]*' | grep -Eo '[^:]*$') | sed -e 's/^.//' -e 's/.$//' -e 's/^.//')

CLI=$( (cat ./backend/src/cli-version.json | grep -Eo '"cli"[^,]*' | grep -Eo '[^:]*$') | sed -e 's/^.//' -e 's/.$//' -e 's/^.//')

MUXER=$( (cat ./backend/src/cli-version.json | grep -Eo '"muxer"[^,]*' | grep -Eo '[^:]*$') | sed -e 's/^.//' -e 's/.$//' -e 's/^.//')

DEMUXER=$( (cat ./backend/src/cli-version.json | grep -Eo '"demuxer"[^,]*' | grep -Eo '[^:]*$') | sed -e 's/^.//' -e 's/.$//' -e 's/^.//')

CONNECTD=$( (cat ./backend/src/cli-version.json | grep -Eo '"connectd"[^,]*' | grep -Eo '[^:]*$') | sed -e 's/^.//' -e 's/.$//' -e 's/^.//')

set -x

rm -r ./bin/*

if [ "$(uname)" = "Darwin" ]; then

    mkdir -m 777 ./bin/

    #Mac
    curl -L https://${URL_CLI}${CLI}/remoteit_mac-osx_x86_64 --output ./bin/remoteit
    curl -L https://${URL_CONNECTD}${CONNECTD}/connectd.x86_64-osx --output ./bin/connectd
    curl -L https://${URL_DEMUXER}${DEMUXER}/demuxer.x86_64-osx --output ./bin/demuxer
    curl -L https://${URL_MUXER}${MUXER}/muxer.x86_64-osx --output ./bin/muxer

elif [ "$(uname)" = "Linux" ]; then
    

    if ["$(uname -m)" = "arm64"]; then

        #RPI arm64
        mkdir -m 777 ./bin/arm64/
        curl -L https://${URL_CLI}${CLI}/remoteit_linux_arm64 --output ./bin/rarm64/emoteit
        curl -L https://${URL_CONNECTD}${CONNECTD}/connectd.aarch64-ubuntu20.04 --output ./bin/arm64/connectd
        curl -L https://${URL_DEMUXER}${DEMUXER}/demuxer.aarch64-ubuntu20.04 --output ./bin/arm64/demuxer
        curl -L https://${URL_MUXER}${MUXER}/muxer.aarch64-ubuntu20.04 --output ./bin/arm64/muxer

    elif ["$(uname -m)" = "armv7l"]; then

         #RPI armv7
        mkdir -m 777 ./bin/armv7/
        curl -L https://${URL_CLI}${CLI}/remoteit_linux_armv7 --output ./bin/linux/remoteit
        curl -L https://${URL_CONNECTD}${CONNECTD}/connectd.arm-linaro-pi --output ./bin/linux/connectd
        curl -L https://${URL_DEMUXER}${DEMUXER}/demuxer.arm-linaro-pi --output ./bin/linux/demuxer
        curl -L https://${URL_MUXER}${MUXER}/muxer.arm-linaro-pi --output ./bin/linux/muxer

    else

        #Linux
        mkdir -m 777 ./bin/linux/
        curl -L https://${URL_CLI}${CLI}/remoteit_linux_x86_64 --output ./bin/linux/remoteit
        curl -L https://${URL_CONNECTD}${CONNECTD}/connectd.x86_64-etch --output ./bin/linux/connectd
        curl -L https://${URL_DEMUXER}${DEMUXER}/demuxer.x86_64-etch --output ./bin/linux/demuxer
        curl -L https://${URL_MUXER}${MUXER}/muxer.x86_64-etch --output ./bin/linux/muxer
        
    fi
    

else

    mkdir -m 777 ./bin/x64
    mkdir -m 777 ./bin/x86

    #32 bits Windows 
    curl -L https://${URL_CLI}${CLI}/remoteit_windows_x86.exe --output ./bin/x86/remoteit.exe 
    curl -L https://${URL_CONNECTD}${CONNECTD}/connectd.x86-win.exe --output ./bin/x86/connectd.exe
    curl -L https://${URL_DEMUXER}${DEMUXER}/demuxer.x86-win.exe --output ./bin/x86/demuxer.exe
    curl -L https://${URL_MUXER}${MUXER}/muxer.x86-win.exe --output ./bin/x86/muxer.exe

    #64 bits Windows
    curl -L https://${URL_CLI}${CLI}/remoteit_windows_x86_64.exe --output ./bin/x64/remoteit.exe
    curl -L https://${URL_CONNECTD}${CONNECTD}/connectd.x86_64-win.exe --output ./bin/x64/connectd.exe
    curl -L https://${URL_DEMUXER}${DEMUXER}/demuxer.x86_64-win.exe --output ./bin/x64/demuxer.exe
    curl -L https://${URL_MUXER}${MUXER}/muxer.x86_64-win.exe --output ./bin/x64/muxer.exe

    #arm64 Windows
    # curl -L https://${URL_CLI}${CLI}/remoteit_windows_x86_64.exe --output ./bin/x64/remoteit.exe
    # curl -L https://${URL_CONNECTD}${CONNECTD}/connectd.x86_64-win.exe --output ./bin/x64/connectd.exe
    # curl -L https://${URL_DEMUXER}${DEMUXER}/demuxer.x86_64-win.exe --output ./bin/x64/demuxer.exe
    # curl -L https://${URL_MUXER}${MUXER}/muxer.x86_64-win.exe --output ./bin/x64/muxer.exe

fi

#set permissions
chmod -R 755 ./bin

set +x