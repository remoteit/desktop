import React from 'react'
import {
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
} from '@material-ui/core'
import { ApplicationState, Dispatch } from '../store'
import { useSelector, useDispatch } from 'react-redux'
import { Notice } from './Notice'
import { Icon } from './Icon'

export const CreditCard: React.FC = () => {
  const dispatch = useDispatch<Dispatch>()
  const { license, updating } = useSelector((state: ApplicationState) => state.licensing)
  const card = license?.card
  const expired = !!card && card.expiration < new Date()
  const update = () => dispatch.licensing.updateCreditCard()

  if (!card) return null

  return (
    <>
      <Typography variant="subtitle1">Credit Card</Typography>
      <List>
        {expired && (
          <ListItem>
            <Notice severity="danger" gutterTop>
              Credit Card Expired. <em> Please update your card to continue service.</em>
            </Notice>
          </ListItem>
        )}
        <ListItem button onClick={update}>
          <ListItemIcon>
            <Icon name="credit-card" size="md" />
          </ListItemIcon>
          <ListItemText
            primary={`${card.brand.toUpperCase()} ending in ${card.last}`}
            secondary={expired ? `Expired ${card.month}/${card.year}` : `Expiring ${card.month}/${card.year}`}
          />
          <ListItemSecondaryAction>
            <Button variant="contained" color="primary" size="small" onClick={update} disabled={updating}>
              {updating ? 'Processing...' : 'Update'}
            </Button>
          </ListItemSecondaryAction>
        </ListItem>
      </List>
    </>
  )
}
