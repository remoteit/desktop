import React from 'react'
import { useTranslation } from 'react-i18next'
import { List, ListItem, ListItemText } from '@mui/material'
import { ExitFlowList } from '../components/ExitFlowList'
import { DeviceSection } from '../components/DeviceSection'
import { useExitFlowsServed } from '../hooks/useExitFlowsServed'
import { useDeviceSessions } from '../hooks/useDeviceSessions'
import { LOOK_BACK_DAYS } from '../services/exitFlows'

/* A device's connections through exits (graphql exitFlows; graphql-api docs/PROXY-GROUPS.md §15): to whoever manages
   it, every one it made or carried; to anyone else, their own. Only Remote.It's exits keep a flow log. */
export const DeviceExitFlows: React.FC<{ device: IDevice }> = ({ device }) => {
  const { t } = useTranslation()
  const served = useExitFlowsServed(useDeviceSessions() && !device.virtual)
  if (!served) return null
  const manage = device.permissions.includes('MANAGE')

  return (
    <DeviceSection id="flows" title={t('exitFlows.heading', 'Connections through exits')} list={false}>
      <List disablePadding>
      <ListItem sx={{ paddingLeft: 4 }}>
        <ListItemText
          secondary={
            manage
              ? t('exitFlows.managerNote', 'Every connection through Remote.It exits from or by this device, last {{days}} days.', {
                  days: LOOK_BACK_DAYS,
                })
              : t('exitFlows.ownNote', 'Your own connections from this device through Remote.It exits, last {{days}} days.', {
                  days: LOOK_BACK_DAYS,
                })
          }
        />
      </ListItem>
      </List>
      <ExitFlowList scope={{ deviceId: device.id }} carrier={device.id} />
    </DeviceSection>
  )
}
