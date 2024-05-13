import React, { useEffect, useState } from 'react'
import bluetooth from '../services/bluetooth'
import { useBluetooth } from '../hooks/useBluetooth'
import { Typography, Stack, Box, Button, List, ListSubheader, CircularProgress } from '@mui/material'
import { ListItemLink } from '../components/ListItemLink'
import { IconButton } from '../buttons/IconButton'
import { Notice } from '../components/Notice'
import { Icon } from '../components/Icon'
import { Pre } from '../components/Pre'

type Props = {
  disabled?: boolean
  onNext: () => void
}

export const OnboardScanning: React.FC<Props> = ({ disabled, onNext }) => {
  const [ready, setReady] = useState<boolean>(false)
  const state = useBluetooth()
  disabled = disabled || state.processing

  useEffect(() => {
    bluetooth.clear()
    setReady(true)
  }, [])

  // useEffect(() => {
  //   if (ready && state.connected) onNext()
  // }, [state])

  const onScan = async () => {
    await bluetooth.start()
    onNext()
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
          Start your Remote.It enabled Pi. It will be discoverable for one minute after startup.
        </Typography>
        {state.error && (
          <Notice severity="error" fullWidth gutterTop>
            {state.error}
          </Notice>
        )}
        <Stack flexDirection="row" marginTop={5} marginBottom={4}>
          {state.processing || state.initialized ? (
            <CircularProgress size={30} thickness={3} />
          ) : (
            <Button variant="contained" size="small" disabled={disabled} onClick={onScan}>
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
