import React, { useEffect, useState } from 'react'
import { State, Dispatch } from '../store'
import { useSelector, useDispatch } from 'react-redux'
import { Tooltip, Typography, Stack, Box, Button, CircularProgress } from '@mui/material'
import { OnboardMessage } from './OnboardMessage'
import { Link } from './Link'
import { Icon } from './Icon'

type Props = {
  next: () => void
}

export const OnboardScanning: React.FC<Props> = ({ next }) => {
  const { connected, searching, wlan, message, severity } = useSelector((state: State) => state.bluetooth)
  const dispatch = useDispatch<Dispatch>()
  const [ready, setReady] = useState<boolean>(false)

  useEffect(() => {
    ;(async () => {
      console.log('disconnecting...')
      await dispatch.bluetooth.stop()
      console.log('disconnected')
      setReady(true)
    })()
  }, [])

  useEffect(() => {
    if (ready && connected) next()
  }, [connected, wlan, ready])

  const onScan = async () => {
    await dispatch.bluetooth.start()
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
              <Tooltip
                arrow
                enterTouchDelay={0}
                leaveTouchDelay={10000}
                placement="top"
                title="Start your Pi with Remote.It Bluetooth commissioning. Your
            device will be discoverable for five minutes after startup."
              >
                <Icon name="circle-question" size="lg" color="grayDark" inline inlineLeft />
              </Tooltip>
            </>
          )}
        </Stack>
      </Box>
    </>
  )
}
