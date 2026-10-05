import { useSelector } from 'react-redux'
import { State } from '../store'
import { DEVICE_SESSIONS_DEFAULT } from '../constants'

/* The one gate for the device-session features (docs/superpowers/specs/2026-09-30-device-sessions-ui-design.md):
   the device agent's status and upgrades, and what follows. A Test UI setting, and only while Test UI is on, so
   "Disable Test UI" turns it off with the rest and nobody is left in it by accident — except on a stage whose API
   serves device sessions to every account (DEVICE_SESSIONS_DEFAULT, solo), where they are on unless turned off in
   the Test settings. Routes, tabs, sections and their queries all hang off it — and each still hides itself where the
   API does not serve device sessions. */
export const selectDeviceSessionsSetting = (state: State): boolean =>
  DEVICE_SESSIONS_DEFAULT ? state.ui.deviceSessions !== false : !!state.ui.deviceSessions

export const selectDeviceSessions = (state: State): boolean =>
  selectDeviceSessionsSetting(state) && (DEVICE_SESSIONS_DEFAULT || !!state.ui.testUI)

export const useDeviceSessions = (): boolean => useSelector(selectDeviceSessions)
