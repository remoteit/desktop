import { useState } from 'react'
import { REGEX_VALID_IP, REGEX_VALID_HOSTNAME } from '../shared/constants'
import { ApplicationState, Dispatch } from '../store'
import { useDispatch, useSelector } from 'react-redux'
import { emit } from '../services/Controller'

type Props = {
  port?: number
  host?: string
}

export function usePortScan(props: Props): [boolean | undefined, (props: Props) => void] {
  const portFound = useSelector((state: ApplicationState) => state.backend.reachablePort)
  const [lastScan, setLastScan] = useState<Props>({})
  const { backend } = useDispatch<Dispatch>()

  function portScan({ port, host }: Props) {
    if ((lastScan.port === port && lastScan.host === host) || !host || !port) return

    if (REGEX_VALID_IP.test(host) || REGEX_VALID_HOSTNAME.test(host)) {
      backend.set({ reachablePortLoading: true })
      emit('reachablePort', { port, host })
      setLastScan({ port, host })
    } else {
      backend.set({ reachablePort: false })
    }
  }

  return [portFound, portScan]
}
