import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { State } from '../store'
import { selectPermissions } from '../selectors/organizations'
import { isUserAccount, selectActiveAccountId } from '../selectors/accounts'
import { deviceDisableServed } from '../services/deviceDisable'
import { timeOptions } from '../components/Timestamp'

/* Whether this API has device disable (services/deviceDisable): undefined until it has answered, false where it has
   none — the portal then keeps its delete. */
export function useDeviceDisable(): boolean | undefined {
  const [served, setServed] = useState<boolean | undefined>()
  useEffect(() => {
    let live = true
    deviceDisableServed().then(s => live && setServed(s))
    return () => {
      live = false
    }
  }, [])
  return served
}

/* Who sees an account's disabled devices and may decommission: the owner, or an org admin — in some orgs the owner
   never signs in (docs/DEVICE-DISABLE.md "Who may act"). graphql decides; this only says what to offer. */
export function useDisabledDevicesAccess(): boolean {
  const userAccount = useSelector(isUserAccount)
  const admin = useSelector(selectPermissions).includes('ADMIN')
  return userAccount || admin
}

export function useCanDecommission(device?: IDevice): boolean {
  const userId = useSelector((state: State) => state.auth.user?.id)
  const activeAccountId = useSelector(selectActiveAccountId)
  const admin = useSelector(selectPermissions).includes('ADMIN')
  if (!device?.disabled) return false
  return device.owner?.id === userId || (admin && device.owner?.id === activeAccountId)
}

export function disabledWhen(date?: Date) {
  return date && !isNaN(date.getTime()) ? date.toLocaleDateString(navigator.language, timeOptions.minutes) : undefined
}
