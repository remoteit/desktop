import React, { useEffect, useState } from 'react'
import { State, Dispatch } from '../store'
import { useSelector, useDispatch } from 'react-redux'
import { Typography, Stack, Box, Button, CircularProgress, Collapse } from '@mui/material'
import { OnboardMessage } from './OnboardMessage'
import { IconButton } from '../buttons/IconButton'
import { Notice } from './Notice'
import { Link } from './Link'

type Props = {
  next: () => void
}

export const OnboardScanning: React.FC<Props> = ({ next }) => {
  const { connected, searching, wlan, message, severity, enabledMessage, enabledSeverity } = useSelector((state: State) => state.bluetooth)
  const dispatch = useDispatch<Dispatch>()
  const [ready, setReady] = useState<boolean>(false)
  const [help, setHelp] = useState<boolean>(false)

  useEffect(() => {
    ;(async () => {
      console.log('disconnecting...')
      await dispatch.bluetooth.init()
      await checkBluetooth()
      await dispatch.bluetooth.stop()
      console.log('disconnected')
      setReady(true)
    })()
  }, [])

  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        // Handle the event when the page becomes visible again
        console.log('Page is visible again');
        await checkBluetooth()
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    if (ready && connected) next()
  }, [connected, wlan, ready])

  const checkBluetooth = async () => {
    if(!await dispatch.bluetooth.isBluetoothEnabled()) {
      // console.log('Bluetooth is not enabled')
      // Set state message to inform user that bluetooth is not enabled
      dispatch.bluetooth.set({ enabledMessage: 'Bluetooth is disabled', enabledSeverity: 'error' })
    } else {
      // console.log('Bluetooth is enabled')
      console.log('message: ', message)

      dispatch.bluetooth.set({ enabledMessage: '', enabledSeverity: 'info' })
    }
  }

  const onScan = async () => {
    if(await dispatch.bluetooth.isBluetoothEnabled()) {
      await dispatch.bluetooth.start()
    } 
  }

  const onCancel = async () => {
    await dispatch.bluetooth.cancel()
  }

  return (
    <>
      <Box marginX={2} marginTop={4}>
        <Stack flexDirection="row" alignItems="center" marginY={2}>
          <Typography variant="h2">Bluetooth Commissioning</Typography>
        </Stack>
        <Typography variant="caption" color="grayDarker.main">
          <b>Note:</b> This setup is only for Raspberry Pis that are enabled with Remote.It. If you already have a Pi
          online<Link to="/add/raspberrypi">add remote access.</Link>
        </Typography>
        <OnboardMessage message={enabledMessage} severity={enabledSeverity} />
        <OnboardMessage message={message} severity={severity} />
        <Stack flexDirection="row" alignItems="center" marginTop={5} marginBottom={3}>
          {searching ? (
            <>
              <CircularProgress size={22} thickness={5} sx={{ marginRight: 3 }} />
              <Button onClick={onCancel}>cancel</Button>
            </>
          ) : (
            <>
              <Button variant="contained" onClick={onScan}>
                scan
              </Button>
              <IconButton
                name="circle-question"
                size="lg"
                color="grayDark"
                title="Help"
                onClick={() => setHelp(!help)}
                inline
              />
            </>
          )}
        </Stack>
        <Collapse in={help}>
          <Notice fullWidth>
            <strong>Turn on your Pi with Remote.It Bluetooth Onboarding now.</strong>
            <em>
              On first startup, the device could take up to 2 minutes to appear, and it will be discoverable for 10
              minutes after.
            </em>
          </Notice>
        </Collapse>
      </Box>
    </>
  )
}
