import React from 'react'
import browser from '../services/browser'
import { List, Typography, Tooltip, ButtonBase } from '@mui/material'
import { ListItemLocation } from '../components/ListItemLocation'
import { windowOpen } from '../services/browser'
import { Container } from '../components/Container'
import { MobileUI } from '../components/MobileUI'
import { Logo } from '@common/brand/Logo'
import { Icon } from '../components/Icon'

export const AccountPage: React.FC = () => {
  return (
    <Container
      gutterBottom
      header={
        <>
          <Typography variant="h1" gutterBottom>
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
        <MobileUI android hide>
          <ListItemLocation title="Subscription" to="/account/plans" icon="shopping-cart" dense>
            {!browser.hasBilling && <Icon name="launch" size="sm" color="grayDark" inlineLeft fixedWidth />}
          </ListItemLocation>
          <ListItemLocation title="Billing" to="/account/billing" icon="credit-card-front" dense>
            {!browser.hasBilling && <Icon name="launch" size="sm" color="grayDark" inlineLeft fixedWidth />}
          </ListItemLocation>
        </MobileUI>
        <ListItemLocation title="License" to="/account/license" icon="id-badge" dense />
        <ListItemLocation title="Access Keys" to="/account/accessKey" icon="key" dense />
      </List>
    </Container>
  )
}
