import { isElectron } from '../services/Browser'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../store'

export function usePermissions() {
  const { admin, user, isElevated } = useSelector((state: ApplicationState) => ({
    admin: state.backend.admin,
    user: state.auth.user,
    isElevated: state.backend.isElevated,
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
