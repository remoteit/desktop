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

- [Notarizing on Mac OS](https://kilianvalkhof.com/2019/electron/notarizing-your-electron-application/)
