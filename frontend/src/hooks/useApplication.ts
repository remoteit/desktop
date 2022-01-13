import React from 'react'
import { Application, getApplication } from '../shared/applications'

export const useApplication = (service?: IService, connection?: IConnection) => {
  const [app, setApp] = React.useState<Application>(getApplication(service, connection))

  React.useEffect(() => {
    // because default connections are not the same object every render
    if (service && !connection?.default) {
      console.log('SET APPLICATION', service, connection)
      setApp(getApplication(service, connection))
    }
  }, [service?.typeID, connection])

  return app
}
