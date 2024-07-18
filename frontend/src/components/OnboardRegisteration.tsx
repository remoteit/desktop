import React from 'react'
import { Link } from 'react-router-dom'
import { State, Dispatch } from '../store'
import { useSelector, useDispatch } from 'react-redux'
import { Typography, Stack, CircularProgress, Box, Button } from '@mui/material'
import { useAutoRegistration } from '../hooks/useAutoRegistration'
import { OnboardMessage } from './OnboardMessage'
import { platforms } from '../platforms'
import { Icon } from './Icon'

type Props = {
  platformId: string
}

export const OnboardRegistration: React.FC<Props> = ({ platformId }) => {
  const dispatch = useDispatch<Dispatch>()
  const platform = platforms.get(platformId)
  const { registrationCode } = useAutoRegistration({ platform, types: [] })
  const { message, severity, reg, id } = useSelector((state: State) => state.bluetooth)
  const processing = reg === 'REGISTERING' || (reg === 'REGISTERED' && !registrationCode)

  const register = async () => {
    if (registrationCode) await dispatch.bluetooth.writeRegistrationCode(registrationCode)
  }

  return (
    <Box marginX={2}>
      <Stack marginY={2}>
        <Typography variant="h2">
          {reg === 'REGISTERING' ? 'Registering...' : reg === 'UNREGISTERED' ? 'Registration' : 'Registered!'}
        </Typography>
        <OnboardMessage message={message} severity={severity} />
      </Stack>
      {reg === 'REGISTERED' ? (
        <Typography variant="body2">
          Your Raspberry Pi is registered and
          <br />
          ready for remote access.
        </Typography>
      ) : (
        <>
          <Typography variant="body2" gutterBottom>
            Add and share remote access by <br />
            registering with Remote.It.
          </Typography>
          <Typography variant="caption" component="p" gutterBottom>
            This page will update when complete.
          </Typography>
        </>
      )}
      <Box sx={{ marginTop: 5, marginBottom: 4 }}>
        {reg === 'REGISTERING' ? (
          <CircularProgress size={29.5} thickness={3} />
        ) : reg !== 'REGISTERED' ? (
          <>
            <Button variant="contained" onClick={register} disabled={processing}>
              Register
            </Button>
            <Button to="/devices/restore/pi" component={Link} disabled={processing} sx={{ marginLeft: 2 }}>
              Restore
            </Button>
            <Button to={id ? `/devices/${id}` : '/devices'} component={Link}>
              skip
            </Button>
          </>
        ) : (
          <Button variant="contained" to={id ? `/devices/${id}` : '/devices'} component={Link} disabled={processing}>
            Done
          </Button>
        )}
      </Box>
    </Box>
  )
}
