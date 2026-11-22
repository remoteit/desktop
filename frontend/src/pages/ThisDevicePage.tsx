import React, { useContext } from 'react'
import { useTranslation } from 'react-i18next'
import { Box, CircularProgress, ListItem, ListItemText, Typography } from '@mui/material'
import { useSelector } from 'react-redux'
import { useRouteMatch } from 'react-router-dom'
import { State } from '../store'
import { Container } from '../components/Container'
import { DeviceRegistration } from '../components/thisDevice/DeviceRegistration'
import { ThisDeviceSignIn } from '../components/ThisDeviceSignIn'
import { DeviceNameSetting } from '../components/DeviceNameSetting'
import { DeviceContext } from '../services/Context'
import { selectDevice } from '../selectors/devices'
import { useThisDevice } from '../hooks/useThisDevice'
import { useDeviceSessions } from '../hooks/useDeviceSessions'
import { ThisDevicePart, ThisDeviceView } from '../components/thisDevice/ThisDeviceView'
import { TransferUsageHint } from '../components/TransferUsage'
import { readCloudExits } from '../components/thisDevice/readCloudExits'
import { ThisDeviceDevices } from '../components/thisDevice/ThisDeviceDevices'

/* "This device" (device-package docs/one-app-plan.md): the machine this page runs on, and the app's home — the same
   page on every platform. What it shows comes from the shell's capabilities only (thisDevice.info().capabilities),
   never from which platform it is, so the menu on a Mac and the phone's app draw it alike, each with what it can do.

   Signed out, or offline, in an app it is the whole portal (components/ThisDeviceApp): the bridge is the machine's own,
   so its controls work; what is the account's waits for the sign-in, offered where "Your devices" would be.

   Its pages, so what is used most is what is seen first, at a phone's width too:
     /this-device           its name and state, "Your devices", the three controls, and Settings;
     /this-device/settings  the way to the other two, and to the device's page in the account;
     /this-device/details   what there is to know of it: owner, address, UID, versions, what it shares, stages;
     /this-device/advanced  what is changed seldom: its other features and the relay, permissions, Open at login,
                            diagnostics, and its removal. */

export const ThisDevicePage: React.FC = () => {
  const { t } = useTranslation()
  const device = useThisDevice()
  const signedIn = useSelector((state: State) => state.auth.authenticated)
  const userId = useSelector((state: State) => state.auth.user?.id)
  const deviceSessions = useDeviceSessions()
  const match = useRouteMatch<{ part?: string }>('/this-device/:part')
  const named = match?.params.part
  const part: ThisDevicePart =
    named === 'settings' || named === 'details' || named === 'advanced' ? named : 'main'
  const title =
    part === 'settings'
      ? t('thisDevice.settings', 'Settings')
      : part === 'details'
      ? t('thisDevice.details', 'Details')
      : part === 'advanced'
      ? t('thisDevice.advanced', 'Advanced')
      : t('thisDevice.title', 'This device')
  return (
    <Container
      gutterBottom
      // The sub-pages' way back is the app's own back arrow, at the top.
      header={<Typography variant="h1">{title}</Typography>}
    >
      {device === undefined ? (
        <Box display="flex" justifyContent="center" padding={4}>
          <CircularProgress size={28} />
        </Box>
      ) : device === null ? (
        <Box paddingX={4.5} paddingY={2}>
          <Typography variant="body2" color="textSecondary">
            {t('thisDevice.absent', 'This page shows the computer or phone running the Remote.It app. Open it in the app.')}
          </Typography>
        </Box>
      ) : (
        <>
          <ThisDeviceView
            device={device}
            signedIn={signedIn}
            part={part}
            renderName={signedIn ? (uid, name) => <ThisDeviceName uid={uid} name={name} /> : undefined}
            // Exit transfer is charged to the account that used the exit: the person signed in here.
            renderExitUsage={
              signedIn ? shown => <TransferUsageHint accountId={userId} kind="exit" shown={shown} /> : undefined
            }
            readExits={signedIn ? readCloudExits : undefined}
            exitRunsHref={signedIn && deviceSessions ? uid => `#/devices/${uid}/runs` : undefined}
            renderDevices={uid => (signedIn ? <ThisDeviceDevices uid={uid} /> : <ThisDeviceSignIn />)}
            renderRegistration={
              signedIn && device.has('registration')
                ? status => <DeviceRegistration device={device} status={status} />
                : undefined
            }
          />
        </>
      )}
    </Container>
  )
}

// The device's name, renamed in the account where the person may manage it (components/DeviceNameSetting: the same
// field, and its offer to move the DNS name too); plain while the account's copy of it is not loaded, or theirs to
// manage. The machine's own name follows when the device's document next comes.
const ThisDeviceName: React.FC<{ uid: string; name: string }> = ({ uid, name }) => {
  const context = useContext(DeviceContext)
  const account = useSelector((state: State) => selectDevice(state, undefined, uid))
  if (!account?.permissions?.includes('MANAGE'))
    return (
      <ListItem>
        <ListItemText primary={name} primaryTypographyProps={{ variant: 'h3' }} data-name />
      </ListItem>
    )
  return (
    <DeviceContext.Provider value={{ ...context, device: account }}>
      <DeviceNameSetting />
    </DeviceContext.Provider>
  )
}
