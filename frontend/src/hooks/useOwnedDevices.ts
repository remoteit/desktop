import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { State } from '../store'
import { getUserId } from '../selectors/state'
import { graphQLFetchOwnedDevices } from '../services/graphQLDevice'

const SHOWN = 10

export type OwnedDevice = { id: string; name: string; state: string; platform: number }

export type OwnedDevices = { devices: OwnedDevice[]; total: number; thisDeviceOwned: boolean }

export function useOwnedDevices(enabled: boolean) {
  const userId = useSelector(getUserId)
  const thisId = useSelector((state: State) => state.backend.thisId)
  const [owned, setOwned] = useState<OwnedDevices>()

  useEffect(() => {
    if (!enabled || !userId || owned) return
    let current = true
    graphQLFetchOwnedDevices(userId, SHOWN + 1, thisId).then(result => {
      if (!current || result === 'ERROR') return
      const login = result.data?.data?.login
      const items: OwnedDevice[] = login?.account?.devices?.items || []
      const thisDeviceOwned = !!login?.device?.some((device: { owner?: { id: string } }) => device.owner?.id === userId)
      setOwned({
        devices: items.filter(device => device.id !== thisId).slice(0, SHOWN),
        total: (login?.account?.devices?.total || 0) - (thisDeviceOwned ? 1 : 0),
        thisDeviceOwned,
      })
    })
    return () => {
      current = false
    }
  }, [enabled, userId])

  return owned
}
