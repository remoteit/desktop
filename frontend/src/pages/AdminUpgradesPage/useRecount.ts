import { useCallback, useEffect, useRef, useState } from 'react'
import { refreshDaemonRollout } from '../../services/graphQLDaemonRollout'
import { recounted } from './rolloutHelpers'

export { recounted }

export const RECOUNT_POLL_MS = 3000
export const RECOUNT_WAIT_MS = 2 * 60 * 1000
export type RecountState = 'idle' | 'recounting' | 'slow'

/* The refresh button as a recount: where graphql offers refreshDaemonRollout, ask it for each channel shown, then read
   every 3 s until a walk newer than the click lands — two minutes at most, then back to the page's own polling with a
   note. Without it, a re-read as before. `checked` gives the shown channels' walk times as last read. */
export function useRecount(
  channels: () => string[],
  load: () => Promise<void>,
  checked: () => (string | null | undefined)[]
) {
  const [state, setState] = useState<RecountState>('idle')
  const [problem, setProblem] = useState<string>()
  const since = useRef(0)
  const checkedRef = useRef(checked)
  checkedRef.current = checked

  const recount = useCallback(async () => {
    setProblem(undefined)
    const names = channels()
    const started = Date.now()
    const asked = await Promise.all(names.map(name => refreshDaemonRollout(name)))
    const refused = asked.find(answer => typeof answer === 'object') as { reason: string } | undefined
    if (refused) setProblem(refused.reason)
    if (!asked.some(answer => answer === true)) return load()
    since.current = started
    setState('recounting')
    await load()
  }, [channels, load])

  useEffect(() => {
    if (state !== 'recounting') return
    if (recounted(checkedRef.current(), since.current)) return setState('idle')
    const poll = setInterval(async () => {
      await load()
      if (Date.now() - since.current > RECOUNT_WAIT_MS) setState('slow')
    }, RECOUNT_POLL_MS)
    return () => clearInterval(poll)
  }, [state, load])

  // Each read: a walk newer than the click ends the recount, a slow one's too.
  useEffect(() => {
    if (state !== 'idle' && recounted(checked(), since.current)) setState('idle')
  })

  return { recount, state, problem }
}
