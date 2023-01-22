import { useState } from 'react'
import { REGEX_VALID_IP, REGEX_VALID_HOSTNAME } from '../shared/constants'
import { ApplicationState, Dispatch } from '../store'
import { useDispatch, useSelector } from 'react-redux'
import { emit } from '../services/Controller'

type Props = {
  port?: number
  host?: string
}

export function usePortScan(): [typeof reachablePort, (props: Props) => void] {
  const { reachablePort } = useSelector((state: ApplicationState) => state.backend)
  const [lastScan, setLastScan] = useState<Props>({})
  const { backend } = useDispatch<Dispatch>()

  function portScan({ port, host }: Props) {
    if (lastScan.port === port && lastScan.host === host) return

    if (!host || !port) {
      backend.set({ reachablePort: 'INVALID' })
      return
    }

    if (REGEX_VALID_IP.test(host) || REGEX_VALID_HOSTNAME.test(host)) {
      backend.set({ reachablePort: 'SCANNING' })
      emit('reachablePort', { port, host })
      setLastScan({ port, host })
      console.log('PORT SCANNING', host, port)
    } else {
      backend.set({ reachablePort: 'INVALID' })
    }
  }

  return [reachablePort, portScan]
}
