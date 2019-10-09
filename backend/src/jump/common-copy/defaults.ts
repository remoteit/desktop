import { ITarget, IDevice } from './types'
const defaults: ITarget | IDevice = {
  hardwareID: '',
  hostname: '',
  name: '',
  port: 0,
  secret: '',
  type: 1,
  uid: '',
}

export default defaults
