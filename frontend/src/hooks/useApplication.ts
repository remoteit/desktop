import React from 'react'
import { Application, getApplication } from '../shared/applications'

export const useApplication = (service?: IService, connection?: IConnection) => {
  const [app, setApp] = React.useState<Application>(getApplication(service, connection))

  React.useEffect(() => {
    if (service) setApp(getApplication(service, connection))
  }, [service?.typeID, connection])

  return app
}
