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
- Raspberry Pi
- Ubuntu
- Headless (No GUI system)

## Headless

The desktop can also be installed only as a web-service to manage a device in a headless environment. Install and run headless.

```shell
curl -O -L https://github.com/remoteit/desktop/releases/download/latest/remoteit-headless.tgz
tar -xf remoteit-headless.tgz
sudo node package/build
```

To run in the background

```shell
nohup sudo node package/build &
```

Desktop can then be accessed on port 29999, either on localhost or over the local network.

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

## Guest view

If a device has already been setup by a user, other users that log in will be in guest view and have limited abilities.
Also a user in guest view can be logged out if the primary user logs in.

## Troubleshooting

If things aren't working the best way to clear everything and start over is to use the "Uninstall command line tools" menu in the advanced settings screen.

**CLI tools**

The Desktop installs and depends on the remote.it CLI tools.
At startup they are installed here:

```
Mac      /usr/local/bin/
Linux    /usr/bin/
Windows  C:\Program Files\remoteit-bin\
```

**Configuration and log files**

```
Mac      ~/.remoteit/
Linux    ~/.remoteit/
Windows  C:\Users\%username%\AppData\Local\remoteit\
```

**CLI config files**

```
Mac      /etc/remoteit/
Linux    /etc/remoteit/
Windows  C:\ProgramData\remoteit\
```

## Development

```shell
nvm install
nvm use
npm install
npm start
```

Start the frontend react dev server

```shell
cd frontend
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

## Packaging for running headless

```cmd
npm run package
```

### Publishing

You should have an env var set `export GH_TOKEN="<YOUR_TOKEN_HERE>"`

to publish `npm run publish`

<!-- "release": "build -p always",  -->

### Windows full app signing

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

**Set the sign tool to auto respond to the password prompt:**

With an EV signing cert you cannot automate the token password, but you can set the sign tool to remember the password for the logged in session: https://stackoverflow.com/questions/17927895/automate-extended-validation-ev-code-signing

**To sign the application follow these steps:**

1. Insert USB Certificate
2. `PLATFORMS=w npm run build`
3. Enter the token password for the certificate if prompted (once per login)
4. After build is completed copy these four files to the main build directory:

- latest.yml
- remoteit-installer.exe
- remoteit-installer.exe.blockmap

You should now have a fully signed windows app suite with installer, and uninstaller that can be auto-updated.

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

## Windows Debug command

```bash
DEBUG=electron-builder ./node_modules/.bin/electron-builder -w
```
