import React from 'react'
import {
  Typography,
  Button,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
} from '@mui/material'
import { State, Dispatch } from '../store'
import { useLocation, useHistory } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { selectRemoteitLicense } from '../selectors/organizations'
import { Notice } from './Notice'
import { Icon } from './Icon'

export const CreditCard: React.FC = () => {
  const history = useHistory()
  const location = useLocation()
  const dispatch = useDispatch<Dispatch>()
  const { license, updating } = useSelector((state: State) => ({
    license: selectRemoteitLicense(state, state.user.id),
    updating: state.plans.updating,
  }))
  const card = license?.subscription?.card
  const expired = !!card && card.expiration < new Date()
  const update = () => dispatch.plans.updateCreditCard(license?.subscription?.card?.last)

  React.useEffect(() => {
    if (location.pathname.includes('success')) {
      dispatch.plans.restore()
      history.push('.')
    }
  }, [])

  if (!card) return null

  return (
    <>
      <Typography variant="subtitle1">Credit Card</Typography>
      <List>
        {expired && (
          <ListItem>
            <Notice severity="error" gutterTop>
              Credit Card Expired. <em> Please update your card to continue service.</em>
            </Notice>
          </ListItem>
        )}
        <ListItemButton onClick={update}>
          <ListItemIcon>
            <Icon name="credit-card" size="md" />
          </ListItemIcon>
          <ListItemText
            primary={`${card.brand.toUpperCase()} ending in ${card.last}`}
            secondary={expired ? `Expired ${card.month}/${card.year}` : `Expiring ${card.month}/${card.year}`}
          />
          <ListItemSecondaryAction>
            <Button variant="contained" color="primary" size="small" onClick={update} disabled={!!updating}>
              {updating ? 'Processing...' : 'Update'}
            </Button>
          </ListItemSecondaryAction>
        </ListItemButton>
      </List>
    </>
  )
}
