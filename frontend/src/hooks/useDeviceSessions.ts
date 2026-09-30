import { useSelector } from 'react-redux'
import { State } from '../store'

/* The one gate for the device-session features (docs/superpowers/specs/2026-09-30-device-sessions-ui-design.md):
   the device agent's status and upgrades, and what follows. A Test UI setting, and only while Test UI is on, so
   "Disable Test UI" turns it off with the rest and nobody is left in it by accident. Routes, tabs, sections and
   their queries all hang off it — and each still hides itself where the API does not serve device sessions. */
export const selectDeviceSessions = (state: State): boolean => !!state.ui.testUI && !!state.ui.deviceSessions

export const useDeviceSessions = (): boolean => useSelector(selectDeviceSessions)
