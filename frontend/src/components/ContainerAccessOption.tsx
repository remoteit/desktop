import React from 'react'
import { useTranslation } from 'react-i18next'
import { Box, FormControlLabel, Switch, Typography } from '@mui/material'

/** Whether a container command gives the device what an exit and Access need (helpers/joinKeyFile
 *  CONTAINER_ACCESS_FLAGS). On by default: without it, a device made this way can never be an exit. */
export const ContainerAccessOption: React.FC<{ checked: boolean; onChange: (checked: boolean) => void }> = ({
  checked,
  onChange,
}) => {
  const { t } = useTranslation()
  return (
    <Box>
      <FormControlLabel
        control={<Switch checked={checked} onChange={event => onChange(event.target.checked)} />}
        label={t('containerAccess.label', 'Let this device be an exit and use Access')}
      />
      <Typography variant="body2" color="textSecondary">
        {checked
          ? t(
              'containerAccess.on',
              'Lets other devices route through this device, and lets this device reach your devices by name.'
            )
          : t('containerAccess.off', "This device will only share its services. It can't be an exit or use Access.")}
      </Typography>
    </Box>
  )
}
