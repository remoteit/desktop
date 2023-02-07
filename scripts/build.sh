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

    #Mac intel
    mkdir -pm 777 ./bin/x64
    curl -L https://${URL_CLI}${CLI}/remoteit.x86_64-osx --output ./bin/x64/remoteit
    curl -L https://${URL_CONNECTD}${CONNECTD}/connectd.x86_64-osx --output ./bin/x64/connectd
    curl -L https://${URL_DEMUXER}${DEMUXER}/demuxer.x86_64-osx --output ./bin/x64/demuxer
    curl -L https://${URL_MUXER}${MUXER}/muxer.x86_64-osx --output ./bin/x64/muxer

    #Mac arm
    mkdir -pm 777 ./bin/arm64
    curl -L https://${URL_CLI}${CLI}/remoteit.x86_64-osx --output ./bin/arm64/remoteit
    curl -L https://${URL_CONNECTD}${CONNECTD}/connectd.x86_64-osx --output ./bin/arm64/connectd
    curl -L https://${URL_DEMUXER}${DEMUXER}/demuxer.x86_64-osx --output ./bin/arm64/demuxer
    curl -L https://${URL_MUXER}${MUXER}/muxer.x86_64-osx --output ./bin/arm64/muxer


elif [ "$(uname)" = "Linux" ]; then
    
    #Linux
    mkdir -pm 777 ./bin/linux/
    curl -L https://${URL_CLI}${CLI}/remoteit.x86_64-linux --output ./bin/linux/remoteit
    curl -L https://${URL_CONNECTD}${CONNECTD}/connectd.x86_64-etch --output ./bin/linux/connectd
    curl -L https://${URL_DEMUXER}${DEMUXER}/demuxer.x86_64-etch --output ./bin/linux/demuxer
    curl -L https://${URL_MUXER}${MUXER}/muxer.x86_64-etch --output ./bin/linux/muxer

    #RPI armv7
    mkdir -pm 777 ./bin/armv7l/
    curl -L https://${URL_CLI}${CLI}/remoteit.arm-v7-linux --output ./bin/armv7l/remoteit
    curl -L https://${URL_CONNECTD}${CONNECTD}/connectd.arm-linaro-pi --output ./bin/armv7l/connectd
    curl -L https://${URL_DEMUXER}${DEMUXER}/demuxer.arm-linaro-pi --output ./bin/armv7l/demuxer
    curl -L https://${URL_MUXER}${MUXER}/muxer.arm-linaro-pi --output ./bin/armv7l/muxer

    #RPI arm64
    mkdir -pm 777 ./bin/arm64/
    curl -L https://${URL_CLI}${CLI}/remoteit.aarch64-linux --output ./bin/arm64/remoteit
    curl -L https://${URL_CONNECTD}${CONNECTD}/connectd.aarch64-linux-gnu --output ./bin/arm64/connectd
    curl -L https://${URL_DEMUXER}${DEMUXER}/demuxer.aarch64-linux-gnu --output ./bin/arm64/demuxer
    curl -L https://${URL_MUXER}${MUXER}/muxer.aarch64-linux-gnu --output ./bin/arm64/muxer

else

    #32 bits Windows 
    mkdir -pm 777 ./bin/ia32
    curl -L https://${URL_CLI}${CLI}/remoteit.x86-win.exe --output ./bin/ia32/remoteit.exe 
    curl -L https://${URL_CONNECTD}${CONNECTD}/connectd.x86-win.exe --output ./bin/ia32/connectd.exe
    curl -L https://${URL_DEMUXER}${DEMUXER}/demuxer.x86-win.exe --output ./bin/ia32/demuxer.exe
    curl -L https://${URL_MUXER}${MUXER}/muxer.x86-win.exe --output ./bin/ia32/muxer.exe

    #64 bits Windows
    mkdir -pm 777 ./bin/x64
    curl -L https://${URL_CLI}${CLI}/remoteit.x86_64-win.exe --output ./bin/x64/remoteit.exe
    curl -L https://${URL_CONNECTD}${CONNECTD}/connectd.x86_64-win.exe --output ./bin/x64/connectd.exe
    curl -L https://${URL_DEMUXER}${DEMUXER}/demuxer.x86_64-win.exe --output ./bin/x64/demuxer.exe
    curl -L https://${URL_MUXER}${MUXER}/muxer.x86_64-win.exe --output ./bin/x64/muxer.exe

    #arm64 Windows
    mkdir -pm 777 ./bin/arm64
    curl -L https://${URL_CLI}${CLI}/remoteit.aarch64-win.exe --output ./bin/arm64/remoteit.exe
    curl -L https://${URL_CONNECTD}${CONNECTD}/connectd.aarch64-win.exe --output ./bin/arm64/connectd.exe
    curl -L https://${URL_DEMUXER}${DEMUXER}/demuxer.aarch64-win.exe --output ./bin/arm64/demuxer.exe
    curl -L https://${URL_MUXER}${MUXER}/muxer.aarch64-win.exe --output ./bin/arm64/muxer.exe   

    echo "Warning !!! There are no indicators defined for the system architecture to build, therefore it will be built for windows, to change the platform specify an option: npm run build --arch = 'XXX' (possible options: win, mac, linux)"

fi

#set permissions
chmod -R 755 ./bin

set +x