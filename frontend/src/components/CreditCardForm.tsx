import React, { useState } from 'react'
import { StripeCardElementOptions, PaymentMethodResult } from '@stripe/stripe-js'
import { CardElement, useElements, useStripe } from '@stripe/react-stripe-js'
import { makeStyles, TextField, Button } from '@material-ui/core'
import { colors, spacing, fontSizes, radius } from '../styling'

type Props = {
  card: ICard | null
  onCancel: () => void
  onSubmit: (card: PaymentMethodResult) => void
}

export const CreditCardForm: React.FC<Props> = ({ card, onSubmit, onCancel }) => {
  const css = useStyles()
  const stripe = useStripe()
  const elements = useElements()
  const [processing, setProcessing] = useState<boolean>(false)
  const [cardComplete, setCardComplete] = useState<boolean>(false)
  const [billingDetails, setBillingDetails] = useState<{ email?: string; phone?: string; name?: string }>(
    getCardDefaults()
  )

  function getCardDefaults() {
    return {
      email: card?.email,
      phone: card?.phone,
      name: card?.name,
    }
  }

  React.useEffect(() => {
    setBillingDetails(getCardDefaults())
  }, [card])

  const handleSubmit = async event => {
    event.preventDefault()
    if (!stripe || !elements) return

    const cardEl = elements.getElement(CardElement)
    if (!cardEl) return

    if (cardComplete) setProcessing(true)
    const payload = await stripe.createPaymentMethod({
      card: cardEl,
      type: 'card',
      billing_details: billingDetails,
    })
    onSubmit(payload)
    setProcessing(false)
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className={css.details}>
        <TextField
          required
          fullWidth
          variant="filled"
          label="Name"
          size="small"
          placeholder="Jane Doe"
          autoComplete="name"
          value={billingDetails.name || ''}
          onChange={e => setBillingDetails({ ...billingDetails, name: e.target.value })}
        />
        <TextField
          required
          fullWidth
          variant="filled"
          label="Email"
          size="small"
          placeholder="janedoe@gmail.com"
          autoComplete="email"
          value={billingDetails.email || ''}
          onChange={e => setBillingDetails({ ...billingDetails, email: e.target.value })}
        />
        <TextField
          fullWidth
          variant="filled"
          label="Phone"
          size="small"
          placeholder="(800) 555-0123"
          autoComplete="tel"
          value={billingDetails.phone || ''}
          onChange={e => setBillingDetails({ ...billingDetails, phone: e.target.value })}
        />
      </div>
      <div className={css.card}>
        <CardElement options={CARD_OPTIONS} onChange={e => setCardComplete(e.complete)} />
      </div>
      <Button type="submit" color="primary" variant="contained" disabled={!stripe || processing}>
        {processing ? 'Processing...' : 'Save'}
      </Button>
      <Button onClick={onCancel}>Cancel</Button>
    </form>
  )
}

const CARD_OPTIONS: StripeCardElementOptions = {
  style: {
    base: {
      backgroundColor: colors.grayLightest,
      fontFamily: 'Roboto',
      fontSize: `${fontSizes.md}px`,
      iconColor: colors.grayDark,
      color: colors.grayDarkest,
      '::placeholder': {
        color: colors.grayDark,
      },
    },
    invalid: {
      iconColor: colors.danger,
      color: colors.danger,
    },
  },
}

const useStyles = makeStyles({
  card: {
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
    padding: spacing.sm,
    backgroundColor: colors.grayLightest,
    borderRadius: radius,
  },
  details: {
    '& .MuiInputBase-root': {
      marginBottom: spacing.xxs,
    },
  },
})
