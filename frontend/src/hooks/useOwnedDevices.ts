import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { State } from '../store'
import { getUserId } from '../selectors/state'
import { graphQLFetchOwnedDevices } from '../services/graphQLDevice'

export const OWNED_DEVICES_SHOWN = 10

export type OwnedDevice = { id: string; name: string; state: string; platform: number }

export type OwnedDevices = { devices: OwnedDevice[]; total: number; thisDeviceOwned: boolean }

export function parseOwnedDevices(login: any, userId: string, thisId?: string): OwnedDevices {
  const items: OwnedDevice[] = login?.account?.devices?.items || []
  const thisDeviceOwned = !!login?.device?.some((device: { owner?: { id: string } }) => device.owner?.id === userId)
  return {
    devices: items.filter(device => device.id !== thisId).slice(0, OWNED_DEVICES_SHOWN),
    total: (login?.account?.devices?.total || 0) - (thisDeviceOwned ? 1 : 0),
    thisDeviceOwned,
  }
}

export function useOwnedDevices(enabled: boolean) {
  const userId = useSelector(getUserId)
  const thisId = useSelector((state: State) => state.backend.thisId)
  const [owned, setOwned] = useState<OwnedDevices>()
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!enabled || !userId || owned) return
    let current = true
    setFailed(false)
    graphQLFetchOwnedDevices(userId, OWNED_DEVICES_SHOWN + 1, thisId).then(result => {
      if (!current) return
      if (result === 'ERROR') return setFailed(true)
      setOwned(parseOwnedDevices(result.data?.data?.login, userId, thisId))
    })
    return () => {
      current = false
    }
  }, [enabled, userId])

  return { owned, failed }
}
