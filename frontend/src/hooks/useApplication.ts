import React from 'react'
import { Application, getApplication } from '../shared/applications'

export const useApplication = (service?: IService, connection?: IConnection) => {
  const [app, setApp] = React.useState<Application>(getApplication(service, connection))

  React.useEffect(() => {
    setApp(getApplication(service, connection))
  }, [service, connection])

  return app
}
