import React, { useEffect } from 'react'
import { State, Dispatch } from '../store'
import { useSelector, useDispatch } from 'react-redux'
import { Typography, Stack, Box, Button, List, ListSubheader, CircularProgress } from '@mui/material'
import { ListItemLink } from './ListItemLink'
import { Notice } from './Notice'
import { Icon } from './Icon'

type Props = {
  next: () => void
}

export const OnboardScanning: React.FC<Props> = ({ next }) => {
  const { initialized, connected, processing, wifi, error } = useSelector((state: State) => state.bluetooth)
  const dispatch = useDispatch<Dispatch>()

  useEffect(() => {
    dispatch.bluetooth.clear()
  }, [])

  useEffect(() => {
    if (connected && wifi !== 'CONNECTED') next()
  }, [connected, wifi])

  const onScan = async () => {
    await dispatch.bluetooth.start()
    console.log('SCANNING STATE', initialized, connected, processing, error)
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
          Start your Remote.It enabled Pi. It will be discoverable for five minutes after startup.
        </Typography>
        {error && (
          <Notice severity="error" fullWidth gutterTop>
            {error}
          </Notice>
        )}
        <Stack flexDirection="row" marginTop={5} marginBottom={4}>
          {processing ? (
            <CircularProgress size={29.5} thickness={3} />
          ) : (
            <Button variant="contained" size="small" disabled={processing} onClick={onScan}>
              scan
            </Button>
          )}
        </Stack>
      </Box>
      <List>
        <ListSubheader disableGutters>Other options</ListSubheader>
        <ListItemLink
          dense
          icon="arrow-turn-down"
          iconProps={{ rotate: 270 }}
          href="http://remote.it/jumpbox"
          title="Purchase our Pi JumpBox"
          disableGutters
        />
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
      </List>
    </>
  )
}
