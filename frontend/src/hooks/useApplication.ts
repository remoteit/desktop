import { useEffect, useState } from 'react'
import { Application, getApplication } from '../shared/applications'

export const useApplication = (context: Application['context'], service?: IService, connection?: IConnection) => {
  const [app, setApp] = useState<Application>(getApplication(context, service, connection))

  useEffect(() => {
    setApp(getApplication(context, service, connection))
  }, [context, service, connection])

  return app
}
