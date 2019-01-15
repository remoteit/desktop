import ConnectionService from './connection.service'
import hooks from './connection.hooks'
import { Application } from '@feathersjs/express'

export default (app: Application<any>) => {
  app.use('/connections', new ConnectionService())
  const service = app.service('connections')
  service.hooks(hooks)
}
