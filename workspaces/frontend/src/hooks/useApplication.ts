import React from 'react'
import { Application, getApplication } from '../shared/applications'

export const useApplication = (context: Application['context'], service?: IService, connection?: IConnection) => {
  const [app, setApp] = React.useState<Application>(getApplication(context, service, connection))

  React.useEffect(() => {
    setApp(getApplication(context, service, connection))
  }, [context, service, connection])

  return app
}
