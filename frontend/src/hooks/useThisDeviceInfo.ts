import { useEffect, useState } from 'react'
import { BridgeInfo, ThisDevice } from '../services/thisDevice'

/** The shell's info as it is now, re-rendering whenever it changes (thisDevice 1.7.0's info event): what a component
 *  shows or reads by device.has() follows the shell, not what it offered when the page booted. */
export function useThisDeviceInfo(device: ThisDevice | null | undefined): BridgeInfo | undefined {
  const [, setInfo] = useState<BridgeInfo>()
  useEffect(() => {
    if (!device) return
    setInfo(device.info) // a change before this listened
    return device.onInfo(setInfo)
  }, [device])
  return device?.info
}
