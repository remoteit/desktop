import React, { useEffect } from 'react'
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
  const state = useBluetooth()

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
          {!state.initialized ? (
            <Button variant="contained" size="small" disabled={disabled} onClick={() => bluetooth.start()}>
              scan
            </Button>
          ) : state.connected ? (
            <Button variant="contained" size="small" disabled={disabled} onClick={onNext}>
              next
            </Button>
          ) : (
            <Button variant="contained" size="small" disabled={disabled} onClick={() => bluetooth.connect()}>
              Connect
            </Button>
          )}
          {state.connecting && <CircularProgress size={30} thickness={3} sx={{ marginLeft: 2 }} />}
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
      <Pre>{state}</Pre>
      {/* <Pre>{bluetooth.state}</Pre> */}
    </>
  )
}
