import React from 'react'
import { Alert, Box } from '@mui/material'
import { BRIDGE_VERSION, ThisDevice } from '../../services/thisDevice'
import { useThisDeviceModel } from './model'
import { ThisDeviceMain } from './ThisDeviceMain'
import { ThisDeviceDetails } from './ThisDeviceDetails'
import { ThisDeviceAdvanced } from './ThisDeviceAdvanced'
import { ReadCloudExits } from './cloudExits'

// One of This device's three pages (pages/ThisDevicePage.tsx): the bridge's alone, nothing of the store's.
export type ThisDevicePart = 'main' | 'details' | 'advanced'

// signedIn false: nothing of the account's (the device's page in remote.it, renaming it) — the bridge's parts alone.
// renderName: the device's name as the page draws it, editable where it can be (the page's, signed in); plain without.
// renderExitUsage: the account's public-exit transfer under the exit picker (the page's, signed in); nothing without.
// readExits: what the account knows of the engine's exits — each one's devices counted, the device of the exit in use
// (the page's, signed in); the engine's list alone without it.
export const ThisDeviceView: React.FC<{
  device: ThisDevice
  signedIn?: boolean
  part?: ThisDevicePart
  renderName?: (uid: string, name: string) => React.ReactNode
  renderExitUsage?: (shown: boolean) => React.ReactNode
  readExits?: ReadCloudExits
}> = ({ device, signedIn = true, part = 'main', renderName, renderExitUsage, readExits }) => {
  const m = useThisDeviceModel(device)
  const { t } = m

  if (!device.compatible)
    return (
      <Box paddingX={4} paddingY={2}>
        <Alert severity="warning">
          {t(
            'thisDevice.update',
            'This page needs a newer remote.it app (bridge {{page}}; the app has {{app}}). Update the app to use it.',
            { page: BRIDGE_VERSION, app: device.info.bridgeVersion }
          )}
        </Alert>
      </Box>
    )

  const d = m.status?.device
  return (
    <Box paddingX={2} data-this-device={part}>
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
      {part === 'details' ? (
        <ThisDeviceDetails m={m} />
      ) : part === 'advanced' ? (
        <ThisDeviceAdvanced device={device} m={m} />
      ) : (
        <ThisDeviceMain
          device={device}
          m={m}
          signedIn={signedIn}
          nameEditor={d?.uid && renderName ? renderName(d.uid, d.name) : undefined}
          renderExitUsage={renderExitUsage}
          readExits={readExits}
        />
      )}
    </Box>
  )
}

