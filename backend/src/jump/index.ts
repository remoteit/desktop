import socketIO from 'socket.io'
import Controller from './controller'
import cli from './cli'
import User from '../User'
import EventBus from '../EventBus'

export default class JumpBox {
  user?: UserCredentials
  signedIn: boolean = false

  constructor(server: socketIO.Server, user?: UserCredentials) {
    if (user) this.signIn(user)

    EventBus.on(User.EVENTS.signedIn, this.signIn)
    EventBus.on(User.EVENTS.signedOut, this.signOut)

    server.on('connection', socket => {
      console.log('a user connected')
      cli.read()
      socket.on('disconnect', () => console.log('user disconnected'))
      new Controller(server, socket)
    })
  }

  signIn = (user: UserCredentials) => {
    cli.write('user', {
      username: user.username,
      authHash: user.authHash,
    })
  }

  signOut = () => {
    cli.write('user', {})
  }
}
