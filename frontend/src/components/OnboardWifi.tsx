import React, { useState, useEffect, useRef } from 'react'
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
  Autocomplete,
  MenuItem,
} from '@mui/material'
import { OnboardMessage } from './OnboardMessage'
import { IconButton } from '../buttons/IconButton'
import { SignalIcon } from '../buttons/SignalIcon'
import { ColorChip } from './ColorChip'

type Props = {
  next: () => void
}

export const OnboardWifi: React.FC<Props> = ({ next }) => {
  const dispatch = useDispatch<Dispatch>()
  const { message, severity, ssid, scan, wlan, networks } = useSelector((state: State) => state.bluetooth)
  const [showPassword, setShowPassword] = useState(false)
  const [ready, setReady] = useState<boolean>(false)
  const [form, setForm] = useState({ ssid: '', pwd: '' })
  const passwordRef = useRef<HTMLInputElement>()

  useEffect(() => {
    dispatch.bluetooth.readSSIDs()
  }, [])

  useEffect(() => {
    if (ssid && !form.ssid) setForm({ ...form, ssid })
  }, [ssid])

  useEffect(() => {
    if (ready && !message && wlan === 'CONNECTED') setTimeout(next, 600)
  }, [wlan, ready])

  const onScan = async event => {
    event.stopPropagation()
    await dispatch.bluetooth.scanSSIDs()
    await dispatch.bluetooth.readSSIDs()
  }

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setShowPassword(false)
    await dispatch.bluetooth.writeWifi(form)
    setTimeout(() => setReady(true), 500)
  }

  const selectedNetwork = networks.find(network => network.ssid === form.ssid)
  const disabled = scan === 'SCANNING' || wlan === 'CONNECTING'
  const options = networks.map(n => n.ssid)

  if (!options.length) options.push('No networks found')

  return (
    <Box marginX={2}>
      <Stack flexDirection="row" alignItems="center" marginY={2}>
        <Typography variant="h2">WiFi Setup</Typography>
      </Stack>
      <Typography variant="body2" gutterBottom>
        Connect your Raspberry Pi to WiFi.
        <br />
        Select a network and enter its password.
      </Typography>
      <OnboardMessage message={message} severity={severity} />
      <form onSubmit={onSubmit} autoComplete="off">
        <List>
          <Autocomplete
            freeSolo
            autoFocus
            fullWidth
            autoComplete
            selectOnFocus
            forcePopupIcon
            disableClearable
            handleHomeEndKeys
            includeInputInList
            disabled={disabled}
            options={options}
            value={scan === 'SCANNING' ? 'Scanning...' : form.ssid}
            sx={{ marginBottom: 1 }}
            onChange={(event, ssid, reason) => {
              if (!ssid || disabled) return
              setForm({ ...form, ssid })
              passwordRef.current?.focus()
            }}
            renderOption={(props, ssid) => {
              const network = networks.find(n => n.ssid === ssid)
              return (
                <MenuItem {...props} key={ssid} disabled={!networks.length}>
                  <ListItemText>{ssid}</ListItemText>
                  {network && <SignalIcon strength={network.signal} type="solid" />}
                </MenuItem>
              )
            }}
            renderInput={params => (
              <TextField
                variant="filled"
                label="Network"
                type="text"
                name="network"
                {...params}
                autoComplete="off"
                InputProps={{
                  ...params.InputProps,
                  endAdornment: !disabled && (
                    <>
                      {params.InputProps.endAdornment}
                      <InputAdornment
                        position="end"
                        sx={{ position: 'absolute', marginTop: -2, right: ({ spacing }) => spacing(3.5) }}
                      >
                        {selectedNetwork && <SignalIcon strength={selectedNetwork.signal} type="solid" />}
                        <IconButton onClick={onScan} icon="radar" />
                      </InputAdornment>
                    </>
                  ),
                }}
                inputProps={{
                  ...params.inputProps,
                  'data-lpignore': 'true',
                }}
              />
            )}
          />
          <TextField
            fullWidth
            type={showPassword ? 'text' : 'password'}
            label="Password"
            value={form.pwd}
            variant="filled"
            disabled={disabled}
            autoComplete="new-password"
            name="wifi-password"
            inputRef={passwordRef}
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
            inputProps={{
              'data-lpignore': 'true',
            }}
          />
        </List>
        <Stack flexDirection="row" alignItems="center" marginY={3}>
          {wlan === 'CONNECTING' ? (
            <CircularProgress size={29.5} thickness={3} />
          ) : (
            <>
              <Button variant="contained" disabled={!form.pwd || disabled} type="submit">
                {wlan === 'CONNECTED' ? 'Update WiFi' : 'Set WiFi'}
              </Button>
              {wlan === 'CONNECTED' && (
                <Button onClick={next} sx={{ marginLeft: 1 }}>
                  Skip
                </Button>
              )}
            </>
          )}
          <Box flexGrow={1} textAlign="right">
            <ColorChip
              color={wlan === 'CONNECTED' ? 'primary' : undefined}
              variant={wlan === 'CONNECTED' ? 'contained' : 'text'}
              label={
                wlan === 'CONNECTED' ? 'WiFi Connected' : wlan === 'CONNECTING' ? 'Connecting...' : 'Wifi Not Connected'
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
