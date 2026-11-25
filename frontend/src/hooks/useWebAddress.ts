import { useEffect, useState, useSyncExternalStore } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import type { Dispatch, State } from '../store'
import { deviceSessionInfo, subscribeDeviceSessionInfo } from '../services/deviceSessionInfo'
import {
  Unchecked,
  WebAddressOpened,
  WebTarget,
  decideWebAddress,
  knownWebAddress,
  openWebAddress,
  openWebService,
  opensAtWebAddress,
  requestWebAddress,
  subscribeWebAddresses,
  webAddressAllowed,
  webAddressGate,
  webTarget,
} from '../services/webAddress'
import { useDeviceSessions } from './useDeviceSessions'
import { useReadAgain, useReadEffect } from './useReadAgain'

// A service as the web address is decided of it (services/webAddress webTarget).
export function useWebTarget(service?: IService, connection?: IConnection): WebTarget | undefined {
  const web = useSelector((state: State) => !!webTarget(state, service, connection)?.web)
  const id = service?.id ?? connection?.id
  return id
    ? { id, deviceID: service?.deviceID ?? connection?.deviceID, route: service?.attributes.route, web }
    : undefined
}

/* Whether a service is opened at its web address rather than by a proxy connection (services/webAddress): undefined while
   that is read, which is asked for here; UNCHECKED where it could not be, until it is known after all — by whoever tries
   again (useRecheck). Looked at again when who serves its account changes, and when the Test setting does. */
export function useWebAddress(target: WebTarget | undefined): boolean | undefined | Unchecked {
  const dropped = useReadAgain()
  useDeviceSessions()
  const fleet = useSelector((state: State) => state.ui.proxyFleet)
  useSyncExternalStore(subscribeWebAddresses, webAddressGate)
  useSyncExternalStore(subscribeDeviceSessionInfo, () =>
    target?.deviceID ? deviceSessionInfo(target.deviceID) : undefined
  )
  const allowed = webAddressAllowed(target)
  const now = opensAtWebAddress(target)
  // What was asked of, and answered or given up on.
  const asked = allowed && target ? `${target.id} ${target.deviceID} ${fleet} ${dropped}` : ''
  const [answered, setAnswered] = useState<{ asked: string; is?: boolean }>()

  useEffect(() => {
    if (!asked) return
    let current = true
    decideWebAddress(target).then(is => current && setAnswered({ asked, is }))
    return () => {
      current = false
    }
  }, [asked])

  return now ?? (answered?.asked === asked ? answered.is ?? 'UNCHECKED' : undefined)
}

// Trying again whether a service is opened at its web address, where it could not be checked: read again once, and what is
// shown of it follows.
export function useRecheck(target: WebTarget | undefined) {
  const [checking, setChecking] = useState(false)
  const recheck = async () => {
    if (checking) return false
    setChecking(true)
    const is = await decideWebAddress(target)
    setChecking(false)
    return is
  }
  return { checking, recheck }
}

// A service's web address, where it is opened at one (`on`) and there is one: to show, and to copy.
export function useKnownWebAddress(target: WebTarget | undefined, on: boolean): string | undefined {
  const address = useSyncExternalStore(subscribeWebAddresses, () => knownWebAddress(target?.id))

  useReadEffect(() => {
    if (on && target) requestWebAddress(target)
  }, [on, target?.id, target?.deviceID])

  return on ? address : undefined
}

// Opening a service on a click: whether it is under way, and what the last try that did not open said. `how`: at its web
// address, unless it is opened some other way (services/webAddress openWebService).
export function useOpenWebAddress(
  serviceId: string | undefined,
  how: (serviceId: string) => Promise<WebAddressOpened> = openWebAddress
) {
  const [opening, setOpening] = useState(false)
  const [opened, setOpened] = useState<WebAddressOpened>(true)
  // Said of the service, and of the sign-in serving it then: not left up for another.
  const dropped = useReadAgain()
  useEffect(() => setOpened(true), [dropped, serviceId])

  const open = async (): Promise<WebAddressOpened> => {
    if (!serviceId || opening) return true
    setOpening(true)
    setOpened(true)
    const result = await how(serviceId).catch((): WebAddressOpened => ({ reason: '' }))
    setOpened(result)
    setOpening(false)
    return result
  }

  return { open, opening, failed: opened === true ? undefined : opened }
}

// A web service opened on a click from where nothing is shown of how it went — a row, a chip, an app's Open — (services/
// webAddress openWebService): one that did not open is said as any other error of the app's.
export function useOpenWebService(target: WebTarget | undefined) {
  const { t } = useTranslation()
  const dispatch = useDispatch<Dispatch>()
  const { open, opening } = useOpenWebAddress(target?.id, () => openWebService(target!))
  const { checking, recheck } = useRecheck(target)
  return {
    opening: opening || checking,
    // Where it could not be checked: tried again, and opened by the next click where that answers.
    recheck: async () => {
      if ((await recheck()) !== undefined) return
      dispatch.ui.set({
        errorMessage: t(
          'webAddress.unchecked',
          'Could not check how this service opens, so it was not connected. Try again.'
        ),
      })
    },
    open: async () => {
      const result = await open()
      if (result !== true)
        dispatch.ui.set({ errorMessage: result.reason || t('webAddress.failed', 'Could not open it: try again') })
    },
  }
}
