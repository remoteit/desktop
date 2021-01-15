import { Application, getApplication } from '../shared/applications'

export const useApplication = (context: Application['context'], service?: IService, connection?: IConnection) => {
  return getApplication(context, service, connection)
}
