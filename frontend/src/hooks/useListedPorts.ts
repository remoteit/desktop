import { useEffect, useRef, useState } from 'react'
import { ListedPort, ThisDevice, thisDevice } from '../services/thisDevice'
import { listedPorts } from '../services/localPorts'

/* The machine's local ports as this OS account sees them (services/localPorts listedPorts): read from the shell's
   status while `active`, kept current from its status events, and read again whenever `again` changes — an open or a
   close the daemon has just applied. undefined: no shell here, or a shell or daemon that does not list them. */
export function useListedPorts(active: boolean, again?: unknown): ListedPort[] | undefined {
  const [ports, setPorts] = useState<ListedPort[]>()
  const shell = useRef<ThisDevice>()

  useEffect(() => {
    setPorts(undefined)
    shell.current = undefined
    if (!active) return
    let live = true
    let off: (() => void) | undefined
    thisDevice().then(found => {
      if (!live || !found?.compatible || !found.has('status')) return
      shell.current = found
      const take = (status: Parameters<typeof listedPorts>[0]) => live && setPorts(listedPorts(status))
      off = found.on('status', take)
      found.call('status', {}).then(take, () => {})
    })
    return () => {
      live = false
      off?.()
    }
  }, [active])

  useEffect(() => {
    if (!active || again === undefined || !shell.current) return
    let live = true
    shell.current.call('status', {}).then(
      status => live && setPorts(listedPorts(status)),
      () => {}
    )
    return () => {
      live = false
    }
  }, [active, again])

  return ports
}
