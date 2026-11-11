import React, { useContext } from 'react'
import { useTranslation } from 'react-i18next'
import { List, ListItem, ListItemText, ListSubheader } from '@mui/material'
import { DeviceContext } from '../services/Context'
import { DeviceHeaderMenu } from '../components/DeviceHeaderMenu'
import { ExitFlowList } from '../components/ExitFlowList'
import { Gutters } from '../components/Gutters'

/* A device's connections through exits (graphql exitFlows; graphql-api docs/PROXY-GROUPS.md §15, "Exit flows: who may
   see them"): to whoever manages it, every one it made through an exit — whoever on the computer opened it — and every
   one it carried as an exit; to anyone else, their own from it. graphql decides which; the page says which the viewer
   is given. Only exits that keep a flow log show here: remote.it's. The tab shows only where the API has exitFlows. */
export const DeviceExitFlowsPage: React.FC = () => {
  const { t } = useTranslation()
  const { device } = useContext(DeviceContext)
  if (!device) return null
  const manage = device.permissions.includes('MANAGE')

  return (
    <DeviceHeaderMenu>
      <Gutters size={null}>
        <List>
          <ListSubheader>{t('exitFlows.title', 'Connections through exits')}</ListSubheader>
          <ListItem>
            <ListItemText
              secondary={
                manage
                  ? t(
                      'exitFlows.managerHint',
                      "Every connection this device made through remote.it's exits — whoever on it opened it — and every one it carried as an exit. Kept as long as remote.it keeps its exits' flow log."
                    )
                  : t(
                      'exitFlows.ownHint',
                      "Your own connections from this device through remote.it's exits. Those who manage it see everyone's."
                    )
              }
            />
          </ListItem>
          <ExitFlowList scope={{ deviceId: device.id }} carrier={device.id} />
        </List>
      </Gutters>
    </DeviceHeaderMenu>
  )
}
