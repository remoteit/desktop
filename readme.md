# remote.it Desktop

> Cross-platform remote.it "initiator" desktop application

## Overview

The desktop application serves one primary purpose which is to create a Peer-to-Peer connection to a remote.it device. It downloads and installs connectd on the current system and then runs connectd to establish a Peer-to-Peer connection.

## Usage

- Your connections are persisted to `~/.remoteit/connections.json`. You can add/remove connection manually if you'd like. Make sure to restart the desktop if you change this file.

## Development

```shell
nvm install
nvm use
npm install
npm start
```

Click the system tray icon with command+option to open with dev tools.

## Testing

Tests are written using Jest. End-to-end tests are in `tests/e2e`.

### Setup

Copy the `backend/.env.example` file to `backend/.env` and then fill in the values.

### End-to-End Tests

```shell
# in one tab:
npm start

# in another tab:
npm run test-e2e
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

### Publishing

You should have an env var set `export GH_TOKEN="<YOUR_TOKEN_HERE>"`

to publish `npm run publish`

<!-- "release": "build -p always",  -->

### Windows signing

Windows signing is done on a Windows machine or VM. You will need:

- Windows machine or VM
- [Windows SDK installed](https://developer.microsoft.com/en-us/windows/downloads/windows-10-sdk)
- [SafeNet Authentication Client](https://support.comodo.com/index.php?/Knowledgebase/Article/View/1211/106/safenet-download-for-ev-codesigning-certificates)
- The physical USB drive EV Code Signing Certificate
- Token password for the certificate
- Optionally add the signtool to your path:
  - Find the path to the signtool.exe by searching in "\Program Files (x86)"
  - Open the Environment Variables control panel
  - Find the 'Path' variable
  - Add the signtool directory

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

The application should now be signed.

## Run as root on Linux

```cmd
/opt/remoteit-desktop/remoteit-desktop --no-sandbox
```

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
- Raspberry Pi
- Ubuntu
