import socketIO from 'socket.io'
import { signIn } from './user/signIn'
import { signOut } from './user/signOut'
import { checkSignIn } from './user/checkSignIn'
import { list } from './connections/list'
import { info } from './connectd/info'
import { install } from './connectd/install'
import { start } from './connections/start'
import { disconnect } from './connections/disconnect'

interface Routes {
  [path: string]: (
    socket: socketIO.Socket
  ) => (...args: any) => Promise<any | void>
}

export const routes: Routes = {
  'user/sign-in': signIn,
  'user/sign-out': signOut,
  'user/check-sign-in': checkSignIn,
  'connection/list': list,
  'service/connect': start,
  'service/disconnect': disconnect,
  'connectd/install': install,
  'connectd/info': info,
}
