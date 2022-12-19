import { useSelector } from 'react-redux'
import { ApplicationState } from '../store'
import { selectApplication } from '../selectors/applications'

export const useApplication = (service?: IService, connection?: IConnection) => {
  return useSelector((state: ApplicationState) => selectApplication(state, service, connection))
}
