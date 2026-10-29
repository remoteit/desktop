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

/* Who sees an account's disabled devices: anyone who may manage devices in it — its owner, or a role with MANAGE, on
   some devices or all. graphql's Disabled list holds the disabled devices the reader may manage, and restore needs
   MANAGE on each (docs/DEVICE-DISABLE.md, decision 9). graphql decides; this only says what to offer. */
export function useDisabledDevicesAccess(): boolean {
  const userAccount = useSelector(isUserAccount)
  const permissions = useSelector(selectPermissions)
  return userAccount || permissions.includes('MANAGE') || permissions.includes('ADMIN')
}

/* Who may decommission a disabled device: its owner, or an org admin of the owning account — in some orgs the owner
   never signs in. A predicate, for a list of them. */
export function useDecommissionRule(): (device?: { disabled?: boolean; owner?: IUserRef }) => boolean {
  const userId = useSelector((state: State) => state.auth.user?.id)
  const activeAccountId = useSelector(selectActiveAccountId)
  const admin = useSelector(selectPermissions).includes('ADMIN')
  return device =>
    !!device?.disabled && (device.owner?.id === userId || (admin && device.owner?.id === activeAccountId))
}

export function useCanDecommission(device?: IDevice): boolean {
  return useDecommissionRule()(device)
}

export function disabledWhen(date?: Date) {
  return date && !isNaN(date.getTime()) ? date.toLocaleDateString(navigator.language, timeOptions.minutes) : undefined
}
