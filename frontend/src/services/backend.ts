import io from 'socket.io-client'

// TODO: move to env var
const PORT = 29999

export const socket = io(`http://localhost:${PORT}`)
socket.on('connect', () => console.log('connect'))
socket.on('disconnect', () => console.log('connect'))
