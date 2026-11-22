import React from 'react'
import browser from '../services/browser'
import { Box, List, Typography, Tooltip, ButtonBase } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { ListItemLocation } from '../components/ListItemLocation'
import { windowOpen } from '../services/browser'
import { Container } from '../components/Container'
import { Title } from '../components/Title'
import { BillingUI } from '../components/BillingUI'
import { Logo } from '@common/brand/Logo'
import { Icon } from '../components/Icon'
import { useDeviceSessions } from '../hooks/useDeviceSessions'

export const AccountPage: React.FC = () => {
  const { t } = useTranslation()
  const deviceSessions = useDeviceSessions()
  return (
    <Container
      gutterBottom
      header={
        <Box sx={{ paddingX: 4.5, paddingTop: 0.5, marginBottom: 1 }}>
          <Typography variant="h2" component="h1" sx={{ display: 'flex', alignItems: 'center' }}>
            <Title>{t('account.title', 'Account')}</Title>
            <Tooltip title={t('settings.visitWeb', 'Visit Remote.It on the web')}>
              <ButtonBase onClick={() => windowOpen('https://remote.it')} sx={{ marginLeft: 'auto' }}>
                <Logo width={80} />
              </ButtonBase>
            </Tooltip>
          </Typography>
        </Box>
      }
    >
      <List>
        <ListItemLocation
          title={t('settings.profile', 'Profile')}
          to="/account/overview"
          match={['/account', '/account/overview']}
          icon="user-large"
          exactMatch
          dense
        />
        <ListItemLocation title={t('settings.security', 'Security')} to="/account/security" icon="lock" dense />
        <BillingUI>
          <ListItemLocation title={t('settings.subscription', 'Subscription')} to="/account/plans" icon="shopping-cart" dense>
            {!browser.hasBilling && <Icon name="launch" size="sm" color="grayDark" inlineLeft fixedWidth />}
          </ListItemLocation>
          <ListItemLocation title={t('settings.billing', 'Billing')} to="/account/billing" icon="credit-card-front" dense>
            {!browser.hasBilling && <Icon name="launch" size="sm" color="grayDark" inlineLeft fixedWidth />}
          </ListItemLocation>
        </BillingUI>
        <ListItemLocation title={t('settings.license', 'License')} to="/account/license" icon="id-badge" dense />
        <ListItemLocation title={t('settings.accessKeys', 'Access keys')} to="/account/accessKey" icon="key" dense />
        {deviceSessions && (
          <ListItemLocation title={t('settings.appPublisher', 'App publisher')} to="/account/publisher" icon="cube" dense />
        )}
        <ListItemLocation
          title={t('settings.connectedApps', 'Connected apps')}
          to="/account/connected"
          icon="puzzle-piece-simple"
          dense
        />
      </List>
    </Container>
  )
}
