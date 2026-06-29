import { useEffect, useRef, useState } from 'react'
import { windowOpen } from '../services/browser'
import { State, Dispatch } from '../store'
import { platforms, IPlatform } from '../platforms'
import { useSelector, useDispatch } from 'react-redux'
import { selectOrganization } from '../selectors/organizations'

type Props = {
  serviceTypes: number[]
  platform?: IPlatform
  tags?: string[]
  redirect?: string
  oneTimeUse?: boolean
}

export function useAutoRegistration({ platform, tags, serviceTypes, redirect, oneTimeUse }: Props) {
  const organization = useSelector((state: State) => selectOrganization(state))
  const fetching = useSelector((state: State) => state.ui.fetching)
  const user = useSelector((state: State) => state.user)

  const [registrationCode, setRegistrationCode] = useState<string>()
  const [registrationCommand, setRegistrationCommand] = useState<string>()
  const sessionCodeRef = useRef<string>()
  const sessionContextRef = useRef<{ accountId: string; platformId?: string }>()

  const [redirected, setRedirected] = useState<boolean>(false)
  const dispatch = useDispatch<Dispatch>()

  let accountId = organization.id || user.id

  function getRedirect(location?: string, code?: string) {
    if (!location || !code) return
    const url = new URL(decodeURIComponent(location))
    url.searchParams.set('code', code)
    return url.toString()
  }

  useEffect(() => {
    console.log('AUTO REGISTRATION EFFECT', {
      platform,
      tags,
      serviceTypes,
      fetching,
      accountId,
    })
    if (fetching) return

    const platformId = platform?.id
    const previousContext = sessionContextRef.current

    if (
      previousContext &&
      (previousContext.accountId !== accountId || previousContext.platformId !== platformId)
    ) {
      sessionCodeRef.current = undefined
      setRegistrationCode(undefined)
      setRegistrationCommand(undefined)
    }

    sessionContextRef.current = { accountId, platformId }

    ;(async () => {
      let options: Parameters<typeof dispatch.devices.createRegistration>[0] = {
        tags,
        accountId,
        services: serviceTypes.map(type => ({ application: type })),
        oneTimeUse,
        code: sessionCodeRef.current,
      }
      if (platform) {
        options.platform = platforms.findType(platform.id)
        options.template = platform.installation?.command
      }

      const result = await dispatch.devices.createRegistration(options)

      if (result) {
        sessionCodeRef.current = result.registrationCode
        setRegistrationCode(result.registrationCode)
        setRegistrationCommand(result.registrationCommand)
      }

      if (!redirect || redirected) return

      try {
        setRedirected(true)
        const url = getRedirect(redirect, result?.registrationCode)
        console.log('REDIRECT TO:', url)
        windowOpen(url, '_blank', true)
      } catch (error) {
        console.warn('Failed to redirect to:', error)
      }
    })()
  }, [accountId, platform, tags?.length, serviceTypes.length, fetching, oneTimeUse])

  useEffect(() => {
    return () => {
      sessionCodeRef.current = undefined
      dispatch.ui.set({ registrationCommand: undefined, registrationCode: undefined })
    }
  }, [dispatch])

  return { registrationCommand, registrationCode, redirectUrl: getRedirect(redirect, registrationCode), fetching }
}
