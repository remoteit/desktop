import { useEffect, useState } from 'react'
import { gatewayURL } from '../services/browserGateway'

const PROBE_MS = 4000
const answers = new Map<string, Promise<boolean | undefined>>()

/** Whether this browser can open a service's address at all: an address that does not resolve publicly (a stage
 *  without the wildcard name, remoteit/desktop#1387) fails before any request is made, so its tab would only show the
 *  browser's own error. undefined while asking, or when the answer took too long to count. */
export function addressReachable(name: string): Promise<boolean | undefined> {
  let answer = answers.get(name)
  if (!answer) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), PROBE_MS)
    answer = fetch(gatewayURL(name), { mode: 'no-cors', cache: 'no-store', signal: controller.signal })
      .then(() => true as boolean | undefined)
      .catch(() => (controller.signal.aborted ? undefined : false))
      .finally(() => clearTimeout(timer))
    answers.set(name, answer)
  }
  return answer
}

export function useAddressReachable(name?: string): boolean | undefined {
  const [reachable, setReachable] = useState<boolean>()
  useEffect(() => {
    setReachable(undefined)
    if (!name) return
    let live = true
    addressReachable(name).then(answer => live && setReachable(answer))
    return () => {
      live = false
    }
  }, [name])
  return reachable
}
