import { ITarget, IDevice } from '../common/types'
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
