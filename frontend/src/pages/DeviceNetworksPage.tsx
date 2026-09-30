import React from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { List, ListItemText, Typography } from '@mui/material'
import { initiates, targeted } from '../services/graphQLDeviceNetworks'
import { UNSUPPORTED } from '../services/graphQLDaemon'
import { selectPermissions } from '../selectors/organizations'
import { useDeviceNetworks } from '../hooks/useDeviceNetworks'
import { ListItemLocation } from '../components/ListItemLocation'
import { LoadingMessage } from '../components/LoadingMessage'
import { IconButton } from '../buttons/IconButton'
import { Container } from '../components/Container'
import { Gutters } from '../components/Gutters'
import { Notice } from '../components/Notice'
import { Title } from '../components/Title'

/* Networks, as device networks (docs/superpowers/specs/2026-09-30-device-sessions-ui-design.md §3): each network
   with its initiators, targets and people. In place of the Networks page while the device-sessions flag is on. */
export const DeviceNetworksPage: React.FC = () => {
  const { t } = useTranslation()
  const { networks } = useDeviceNetworks()
  const permissions = useSelector(selectPermissions)

  const body = () => {
    if (networks === undefined) return <LoadingMessage />
    if (networks === UNSUPPORTED)
      return (
        <Gutters>
          <Notice severity="info" fullWidth>
            {t(
              'deviceNetworks.unsupported',
              'This API does not serve device networks. Point Test Settings → API Target at a stage that does (local or dev).'
            )}
          </Notice>
        </Gutters>
      )
    if (networks === 'ERROR')
      return (
        <Gutters>
          <Notice severity="error" fullWidth>
            {t('deviceNetworks.error', 'Could not read the networks.')}
          </Notice>
        </Gutters>
      )
    if (!networks.length)
      return (
        <Gutters>
          <Typography variant="body2" color="textSecondary">
            {t('deviceNetworks.empty', 'No networks yet.')}
          </Typography>
        </Gutters>
      )

    return (
      <List>
        {[...networks]
          .sort((a, b) => a.name.localeCompare(b.name))
          .map(network => (
            <ListItemLocation
              key={network.id}
              to={`/networks/${network.id}`}
              icon={network.kind === 'LINK' ? 'link' : 'chart-network'}
              dense
            >
              <ListItemText
                primary={network.name}
                secondary={t(
                  'deviceNetworks.summary',
                  '{{initiators}} initiating · {{targets}} targets · {{people}} people',
                  {
                    initiators: network.devices.filter(initiates).length,
                    targets: network.devices.filter(targeted).length,
                    people: network.access.length + 1,
                  }
                )}
              />
            </ListItemLocation>
          ))}
      </List>
    )
  }

  return (
    <Container
      gutterBottom
      bodyProps={{ verticalOverflow: true }}
      header={
        <Typography variant="subtitle1">
          <Title>{t('deviceNetworks.title', 'Networks')}</Title>
          {permissions.includes('MANAGE') && (
            <IconButton icon="plus" title={t('deviceNetworks.add', 'Add network')} to="/networks/add" size="md" />
          )}
        </Typography>
      }
    >
      {body()}
    </Container>
  )
}
