import { useEffect, useState } from 'react'
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
}

export function useAutoRegistration({ platform, tags, serviceTypes, redirect }: Props) {
  const organization = useSelector((state: State) => selectOrganization(state))
  const registrationCommand = useSelector((state: State) => state.ui.registrationCommand)
  const registrationCode = useSelector((state: State) => state.ui.registrationCode)
  const fetching = useSelector((state: State) => state.ui.fetching)
  const user = useSelector((state: State) => state.user)

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
    ;(async () => {
      let options: Parameters<typeof dispatch.devices.createRegistration>[0] = {
        tags,
        accountId,
        services: serviceTypes.map(type => ({ application: type })),
      }
      if (platform) {
        options.platform = platforms.findType(platform.id)
        options.template = platform.installation?.command
      }

      const code = await dispatch.devices.createRegistration(options)

      if (!redirect || redirected) return

      try {
        setRedirected(true)
        const url = getRedirect(redirect, code)
        console.log('REDIRECT TO:', url)
        windowOpen(url, '_blank', true)
      } catch (error) {
        console.warn('Failed to redirect to:', error)
      }
    })()

    return function cleanup() {
      dispatch.ui.set({ registrationCommand: undefined }) // remove registration code so we don't redirect to new device page
    }
  }, [accountId, platform, tags?.length, serviceTypes.length, fetching])

  return { registrationCommand, registrationCode, redirectUrl: getRedirect(redirect, registrationCode), fetching }
}
