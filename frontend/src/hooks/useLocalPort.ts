import { useCallback, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { State } from '../store'
import { useDeviceSessions } from './useDeviceSessions'
import {
  LocalPort,
  Machine,
  closeLocalPort,
  graphQLLocalPort,
  offersLocalPorts,
  openLocalPort,
  scopeFor,
  thisMachine,
} from '../services/localPorts'

export type LocalPortState = {
  offered: boolean // this machine runs our daemon, and local ports are offered on it
  local?: LocalPort // the service's local port here, open or closed, once read
  error?: string // why the last open was refused, in graphql's words
  busy: boolean
  open: (port?: number, https?: boolean) => Promise<void>
  close: () => Promise<void>
}

const POLL_MS = 1500
const POLL_FOR_MS = 30_000

/* A service's local port on this machine (services/localPorts): whether it is offered here, what it is now, and
   opening and closing it. Read once; after an open, read again until the device has applied it (listening) or said
   why not (failed). */
export function useLocalPort(serviceId?: string, deviceId?: string): LocalPortState {
  const enabled = useDeviceSessions()
  const phoneOverride = useSelector((state: State) => !!state.ui.testUI && !!state.ui.localPortsOnPhone)
  const userId = useSelector((state: State) => state.auth?.user?.id)
  const [machine, setMachine] = useState<Machine | null>()
  const [local, setLocal] = useState<LocalPort>()
  const [error, setError] = useState<string>()
  const [busy, setBusy] = useState(false)
  const [polling, setPolling] = useState(0)

  useEffect(() => {
    if (!enabled) return
    let live = true
    thisMachine().then(found => live && setMachine(found))
    return () => {
      live = false
    }
  }, [enabled])

  // A service on this machine's own device has no local port: it is here already.
  const offered = enabled && offersLocalPorts(machine, phoneOverride) && !!serviceId && machine?.id !== deviceId
  const machineId = offered ? machine?.id : undefined
  // Opened here by the person signed in on this machine: their account's alone (services/localPorts scopeFor).
  const scope = scopeFor(machine, userId)

  useEffect(() => {
    setLocal(undefined)
    setError(undefined)
    if (!machineId || !serviceId) return
    let live = true
    graphQLLocalPort(machineId, serviceId).then(found => live && setLocal(found ?? undefined))
    return () => {
      live = false
    }
  }, [machineId, serviceId])

  useEffect(() => {
    if (!polling || !machineId || !serviceId || local?.state !== 'pending') return
    if (Date.now() - polling > POLL_FOR_MS) return
    const timer = setTimeout(async () => {
      const found = await graphQLLocalPort(machineId, serviceId)
      if (found) setLocal(found)
      else setPolling(0)
    }, POLL_MS)
    return () => clearTimeout(timer)
  }, [polling, local, machineId, serviceId])

  const open = useCallback(
    async (port?: number, https?: boolean) => {
      if (!machineId || !serviceId) return
      setBusy(true)
      setError(undefined)
      const answer = await openLocalPort(machineId, serviceId, port, https, scope)
      setBusy(false)
      if ('reason' in answer) return setError(answer.reason || undefined)
      setLocal(answer)
      setPolling(Date.now())
    },
    [machineId, serviceId, scope]
  )

  const close = useCallback(async () => {
    if (!machineId || !serviceId) return
    setBusy(true)
    const answer = await closeLocalPort(machineId, serviceId)
    setBusy(false)
    if (answer) setLocal(answer)
  }, [machineId, serviceId])

  return { offered, local, error, busy, open, close }
}
