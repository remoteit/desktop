import cors from 'cors'
// import helmet from 'helmet'
import { Application } from '@feathersjs/express'

export default (app: Application<any>) => {
  // app.use(helmet())
  app.use(cors())
}
