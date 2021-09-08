import React from 'react'
import { Gutters } from './Gutters'
import { Elements } from '@stripe/react-stripe-js'
import { CreditCardForm } from './CreditCardForm'
import { makeStyles, Collapse, Typography, Button, ListItem, ListItemText, ListItemIcon } from '@material-ui/core'
import { ApplicationState } from '../store'
import { useSelector } from 'react-redux'
import { Notice } from './Notice'
import { Icon } from './Icon'

const ELEMENTS_OPTIONS = {
  fonts: [{ cssSrc: 'https://fonts.googleapis.com/css?family=Roboto' }],
}

export const CreditCard: React.FC = () => {
  const css = useStyles()
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
            <CreditCardForm card={card} onCancel={() => setUpdate(false)} />
          </Elements>
        </Gutters>
      </Collapse>
      <Collapse in={!update} timeout={400}>
        {expired && (
          <ListItem>
            <Notice severity="danger" gutterTop>
              Credit Card Expired. <em> Please update your card to continue service.</em>
            </Notice>
          </ListItem>
        )}
        <ListItem>
          <ListItemIcon>
            <Icon name="credit-card" size="md" />
          </ListItemIcon>
          <ListItemText
            primary={`${card.brand.toUpperCase()} ending in ${card.last}`}
            secondary={expired ? `Expired ${card.month}/${card.year}` : `Expiring ${card.month}/${card.year}`}
          />
        </ListItem>
        <Gutters>
          <Button variant="contained" color="primary" onClick={() => setUpdate(true)}>
            Update
          </Button>
        </Gutters>
      </Collapse>
    </>
  )
}

const useStyles = makeStyles({})
