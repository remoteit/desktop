import React from 'react'
import { Link } from 'react-router-dom'
import { State, Dispatch } from '../store'
import { useSelector, useDispatch } from 'react-redux'
import { Typography, Stack, CircularProgress, Box, Button } from '@mui/material'
import { useAutoRegistration } from '../hooks/useAutoRegistration'
import { OnboardError } from './OnboardError'
import { platforms } from '../platforms'
import { Icon } from './Icon'

type Props = {
  platformId: string
}

export const OnboardConfiguring: React.FC<Props> = ({ platformId }) => {
  const dispatch = useDispatch<Dispatch>()
  const platform = platforms.get(platformId)
  const { registrationCode } = useAutoRegistration({ platform, types: [28] })
  const { error, reg, id } = useSelector((state: State) => state.bluetooth)
  const processing = reg === 'REGISTERING' || !registrationCode

  const register = async () => {
    if (registrationCode) await dispatch.bluetooth.writeRegistrationCode(registrationCode)
  }

  return (
    <Box marginX={2}>
      <Stack flexDirection="row" alignItems="center" marginY={2}>
        <Icon name={reg === 'REGISTERED' ? 'check' : 'arrow-right-arrow-left'} color="primary" type="solid" size="xl" />
        <Box marginLeft={2}>
          <Typography variant="h2">
            {reg === 'REGISTERING' ? 'Registering...' : reg === 'UNREGISTERED' ? 'Registration' : 'Registered!'}
          </Typography>
          {id && <Typography variant="h4">{id}</Typography>}
        </Box>
      </Stack>
      <OnboardError error={error} />
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
            <Button size="small" variant="contained" onClick={register} disabled={processing}>
              Register
            </Button>
            <Button
              size="small"
              variant="contained"
              color="inherit"
              to="/devices/restore/pi"
              component={Link}
              disabled={processing}
              sx={{ marginLeft: 1 }}
            >
              Restore
            </Button>
            <Button size="small" to={id ? `/devices/${id}` : '/devices'} component={Link} sx={{ marginLeft: 1 }}>
              skip
            </Button>
          </>
        ) : (
          <Button
            size="small"
            variant="contained"
            to={id ? `/devices/${id}` : '/devices'}
            component={Link}
            disabled={processing}
          >
            Done
          </Button>
        )}
      </Box>
    </Box>
  )
}
