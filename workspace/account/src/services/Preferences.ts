import { r3 } from './remote.it'

export default class Preferences {
  public static async set(key: string, value: any): Promise<any> {
    return r3
      .post('/user/preference', { key, data: value })
      .then(r3.processData)
      .catch(r3.processError)
  }
}
