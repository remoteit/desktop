import React, { useEffect } from 'react'
import { State, Dispatch } from '../store'
import { useSelector, useDispatch } from 'react-redux'
import { Tooltip, Typography, Stack, Box, Button, List, ListItem, ListSubheader, CircularProgress } from '@mui/material'
import { ListItemLink } from './ListItemLink'
import { OnboardError } from './OnboardError'
import { Icon } from './Icon'

type Props = {
  next: () => void
}

export const OnboardScanning: React.FC<Props> = ({ next }) => {
  const { initialized, connected, processing, wifi, error } = useSelector((state: State) => state.bluetooth)
  const dispatch = useDispatch<Dispatch>()

  useEffect(() => {
    dispatch.bluetooth.stop()
  }, [])

  useEffect(() => {
    if (connected && wifi !== 'CONNECTED') next()
  }, [connected, wifi])

  const onScan = async () => {
    await dispatch.bluetooth.start()
    console.log('SCANNING STATE', initialized, connected, processing, error)
  }

  const onCancel = async () => {
    await dispatch.bluetooth.cancel()
  }

  return (
    <>
      <Box marginX={2} marginTop={4}>
        <Stack flexDirection="row" alignItems="center" marginY={2}>
          <Icon name="bluetooth" type="brands" size="xl" color={true ? 'primary' : 'grayDark'} />
          <Typography variant="h2" marginLeft={2}>
            Bluetooth Commissioning
          </Typography>
        </Stack>
        <Typography variant="body2">
          <b>Note:</b> This setup is only for Raspberry Pis that are enabled with Remote.It.
        </Typography>
        <OnboardError error={error} />
        <Stack flexDirection="row" alignItems="center" marginTop={5} marginBottom={3}>
          {processing ? (
            <>
              <CircularProgress size={22} thickness={5} sx={{ marginRight: 3 }} />
              <Button size="small" onClick={onCancel}>
                cancel
              </Button>
            </>
          ) : (
            <>
              <Button variant="contained" size="small" onClick={onScan}>
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
        {/* <Typography variant="caption">
          Once your Raspberry Pi is set up with Remote.It, start your Pi with Bluetooth commissioning enabled. Your
          device will be discoverable via Bluetooth for five minutes after startup.
        </Typography> */}
      </Box>
      <List>
        <ListSubheader disableGutters sx={{ paddingBottom: 1 }}>
          First-Time Users
        </ListSubheader>
        <ListItem>
          <Typography variant="body2" gutterBottom>
            To set up WiFi on your Raspberry Pi using Bluetooth commissioning, choose one of these options:
          </Typography>
        </ListItem>
        <ListItemLink
          dense
          icon="arrow-down-to-bracket"
          href="http://remote.it/jumpbox"
          title="Download our Pi image"
          disableGutters
        />
        <ListItemLink
          dense
          icon="plus"
          href="http://remote.it/jumpbox"
          title="Add commissioning to your Pi image"
          disableGutters
        />
        <ListItemLink
          dense
          icon="arrow-turn-down"
          iconProps={{ rotate: 270 }}
          href="http://remote.it/jumpbox"
          title="Purchase our Pi JumpBox"
          disableGutters
        />
      </List>
    </>
  )
}
