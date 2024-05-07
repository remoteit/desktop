import React, { useState } from 'react'
import { Typography, Stack, Box, Button, List, TextField, MenuItem } from '@mui/material'
import { IconButton } from '../buttons/IconButton'
import { Icon } from '../components/Icon'

type Props = {
  onNext: () => void
}

export const OnboardWifi: React.FC<Props> = ({ onNext }) => {
  const networks = ['My WiFi Network', 'My Other WiFi Network', 'My Guest WiFi Network', "Neighbor's WiFi Network"]
  const [form, setForm] = useState({ network: networks[0], password: '' })
  const [showPassword, setShowPassword] = useState(false)

  return (
    <Box maxWidth={300}>
      <Box marginX={2}>
        <Stack flexDirection="row" alignItems="center" marginY={2}>
          <Icon name="wifi" type="solid" size="xl" color="primary" />
          <Typography variant="h2" marginLeft={2}>
            WiFi Setup
          </Typography>
        </Stack>
        <Typography variant="body2" gutterBottom>
          Connect your Raspberry Pi by selecting a WiFi network and entering its password.
        </Typography>
        <List>
          <TextField
            select
            fullWidth
            label="Network"
            variant="filled"
            value={form.network}
            sx={{ marginBottom: 1 }}
            onChange={event => setForm({ ...form, network: event.target.value })}
          >
            {networks.map(network => (
              <MenuItem value={network} key={network}>
                {network}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            fullWidth
            type={showPassword ? 'text' : 'password'}
            label="Password"
            value={form.password}
            variant="filled"
            autoComplete="off"
            onChange={event => setForm({ ...form, password: event.target.value })}
            InputProps={{
              endAdornment: (
                <IconButton onClick={() => setShowPassword(!showPassword)} icon={showPassword ? 'eye-slash' : 'eye'} />
              ),
            }}
          />
        </List>
        <Button
          variant="contained"
          size="small"
          onClick={onNext}
          disabled={!form.password}
          sx={{ marginTop: 5, marginBottom: 4 }}
        >
          next
        </Button>
      </Box>
    </Box>
  )
}
