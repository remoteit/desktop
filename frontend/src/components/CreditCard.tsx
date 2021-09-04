import React from 'react'
import { Gutters } from './Gutters'
import { Elements } from '@stripe/react-stripe-js'
import { CreditCardForm } from './CreditCardForm'
import { makeStyles, Collapse, Typography, Button, ListItem, ListItemText, ListItemIcon } from '@material-ui/core'
import { ApplicationState } from '../store'
import { useSelector } from 'react-redux'
import { Icon } from './Icon'

const ELEMENTS_OPTIONS = {
  fonts: [{ cssSrc: 'https://fonts.googleapis.com/css?family=Roboto' }],
}

export const CreditCard: React.FC = () => {
  const css = useStyles()
  const [update, setUpdate] = React.useState<boolean>(false)
  const { license, stripePromise } = useSelector((state: ApplicationState) => state.licensing)
  const card = license?.card

  if (!card) return null

  return (
    <>
      <Typography variant="subtitle1">Credit Card</Typography>
      <Collapse in={update} timeout={400}>
        <Gutters>
          <Elements stripe={stripePromise} options={ELEMENTS_OPTIONS}>
            <CreditCardForm data={card} onCancel={() => setUpdate(false)} />
          </Elements>
        </Gutters>
      </Collapse>
      <Collapse in={!update} timeout={400}>
        <ListItem>
          <ListItemIcon>
            <Icon name="credit-card" size="md" />
          </ListItemIcon>
          {/* <pre>{JSON.stringify(card, undefined, 2)}</pre> */}
          <ListItemText
            primary={`${card.brand} ending in ${card.last}`}
            secondary={`Expiring ${card.month}/${card.year}`}
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
