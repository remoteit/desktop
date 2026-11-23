import React from 'react'
import { useTranslation } from 'react-i18next'
import { Box, List, ListItemButton, ListItemIcon, ListItemText, Radio, Typography } from '@mui/material'
import { Gutters } from './Gutters'

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
  const value = local ? 'local' : 'internet'
  const choices = [
    {
      key: 'internet',
      name: t('proxyKind.internet', 'Internet'),
      line: t('proxyKind.internetHint', 'Anyone on the internet can reach its public addresses.'),
    },
    {
      key: 'local',
      name: t('proxyKind.local', 'Local network'),
      line: t('proxyKind.localHint', 'Only devices on the same local network can reach it. Good for printers and PCs.'),
    },
  ]
  return (
    <Box component="fieldset" data-proxy-kind={value} sx={{ border: 0, margin: 0, padding: 0, minWidth: 0 }}>
      <Typography variant="subtitle1" component="legend">
        {t('proxyKind.label', 'Reached from')}
      </Typography>
      <List dense disablePadding role="radiogroup">
        {choices.map(choice => (
          <ListItemButton key={choice.key} dense disabled={disabled} onClick={() => onChange(choice.key === 'local')}>
            <ListItemIcon>
              <Radio
                size="small"
                value={choice.key}
                checked={value === choice.key}
                disabled={disabled}
                disableRipple
                onChange={() => onChange(choice.key === 'local')}
              />
            </ListItemIcon>
            <ListItemText primary={choice.name} secondary={choice.line} />
          </ListItemButton>
        ))}
      </List>
      <Gutters top="xs" bottom={null}>
        <Typography variant="caption">{t('proxyKind.fixed', 'You can’t change this later.')}</Typography>
      </Gutters>
    </Box>
  )
}
