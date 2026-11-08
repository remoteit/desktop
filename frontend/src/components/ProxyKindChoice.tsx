import React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Box,
  FormControl,
  FormControlLabel,
  FormHelperText,
  FormLabel,
  Radio,
  RadioGroup,
  Typography,
} from '@mui/material'

type Props = {
  local: boolean
  disabled?: boolean
  onChange: (local: boolean) => void
}

/* Internet or Local network (graphql-api docs/PROXY-GROUPS.md §14, decision 44): an own proxy is one or the other,
   chosen as it is made and never changed. An Internet proxy is reached from wherever its devices can be reached; a
   Local network one only on its devices' own network — every device of it on that one network —, where printers, PCs
   and anything without remote.it reach endpoints by it. */
export const ProxyKindChoice: React.FC<Props> = ({ local, disabled, onChange }) => {
  const { t } = useTranslation()
  return (
    <FormControl disabled={disabled} data-proxy-kind={local ? 'local' : 'internet'}>
      <FormLabel>{t('proxyKind.label', 'Reached from')}</FormLabel>
      <RadioGroup value={local ? 'local' : 'internet'} onChange={event => onChange(event.target.value === 'local')}>
        <FormControlLabel
          value="internet"
          control={<Radio size="small" />}
          sx={ALIGN}
          label={
            <Choice
              name={t('proxyKind.internet', 'Internet')}
              line={t('proxyKind.internetHint', 'Reached from anywhere its devices can be reached.')}
            />
          }
        />
        <FormControlLabel
          value="local"
          control={<Radio size="small" />}
          sx={ALIGN}
          label={
            <Choice
              name={t('proxyKind.local', 'Local network')}
              line={t(
                'proxyKind.localHint',
                'Reached only on its devices’ own network, for printers, PCs and anything without remote.it.'
              )}
            />
          }
        />
      </RadioGroup>
      <FormHelperText>{t('proxyKind.fixed', 'Chosen now: it cannot be changed later.')}</FormHelperText>
    </FormControl>
  )
}

// Each radio beside its choice's name, the line under it wrapping as it must.
const ALIGN = { alignItems: 'flex-start', '& .MuiRadio-root': { marginTop: 0.25 } }

const Choice: React.FC<{ name: string; line: string }> = ({ name, line }) => (
  <Box paddingY={0.5}>
    <Typography variant="body2">{name}</Typography>
    <Typography variant="caption" color="textSecondary" component="div">
      {line}
    </Typography>
  </Box>
)
