import React from 'react'
import { useTranslation } from 'react-i18next'
import { List, ListItem, ListItemText } from '@mui/material'
import type { DeviceAppChange } from '../services/graphQLDeviceApps'
import { outcomeLine } from '../helpers/appsHelper'

/* What a many-device call did, one line a device (presence-server docs/device-apps-design.md, "The Apps pages"): Added ·
   Enabled · Already there · Changed · Refused: <why>. A refusal is that device's, never the call's. */
export const AppChangeResults: React.FC<{ changes: DeviceAppChange[]; adding?: boolean }> = ({ changes, adding }) => {
  const { t } = useTranslation()
  return (
    <List dense disablePadding data-app-results>
      {changes.map(change => (
        <ListItem key={change.deviceId} disableGutters data-app-result={change.deviceId}>
          <ListItemText
            primary={change.name ?? change.deviceId}
            secondary={outcomeLine(t, change, adding)}
            secondaryTypographyProps={{ color: change.outcome === 'refused' ? 'error' : 'textSecondary' }}
          />
        </ListItem>
      ))}
    </List>
  )
}
