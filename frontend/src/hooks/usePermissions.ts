import { isElectron } from '../services/Browser'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../store'

export function usePermissions() {
  const { isElevated, admin, user } = useSelector((state: ApplicationState) => ({
    isElevated: state.backend.environment.isElevated,
    admin: state.backend.environment.adminUsername,
    user: state.auth.user,
  }))

  const guest: boolean = !!admin && !!user && user.username !== admin
  const notElevated: boolean = !guest && !isElectron() && !isElevated

  return {
    admin,
    user,
    guest, // is guest user
    isElevated,
    notElevated, // application cannot run elevated actions
  }
}
