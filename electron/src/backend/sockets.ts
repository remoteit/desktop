type AuthSocket = { auth?: boolean; disconnect: (close?: boolean) => unknown }

// socketio-auth marks a signed-in socket with `auth`; the socket performing a switch has not signed in yet.
export function disconnectAuthenticated(sockets: Iterable<AuthSocket>) {
  for (const socket of sockets) if (socket.auth) socket.disconnect(true)
}
