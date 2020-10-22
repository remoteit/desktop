import { isElectron } from '../services/Browser'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../store'

export function usePermissions() {
  const { isElevated, adminUsername, user } = useSelector((state: ApplicationState) => ({
    isElevated: state.backend.environment.isElevated,
    adminUsername: state.backend.environment.adminUsername,
    user: state.auth.user,
  }))

  const guest: boolean = !!adminUsername && !!user && user.email !== adminUsername
  const notElevated: boolean = !guest && !isElectron() && !isElevated

  return {
    user,
    guest, // is guest user
    isElevated,
    notElevated, // application cannot run elevated actions
    adminUsername,
  }
}
