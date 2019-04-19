import axios from 'axios'
import { IUser } from 'remote.it'
import { r3 } from '../services/remote.it'

export class User {
  static async login(username: string, password: string): Promise<IUser> {
    // TODO: Handle errors!
    const resp = await axios.post('https://api.remote.it/access-key')
    r3.accessKey = resp.data.accessKey
    // TOOD: Set login cookies
    return await r3.user.login(username, password)
  }
}
