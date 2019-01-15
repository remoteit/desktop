import connection from './connection'
import { Application } from '@feathersjs/express'

export default (app: Application<any>) => {
  app.configure(connection)
}
