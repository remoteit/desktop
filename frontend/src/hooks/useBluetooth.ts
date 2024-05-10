import bluetooth, { BluetoothState } from '../services/bluetooth'
import { useEffect, useState } from 'react'

export function useBluetooth() {
  const [state, setState] = useState<BluetoothState>(bluetooth.state)

  useEffect(() => {
    bluetooth.on('updated', () => setState({ ...bluetooth.state }))
  }, [])

  return state
}
