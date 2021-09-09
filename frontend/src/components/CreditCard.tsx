import React from 'react'
import { Gutters } from './Gutters'
import { Elements } from '@stripe/react-stripe-js'
import { CreditCardForm } from './CreditCardForm'
import {
  Collapse,
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

const ELEMENTS_OPTIONS = {
  fonts: [{ cssSrc: 'https://fonts.googleapis.com/css?family=Roboto' }],
}

export const CreditCard: React.FC = () => {
  const dispatch = useDispatch<Dispatch>()
  const [update, setUpdate] = React.useState<boolean>(false)
  const { license, stripePromise } = useSelector((state: ApplicationState) => state.licensing)
  const card = license?.card
  const expired = !!card && card.expiration < new Date()

  if (!card) return null

  return (
    <>
      <Typography variant="subtitle1">Credit Card</Typography>
      <Collapse in={update} timeout={400}>
        <Gutters>
          <Elements stripe={stripePromise} options={ELEMENTS_OPTIONS}>
            <CreditCardForm
              card={card}
              onSubmit={result => {
                dispatch.licensing.updateCreditCard(result)
                setUpdate(false)
              }}
              onCancel={() => setUpdate(false)}
            />
          </Elements>
        </Gutters>
      </Collapse>
      <Collapse in={!update} timeout={400}>
        <List>
          {expired && (
            <ListItem>
              <Notice severity="danger" gutterTop>
                Credit Card Expired. <em> Please update your card to continue service.</em>
              </Notice>
            </ListItem>
          )}
          <ListItem button>
            <ListItemIcon>
              <Icon name="credit-card" size="md" onClick={() => setUpdate(true)} />
            </ListItemIcon>
            <ListItemText
              primary={`${card.brand.toUpperCase()} ending in ${card.last}`}
              secondary={expired ? `Expired ${card.month}/${card.year}` : `Expiring ${card.month}/${card.year}`}
            />
            <ListItemSecondaryAction>
              <Button variant="contained" color="primary" size="small" onClick={() => setUpdate(true)}>
                Update
              </Button>
            </ListItemSecondaryAction>
          </ListItem>
        </List>
      </Collapse>
    </>
  )
}
