#!/bin/sh

CLI_VERSION=$(<./backend/src/cli-version.txt)

chmod -R 777 ./bin/

curl https://downloads.remote.it/cli/v${CLI_VERSION}/remoteit_windows_x86_64.exe --output ./bin/CLI/remoteit64.exe

curl https://downloads.remote.it/cli/v${CLI_VERSION}/remoteit_windows_x86.exe --output ./bin/CLI/remoteit86.exe 
