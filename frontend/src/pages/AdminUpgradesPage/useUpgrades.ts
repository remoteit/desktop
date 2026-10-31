import { useCallback, useEffect, useRef, useState } from 'react'
import { UNSUPPORTED } from '../../services/graphQLDaemon'
import {
  DaemonChannel,
  RolloutRun,
  graphQLDaemonChannels,
  graphQLDaemonRollouts,
} from '../../services/graphQLDaemonRollout'
import { POLL_MS, active } from './rolloutHelpers'

export const RUN_LIMIT = 50

export type Upgrades = {
  channels?: DaemonChannel[] | 'ERROR' | typeof UNSUPPORTED
  runs?: RolloutRun[] | 'ERROR' | typeof UNSUPPORTED | false // false: this API has no rollout controller
  loading: boolean
  fetchedAt?: number
  live: boolean
  reload: () => Promise<void>
}

// A channel's delivery still walking its devices is live too: its numbers move between reads.
const delivering = (channels: Upgrades['channels']) =>
  Array.isArray(channels) && channels.some(c => c.delivery && c.delivery.state !== 'done')

// Reads the given loader now, then every POLL_MS while `live` says there is something to watch.
export function usePoll(load: () => Promise<void>, live: boolean) {
  useEffect(() => {
    load()
  }, [load])
  useEffect(() => {
    if (!live) return
    const id = setInterval(load, POLL_MS)
    return () => clearInterval(id)
  }, [live, load])
}

export function useUpgrades(): Upgrades {
  const [channels, setChannels] = useState<Upgrades['channels']>()
  const [runs, setRuns] = useState<Upgrades['runs']>()
  const [loading, setLoading] = useState(false)
  const [fetchedAt, setFetchedAt] = useState<number>()
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  const reload = useCallback(async () => {
    setLoading(true)
    const [nextChannels, nextRuns] = await Promise.all([
      graphQLDaemonChannels(),
      graphQLDaemonRollouts({ limit: RUN_LIMIT }),
    ])
    if (!mounted.current) return
    setChannels(nextChannels === null ? [] : nextChannels)
    setRuns(nextRuns)
    setFetchedAt(Date.now())
    setLoading(false)
  }, [])

  const live = (Array.isArray(runs) && runs.some(active)) || delivering(channels)
  usePoll(reload, live)

  return { channels, runs, loading, fetchedAt, live, reload }
}
