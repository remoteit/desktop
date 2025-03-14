# remote.it Desktop

> Cross-platform remote.it desktop application

## Overview

The desktop application serves one primary purpose which is to create a Peer-to-Peer connection to a remote.it device. It downloads and installs connectd on the current system and then runs connectd to establish a Peer-to-Peer connection.

## Features

- Peer to peer initiator connections
- Local area network (LAN) sharing of initiator connections
- Custom local port and IP address binding for connections
- Custom connection naming
- Connection throughput monitoring
- Quick launch to HTTP(S), SSH or VNC connections
- Registering your system as a target device (traditional registration)
- Run target services as system services
- Jump services to other systems on the network
- LAN scanning
- Multi user system handling
- Remote configuration through web hosted panel on port 29999
- Out of band network detection

## Platforms

- Windows
- Mac
- Linux
- iOS
- Android

## Start as root / admin

Start as root / admin to have hosted services persist for all users and continue to run even after the remote.it desktop app is quit

### Windows

Just run as Administrator from the start menu option.

### MacOS

Must be launched from a terminal

```shell
sudo /Applications/remoteit.app/Contents/MacOS/remoteit
```

### Linux

```shell
sudo /opt/remoteit/remoteit --no-sandbox
```

## Remote view

The desktop app runs a web service at port 29999 for remote access.

- Setup prompt: If you log in to a device through your browser for remote setup it will by default put you on the device setup screen instead of the device list.

## Troubleshooting

If things aren't working the best way to clear everything and start over is to use the **Uninstall command line tools** menu in the advanced settings screen.

### CLI tools

The Desktop installs and depends on the remote.it CLI tools.
At startup they are installed here:

```shell
Mac      /Applications/Remoteit.app/Contents/Resources/mac
Linux    /usr/bin/
Windows  C:/Program Files/remoteit/resources
```

### Configuration and log files

```shell
Mac      ~/.remoteit/
Linux    ~/.remoteit/
Windows  C:\Users\%username%\AppData\Local\remoteit\
         C:\Users\%username%\AppData\Temp\remoteit.log
```

### CLI config files

```shell
Mac      /etc/remoteit/
Linux    /etc/remoteit/
Windows  C:\ProgramData\remoteit\
```

### Windows installer log

```shell
Windows  C:\Users\%username%\AppData\Local\temp\remoteit.log
```

## Development

### Setup

Get a copy of the .env file
place the .env file in the root directory - it will be copied into the sub projects at start

To use the fontawesome fonts:
[Installation Instructions](https://fontawesome.com/how-to-use/on-the-web/setup/using-package-managers#installing-pro)

```shell
npm config set "@fortawesome:registry" https://npm.fontawesome.com/
npm config set "//npm.fontawesome.com/:_authToken" [FONT_AWESOME_TOKEN]
```

### Installation

```shell
nvm install
nvm use
npm install
```

Start web app

```shell
npm start
```

### Electron

Install electron

```shell
npm run install-electron
```

With web app running start electron app

```shell
npm run electron
```

Command+option+I to open with dev tools.

### Mobile

To use the live reloading you will have to set your development app's network IP Address in an environment variable in your profile:

```shell
export CAPACITOR_DESKTOP_LIVE_RELOAD="http://192.168.0.154:3000/"
```

Then you can run the web app and mobile app at the same time. Start mobile app.

```shell
npm run ios
```

and for Android you need you will need a key.properties file in the android directory. Please get it from another developer. Then start the android app.

```shell
npm run android
```

## Branding

The build is set up to be able to handle a `BRAND` environment variable.

the `/brand` directory contains possible brand options. See `/brand/remoteit` as and example of what brand files are needed if you want to create a new brand.

## Testing

Tests are written using Jest.

```shell
npm run test
```

or

```shell
npm run test-watch
```

## Building

The build is now handled by github actions. The build artifacts are uploaded to the github releases page.

### Test build electron

If you want to build the app locally on your machine you can do so with the following commands:

```shell
cd electron
npm run build-local
```

### Generating Assets

```shell
npx @capacitor/assets generate --iconBackgroundColor '#034b9d' --splashBackgroundColor '#034b9d' --android --ios
```

For electron app icon

```shell
./electron/scripts/icns-creator assets/app-icon.png
mv -f ./iconbuilder.iconset/* ./electron/src/icons
mv -f iconbuilder.icns ./electron/src/icons/icon.icns
rm -rf iconbuilder.iconset
```

### Release iOS

```shell
npm run build-mobile
npm run open-ios
```

In XCode:

1. Select "Any iOS Device"
2. Select "Product" > "Archive"
3. Select "Distribute App"

### Release Android

```shell
npm run build-mobile
npm run open-android
```

To build the signed android app you will need to place the following files

- `/android/key.properties`
- `/android/androiduploadkey.jks`

In android studio:

- build > Generate signed bundle
- select aab

Upload to google play console

Test the build locally:

```shell
adb install -r ./android/app/build/outputs/apk/release/app-release.apk
```

### Packaging

In order to be able to build on your local machine:

- Sign into apple id site: `https://appleid.apple.com` with `appledeveloper@remote.it`
- In the Security section, click the 'Generate password...' button to generate an in app password.
- Add the in app password to your `backend/.env` file:
  `APPLE_ID_PASSWORD=<inapp-password>`
  You may or may not have to also add it to your keychain.

If it's not working check that the developer account is signed into XCode and the certificates for the dev account are downloaded.

More info can be found in this setup guide: [Notarizing on Mac OS](https://kilianvalkhof.com/2019/electron/notarizing-your-electron-application/)

#### Packaging in GitHub Actions

To update the certificates when they expire you will also need to update the /ios/App/ExportOptions.plist provisioningProfiles to the new provisioning profile.

#### Packaging for linux snaps

To test install a snap package:

```shell
sudo snap install my-snap-name_0.1_amd64.snap --dangerous --devmode
```

To install and uninstall a deb package:

```shell
sudo dpkg -i /home/jamie/Code/desktop/dist/remoteit-amd64-installer.deb
sudo dpkg -r remoteit-desktop
```

### Windows full app signing

- Windows machine or VM
- [Windows SDK installed](https://developer.microsoft.com/en-us/windows/downloads/windows-10-sdk)
- [SafeNet Authentication Client](https://support.comodo.com/index.php?/Knowledgebase/Article/View/1211/106/safenet-download-for-ev-codesigning-certificates)
- The physical USB drive EV Code Signing Certificate
- Token password for the certificate
- Optionally add the signtool to your path:
  - Find the path to the signtool.exe by searching in "\Program Files (x86)"
  - example location: `/c/Program Files (x86)/Windows Kits/10/bin/10.0.18362.0/x64/signtool`
  - Open the Environment Variables control panel
  - Find the 'Path' variable
  - Add the signtool directory

#### Set the sign tool to auto respond to the password prompt:

With an EV signing cert you cannot automate the token password, but you can set the sign tool to remember the password for the logged in session: https://stackoverflow.com/questions/17927895/automate-extended-validation-ev-code-signing

#### To sign the application follow these steps:

1. Insert USB Certificate
2. `npm run build`
3. Enter the token password for the certificate if prompted (once per login)
4. After build is completed copy these four files to the main build directory:

- latest.yml
- remoteit-installer.exe
- remoteit-installer.exe.blockmap

You should now have a fully signed windows app suite with installer, and uninstaller that can be auto-updated.

_Note if you run into signing errors "SignTool Error: The file is being used by another process." disable Windows Defender_
_Also it's good to run the signtool command once in console so that the signtool will keep the password in memory for the build_

### Windows partial manual signing

To sign the application follow these steps:

1. Insert USB Certificate
2. Copy the unsigned windows desktop exe to the Windows machine
3. Open command prompt
4. Run sign command:

```cmd
signtool sign /a \Users\<USER>\Desktop\remoteit-desktop.exe
```

5. A token password prompt should appear from SafeNet
6. Enter the token password for the certificate

The application should now be signed. It will not support auto-updating.

## Update process

Check dependencies
`npx depcheck`

Check and update dependencies
`ncu -i`
