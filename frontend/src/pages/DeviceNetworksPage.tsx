import React from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { useHistory } from 'react-router-dom'
import { Box, Button, List, ListItemText, Typography } from '@mui/material'
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
import { networkSummary } from '../components/DeviceNetworkWords'

/* Networks, as device networks (docs/superpowers/specs/2026-09-30-device-sessions-ui-design.md §3): each network
   with how many devices and people are in it. */
export const DeviceNetworksPage: React.FC = () => {
  const { t } = useTranslation()
  const { networks } = useDeviceNetworks()
  const permissions = useSelector(selectPermissions)
  const history = useHistory()
  const canAdd = permissions.includes('MANAGE')

  const body = () => {
    if (networks === undefined) return <LoadingMessage />
    if (networks === UNSUPPORTED)
      return (
        <Gutters>
          <Notice severity="info" fullWidth>
            {t(
              'deviceNetworks.unsupported',
              'This server doesn’t offer networks of devices. Choose a server that does in Test settings.'
            )}
          </Notice>
        </Gutters>
      )
    if (networks === 'ERROR')
      return (
        <Gutters>
          <Notice severity="error" fullWidth>
            {t('deviceNetworks.error', 'Couldn’t load your networks. Check your connection and try again.')}
          </Notice>
        </Gutters>
      )
    if (!networks.length)
      return (
        <Gutters>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 1.5 }}>
            <Typography variant="body2" color="textSecondary">
              {t(
                'deviceNetworks.empty',
                'A network lets your devices reach each other by name, with no connection to start.'
              )}
            </Typography>
            {canAdd && (
              <Button variant="contained" size="small" onClick={() => history.push('/networks/add')}>
                {t('deviceNetworks.create', 'Create network')}
              </Button>
            )}
          </Box>
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
              <ListItemText primary={network.name} secondary={networkSummary(t, network)} />
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
          {canAdd && (
            <IconButton icon="plus" title={t('deviceNetworks.add', 'Create network')} to="/networks/add" size="md" />
          )}
        </Typography>
      }
    >
      {body()}
    </Container>
  )
}
