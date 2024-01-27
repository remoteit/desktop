import { useSelector } from 'react-redux'
import { State } from '../store'
import { selectApplication } from '../selectors/applications'

export const useApplication = (service?: IService, connection?: IConnection) => {
  return useSelector((state: State) => selectApplication(state, service, connection))
}
