import React, { useContext } from 'react'
import { useTranslation } from 'react-i18next'
import { Box, CircularProgress, ListItem, ListItemText, Typography } from '@mui/material'
import { useSelector } from 'react-redux'
import { useRouteMatch } from 'react-router-dom'
import { State } from '../store'
import { Container } from '../components/Container'
import { IconButton } from '../buttons/IconButton'
import { ThisDeviceSignIn } from '../components/ThisDeviceSignIn'
import { DeviceNameSetting } from '../components/DeviceNameSetting'
import { DeviceContext } from '../services/Context'
import { selectDevice } from '../selectors/devices'
import { useThisDevice } from '../hooks/useThisDevice'
import { ThisDevicePart, ThisDeviceView } from '../components/thisDevice/ThisDeviceView'

/* "This device" (device-package docs/one-app-plan.md): the machine this page runs on, the same page on every
   platform. What it shows comes from the shell's capabilities only (thisDevice.info().capabilities) — never from which
   platform it is — so the menu on a Mac and the phone's app draw it alike, each with what it can do.

   Signed out, or offline, in an app it is the whole portal (components/ThisDeviceApp): the bridge is the machine's own,
   so everything from it works; what is the account's — the device's page in remote.it, renaming it — waits for the
   sign-in, which is offered at the top.

   Three pages (Evan, 2026-10-25), so what is used most is what is seen first, at a phone's width too:
     /this-device           its name and whether remote.it runs here, the three switches — Access remote devices,
                            remote.it Protect, Allow remote access to services — and the way to the other two;
     /this-device/details   what there is to know of it: owner, address, UID, versions, what it serves, stages;
     /this-device/advanced  what is changed seldom: its other features and the relay, permissions, Open at login,
                            diagnostics, and its removal.
   Everything the menu's own Settings window shows is on one of them (1.5.0, "Settings → This device"). */

export const ThisDevicePage: React.FC = () => {
  const { t } = useTranslation()
  const device = useThisDevice()
  const signedIn = useSelector((state: State) => state.auth.authenticated)
  const match = useRouteMatch<{ part?: string }>('/this-device/:part')
  const part: ThisDevicePart =
    match?.params.part === 'details' ? 'details' : match?.params.part === 'advanced' ? 'advanced' : 'main'
  const title =
    part === 'details'
      ? t('thisDevice.details', 'Details')
      : part === 'advanced'
      ? t('thisDevice.advanced', 'Advanced')
      : t('thisDevice.title', 'This device')
  return (
    <Container
      gutterBottom
      header={
        <Box display="flex" alignItems="center">
          {part !== 'main' && (
            <IconButton icon="chevron-left" to="/this-device" title={t('thisDevice.back', 'This device')} />
          )}
          <Typography variant="h1">{title}</Typography>
        </Box>
      }
    >
      {device === undefined ? (
        <Box display="flex" justifyContent="center" padding={4}>
          <CircularProgress size={28} />
        </Box>
      ) : device === null ? (
        <Box paddingX={4} paddingY={2}>
          <Typography variant="body2" color="textSecondary">
            {t('thisDevice.absent', 'This page shows the machine the remote.it app runs on. Open it in the app.')}
          </Typography>
        </Box>
      ) : (
        <>
          {!signedIn && part === 'main' && (
            <Box paddingX={2}>
              <ThisDeviceSignIn />
            </Box>
          )}
          <ThisDeviceView
            device={device}
            signedIn={signedIn}
            part={part}
            renderName={signedIn ? (uid, name) => <ThisDeviceName uid={uid} name={name} /> : undefined}
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
