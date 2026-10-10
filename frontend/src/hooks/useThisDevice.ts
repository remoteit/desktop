import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { State } from '../store'
import { THIS_DEVICE_DEFAULT } from '../constants'
import { thisDevice, ThisDevice } from '../services/thisDevice'

/** The machine this page runs on (services/thisDevice): undefined while it is asked, null where there is none — a plain
 *  browser, or an app that did not answer. */
export function useThisDevice(): ThisDevice | null | undefined {
  const [device, setDevice] = useState<ThisDevice | null | undefined>(undefined)
  useEffect(() => {
    let live = true
    thisDevice().then(d => live && setDevice(d ?? null))
    return () => {
      live = false
    }
  }, [])
  return device
}

/* The "This device" page's flag (device-package docs/one-app-plan.md): on in an embedded build, else with Test UI. The
   page shows only where thisDevice is present as well. */
export const selectThisDevicePage = (state: State): boolean => THIS_DEVICE_DEFAULT || !!state.ui.testUI
export const useThisDevicePage = (): boolean => useSelector(selectThisDevicePage)
