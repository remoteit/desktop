# remote.it Desktop

> Cross-platform remote.it "initiator" desktop application

## Overview

The desktop application serves one primary purpose which is to create a Peer-to-Peer connection to a remote.it device. It downloads and installs connectd on the current system and then runs connectd to establish a Peer-to-Peer connection.

If a P2P connection dies, we automatically fail over to a remote Proxy connection using the API. We use a reverse proxy at the given port (`33000`-`42999` port range) that forwards traffic to the P2P connection (`43000`-`52999` port range) or the Proxy connection (something like `https://proxy1.rt3.io:33001`). This means each connection always has a consistent port assignment, no matter if we are using a P2P or Proxy connection underneath.

## Development

```shell
nvm install
nvm use
npm install
npm start
```

## Testing

Tests are written using Jest. End-to-end tests are in `tests/e2e`.

### Setup

Copy the `.env.example` file to `.env` and then fill in the values for testing.

### End-to-End Tests

```shell
# in one tab:
npm run server

# in another tab:
npm run test-e2e
```
