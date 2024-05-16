import React from 'react'
import browser from '../services/browser'
import { State } from '../store'
import { List, Typography, Tooltip, ButtonBase } from '@mui/material'
import { selectRemoteitLicense } from '../selectors/organizations'
import { ListItemLocation } from '../components/ListItemLocation'
import { useSelector } from 'react-redux'
import { windowOpen } from '../services/browser'
import { Container } from '../components/Container'
import { Logo } from '../components/Logo'
import { Icon } from '../components/Icon'

export const AccountPage: React.FC = () => {
  const billing = useSelector((state: State) => !!selectRemoteitLicense(state, state.user.id)?.plan?.billing)

  const externalBilling = browser.hasBilling ? null : (
    <Icon name="launch" size="sm" color="grayDark" inlineLeft fixedWidth />
  )

  return (
    <Container
      gutterBottom
      header={
        <>
          <Typography variant="h1">
            <Tooltip title="Visit Remote.It on the web">
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
          title="Profile"
          to="/account/overview"
          match={['/account', '/account/overview']}
          icon="user-large"
          exactMatch
          dense
        />
        <ListItemLocation title="Security" to="/account/security" icon="lock" dense />
        <ListItemLocation title="Subscription" to="/account/plans" icon="shopping-cart" dense>
          {externalBilling}
        </ListItemLocation>
        {billing && (
          <ListItemLocation title="Billing" to="/account/billing" icon="credit-card-front" dense>
            {externalBilling}
          </ListItemLocation>
        )}
        <ListItemLocation title="License" to="/account/license" icon="id-badge" dense />
        <ListItemLocation title="Access Keys" to="/account/accessKey" icon="key" dense />
      </List>
    </Container>
  )
}
