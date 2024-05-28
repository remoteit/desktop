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
  InputAdornment,
  MenuItem,
} from '@mui/material'
import { OnboardMessage } from './OnboardMessage'
import { IconButton } from '../buttons/IconButton'
import { SignalIcon } from '../buttons/SignalIcon'
import { ColorChip } from './ColorChip'
import { Icon } from './Icon'

type Props = {
  next: () => void
}

export const OnboardWifi: React.FC<Props> = ({ next }) => {
  const dispatch = useDispatch<Dispatch>()
  const { message, severity, ssid, scan, wifi, networks } = useSelector((state: State) => state.bluetooth)
  const [ready, setReady] = useState<boolean>(false)
  const [form, setForm] = useState({ ssid: '', pwd: '' })
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    dispatch.bluetooth.readSSIDs()
  }, [])

  useEffect(() => {
    if (ssid && !form.ssid) setForm({ ...form, ssid })
  }, [ssid])

  useEffect(() => {
    if (ready && !message && wifi === 'CONNECTED') next()
  }, [wifi, ready])

  const onScan = async () => {
    await dispatch.bluetooth.scanSSIDs()
    await dispatch.bluetooth.readSSIDs()
  }

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    await dispatch.bluetooth.writeWifi(form)
    setTimeout(() => setReady(true), 1000)
  }

  const selectedNetwork = networks.find(network => network.ssid === form.ssid)
  const disabled = scan === 'SCANNING' || wifi === 'CONNECTING'

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
      <OnboardMessage message={message} severity={severity} />
      <form onSubmit={onSubmit}>
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
                <InputAdornment position="end" sx={{ position: 'absolute', right: ({ spacing }) => spacing(3.3) }}>
                  {selectedNetwork && <SignalIcon strength={selectedNetwork.signal} type="solid" />}
                  <IconButton onClick={onScan} icon="radar" />
                </InputAdornment>
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
                <InputAdornment position="end" sx={{ marginRight: ({ spacing }) => spacing(1) }}>
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    icon={showPassword ? 'eye-slash' : 'eye'}
                  />
                </InputAdornment>
              ),
            }}
          />
        </List>
        <Stack flexDirection="row" alignItems="center" marginY={3}>
          {wifi === 'CONNECTING' ? (
            <CircularProgress size={29.5} thickness={3} />
          ) : (
            <>
              <Button variant="contained" disabled={!form.pwd || disabled} type="submit">
                {wifi === 'CONNECTED' ? 'Update WiFi' : 'Set WiFi'}
              </Button>
              {wifi === 'CONNECTED' && (
                <Button onClick={next} sx={{ marginLeft: 1 }}>
                  Skip
                </Button>
              )}
            </>
          )}
          <Box flexGrow={1} textAlign="right">
            <ColorChip
              color={wifi === 'CONNECTED' ? 'primary' : undefined}
              label={
                wifi === 'CONNECTED' ? 'WiFi Connected' : wifi === 'CONNECTING' ? 'Connecting...' : 'Wifi Not Connected'
              }
              size="small"
              sx={{ textTransform: 'capitalize' }}
            />
          </Box>
        </Stack>
      </form>
    </Box>
  )
}
