import React from 'react'
import browser from '../services/browser'
import { List, Typography, Tooltip, ButtonBase } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { ListItemLocation } from '../components/ListItemLocation'
import { windowOpen } from '../services/browser'
import { Container } from '../components/Container'
import { BillingUI } from '../components/BillingUI'
import { Logo } from '@common/brand/Logo'
import { Icon } from '../components/Icon'

export const AccountPage: React.FC = () => {
  const { t } = useTranslation()
  return (
    <Container
      gutterBottom
      header={
        <>
          <Typography variant="h1" gutterBottom>
            <Tooltip title={t('settings.visitWeb', 'Visit Remote.It on the web')}>
              <ButtonBase onClick={() => windowOpen('https://remote.it')}>
                <Logo width={110} />
              </ButtonBase>
            </Tooltip>
          </Typography>
        </>
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
        <ListItemLocation title={t('settings.accessKeys', 'Access Keys')} to="/account/accessKey" icon="key" dense />
        <ListItemLocation
          title={t('settings.connectedApps', 'Connected Apps')}
          to="/account/connected"
          icon="puzzle-piece-simple"
          dense
        />
      </List>
    </Container>
  )
}
