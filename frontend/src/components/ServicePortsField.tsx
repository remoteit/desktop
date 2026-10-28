import React from 'react'
import { useTranslation } from 'react-i18next'
import { ListItem, SxProps, TextField, Theme, Typography } from '@mui/material'

/* A multi-port service's ports as the service form edits them (services/multiPortServices): the whole list, the first
   where its type's launch goes — or, for a type whose URL gives the first, the ports after it. */
type Props = {
  value: string
  error?: string
  more?: boolean
  disabled?: boolean
  endAdornment?: React.ReactNode
  sx?: SxProps<Theme>
  onChange: (text: string) => void
}

export const ServicePortsField: React.FC<Props> = ({ value, error, more, disabled, endAdornment, sx, onChange }) => {
  const { t } = useTranslation()
  return (
    <ListItem sx={sx}>
      <TextField
        required={!more}
        label={more ? t('multiPort.morePorts', 'Other Ports') : t('multiPort.ports', 'Service Ports')}
        value={value}
        disabled={disabled}
        variant="filled"
        error={!!error}
        helperText={error}
        placeholder={more ? '–' : undefined}
        InputLabelProps={{ shrink: true }}
        onChange={event => onChange(event.target.value)}
        InputProps={{ endAdornment }}
      />
      <Typography variant="caption">
        {more
          ? t(
              'multiPort.morePortsHelp',
              "Ports and ranges the application also uses beside the URL's, like 5004-5005, reached on the device subnet. Optional."
            )
          : t(
              'multiPort.portsHelp',
              'Ports and ranges the application uses, like 5900, 5901-5910. Connections and launch use the first; the device subnet reaches them all.'
            )}
      </Typography>
    </ListItem>
  )
}
