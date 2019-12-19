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
- Remote configuration through web hosted panel

## Platforms

- Windows
- Mac
- Raspberry Pi
- Ubuntu
