import React from 'react'
import { Alert, Box } from '@mui/material'
import { DeviceStatus, ThisDevice } from '../../services/thisDevice'
import { useThisDeviceModel } from './model'
import { ThisDeviceMain } from './ThisDeviceMain'
import { ThisDeviceDetails } from './ThisDeviceDetails'
import { ThisDeviceAdvanced } from './ThisDeviceAdvanced'
import { ThisDeviceSettings } from './ThisDeviceSettings'
import { ReadCloudExits } from './cloudExits'

// One of This device's pages (pages/ThisDevicePage.tsx): the bridge's alone, nothing of the store's.
export type ThisDevicePart = 'main' | 'settings' | 'details' | 'advanced'

// The content column's width: rows past it are too long to read across on a wide window.
export const CONTENT_WIDTH = 720

// signedIn false: nothing of the account's (the device's page in remote.it, renaming it) — the bridge's parts alone.
// renderName: the device's name as the page draws it, editable where it can be (the page's, signed in); plain without.
// renderExitUsage: the account's public-exit transfer under the exit picker (the page's, signed in); nothing without.
// exitRunsHref: the device's page of what it runs, where leaving an exit is (the page's, signed in); nothing without.
// readExits: what the account knows of the engine's exits — each one's devices counted, the device of the exit in use
// (the page's, signed in); the engine's list alone without it.
// renderDevices: "Your devices" — what this machine can reach, signed in, or the sign-in, signed out (the page's).
export const ThisDeviceView: React.FC<{
  device: ThisDevice
  signedIn?: boolean
  part?: ThisDevicePart
  renderName?: (uid: string, name: string) => React.ReactNode
  renderExitUsage?: (shown: boolean) => React.ReactNode
  readExits?: ReadCloudExits
  renderRegistration?: (status: DeviceStatus | undefined) => React.ReactNode
  exitRunsHref?: (uid: string) => string
  renderDevices?: (uid: string | undefined) => React.ReactNode
}> = ({
  device,
  signedIn = true,
  part = 'main',
  renderName,
  renderExitUsage,
  readExits,
  renderRegistration,
  exitRunsHref,
  renderDevices,
}) => {
  const m = useThisDeviceModel(device)
  const { t } = m

  if (!device.compatible)
    return (
      <Box paddingX={4} paddingY={2}>
        <Alert severity="warning">
          {t(
            'thisDevice.update',
            'This page needs a newer Remote.It app. Update the app to use it.'
          )}
        </Alert>
      </Box>
    )

  const d = m.status?.device
  return (
    <Box paddingX={{ xs: 1, sm: 2 }} maxWidth={CONTENT_WIDTH} data-this-device={part}>
      {m.error && (
        <Alert severity="error" onClose={() => m.setError(undefined)} sx={{ marginX: 2, marginBottom: 1 }}>
          {m.error}
        </Alert>
      )}
      {m.notice && (
        <Alert severity="success" onClose={() => m.setNotice(undefined)} sx={{ marginX: 2, marginBottom: 1 }}>
          {m.notice}
        </Alert>
      )}
      {part === 'main' && renderRegistration?.(m.status)}
      {part === 'settings' ? (
        <ThisDeviceSettings m={m} signedIn={signedIn} />
      ) : part === 'details' ? (
        <ThisDeviceDetails m={m} />
      ) : part === 'advanced' ? (
        <ThisDeviceAdvanced device={device} m={m} exitRunsHref={exitRunsHref} />
      ) : (
        <ThisDeviceMain
          device={device}
          m={m}
          signedIn={signedIn}
          nameEditor={d?.uid && renderName ? renderName(d.uid, d.name) : undefined}
          renderExitUsage={renderExitUsage}
          readExits={readExits}
          devices={renderDevices?.(d?.uid)}
        />
      )}
    </Box>
  )
}
