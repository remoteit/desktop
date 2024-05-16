import React, { useState, useEffect } from 'react'
import { State, Dispatch } from '../store'
import { useSelector, useDispatch } from 'react-redux'
import {
  Typography,
  Stack,
  Box,
  Button,
  CircularProgress,
  List,
  ListItemText,
  TextField,
  MenuItem,
} from '@mui/material'
import { IconButton } from '../buttons/IconButton'
import { SignalIcon } from '../buttons/SignalIcon'
import { ColorChip } from './ColorChip'
import { Notice } from './Notice'
import { Icon } from './Icon'

type Props = {
  next: () => void
}

export const OnboardWifi: React.FC<Props> = ({ next }) => {
  const dispatch = useDispatch<Dispatch>()
  const { error, ssid, scan, wifi, networks } = useSelector((state: State) => state.bluetooth)
  const [ready, setReady] = useState<boolean>(false)
  const [form, setForm] = useState({ ssid: '', pwd: '' })
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    dispatch.bluetooth.readSSIDs()
  }, [])

  useEffect(() => {
    console.log('WIFI', ssid, form)
    if (ssid && !form.ssid) setForm({ ...form, ssid })
  }, [ssid])

  useEffect(() => {
    if (ready && wifi === 'CONNECTED') next()
  }, [wifi, ready])

  const onScan = async () => {
    await dispatch.bluetooth.scanSSIDs()
    await dispatch.bluetooth.readSSIDs()
  }

  const onSave = async () => {
    await dispatch.bluetooth.writeWifi(form)
    setTimeout(() => setReady(true), 1000)
  }

  const selectedNetwork = networks.find(network => network.ssid === form.ssid)
  const disabled = scan === 'SCANNING'

  return (
    <Box marginX={2}>
      <Stack flexDirection="row" alignItems="center" marginY={2}>
        <Icon name="wifi" type="solid" size="xl" color="primary" />
        <Typography variant="h2" marginLeft={2}>
          WiFi Setup
        </Typography>
      </Stack>
      <Typography variant="body2" gutterBottom>
        Connect your Raspberry Pi to WiFi.
        <br />
        Select a network and enter its password.
      </Typography>
      {error && (
        <Notice severity="error" fullWidth gutterTop>
          {error}
        </Notice>
      )}
      <List>
        <TextField
          select
          fullWidth
          label="Network"
          variant="filled"
          value={form.ssid || 'none'}
          disabled={disabled}
          sx={{ marginBottom: 1 }}
          InputProps={{
            endAdornment: !disabled && (
              <>
                {selectedNetwork && <SignalIcon strength={selectedNetwork.signal} type="solid" />}
                <IconButton onClick={onScan} icon="radar" sx={{ marginRight: 3.5 }} />
              </>
            ),
          }}
          SelectProps={{
            renderValue: value => (scan === 'SCANNING' ? <>Scanning...</> : (value as React.ReactNode)),
          }}
          onChange={event => setForm({ ...form, ssid: event.target.value })}
        >
          {scan === 'SCANNING' ? (
            <MenuItem value="none">Scanning...</MenuItem>
          ) : networks.length ? (
            networks.map(network => (
              <MenuItem value={network.ssid} key={network.ssid}>
                <ListItemText>{network.ssid}</ListItemText>
                <SignalIcon strength={network.signal} type="solid" />
              </MenuItem>
            ))
          ) : (
            <MenuItem value="none">No networks found</MenuItem>
          )}
        </TextField>
        <TextField
          fullWidth
          type={showPassword ? 'text' : 'password'}
          label="Password"
          value={form.pwd}
          variant="filled"
          disabled={disabled}
          autoComplete="off"
          onChange={event => setForm({ ...form, pwd: event.target.value })}
          InputProps={{
            endAdornment: (
              <IconButton onClick={() => setShowPassword(!showPassword)} icon={showPassword ? 'eye-slash' : 'eye'} />
            ),
          }}
        />
      </List>
      <Stack flexDirection="row" alignItems="center" marginY={3}>
        {wifi === 'CONNECTING' ? (
          <CircularProgress size={29.5} thickness={3} />
        ) : (
          <>
            <Button variant="contained" size="small" onClick={onSave} disabled={!form.pwd}>
              {wifi === 'CONNECTED' ? 'Update' : 'Save'}
            </Button>
            {wifi === 'CONNECTED' && (
              <Button size="small" onClick={next} sx={{ marginLeft: 1 }}>
                Skip
              </Button>
            )}
          </>
        )}
        <Box flexGrow={1} textAlign="right">
          <ColorChip
            color={
              wifi === 'CONNECTED'
                ? 'primary'
                : wifi?.includes('INVALID') || wifi === 'FAILED_START'
                ? 'danger'
                : undefined
            }
            label={wifi?.toLocaleLowerCase().replace('_', ' ')}
            size="small"
            variant={
              wifi === 'CONNECTED' || wifi?.includes('INVALID') || wifi === 'FAILED_START' ? 'contained' : undefined
            }
            sx={{ textTransform: 'capitalize' }}
          />
        </Box>
      </Stack>
    </Box>
  )
}
