import React, { useEffect } from 'react'
import bluetooth from '../services/bluetooth'
import { Typography, Stack, Box, Button } from '@mui/material'
import { useAutoRegistration } from '../hooks/useAutoRegistration'
import { platforms } from '../platforms'
import { Icon } from '../components/Icon'

type Props = {
  platformId?: string
  onNext: () => void
}

export const OnboardConfiguring: React.FC<Props> = ({ platformId, onNext }) => {
  const platform = platforms.get(platformId)
  const { registrationCode } = useAutoRegistration({ platform, types: [] })
  const processing = !registrationCode

  useEffect(() => {
    if (registrationCode) {
      console.log('REGISTRATION CODE', registrationCode)
      bluetooth.writeRegistrationCode(registrationCode)
    }
  }, [registrationCode])

  return (
    <Box maxWidth={300}>
      <Box marginX={2}>
        <Stack flexDirection="row" alignItems="center" marginY={2}>
          <Icon
            name={processing ? 'spinner-third' : 'check'}
            spin={processing}
            type="regular"
            size="xl"
            color="primary"
          />
          <Typography variant="h2" marginLeft={2} color={processing ? undefined : 'primary'}>
            {processing ? 'Registering' : 'Registered!'}
          </Typography>
        </Stack>
        <Typography variant="body2" gutterBottom>
          Connecting your Raspberry Pi to WiFi and registering it for remote access.
        </Typography>
        <Typography variant="caption" gutterBottom>
          This page will update when complete.
        </Typography>
        <Button
          variant="contained"
          size="small"
          onClick={onNext}
          disabled={processing}
          sx={{ marginTop: 5, marginBottom: 4 }}
        >
          done
        </Button>
      </Box>
    </Box>
  )
}
