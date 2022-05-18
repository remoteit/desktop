import { getApplication } from '../shared/applications'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../store'

export const useApplication = (service?: IService, connection?: IConnection) => {
  const connectionDefaults = useSelector((state: ApplicationState) => state.user.attributes?.connectionDefaults || {})

  // @TODO = try useCallback here to avoid re-rendering
  return getApplication(service, connection, connectionDefaults)
}

// export const useApplication = (service?: IService, connection?: IConnection) => {
//   const [app, setApp] = React.useState<Application>(getApplication(service, connection))

//   React.useEffect(() => {
//     // because default connections are not the same object every render
//     if (service && !connection?.default) {
//       console.log('SET APPLICATION', service, connection)
//       setApp(getApplication(service, connection))
//     }
//   }, [service?.typeID, connection])

//   return app
// }
