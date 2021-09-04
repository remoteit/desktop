import React, { useState } from 'react'
import { Stripe, StripeCardElementChangeEvent, StripeCardElementOptions, PaymentMethodResult } from '@stripe/stripe-js'
import { CardElement, Elements, useElements, useStripe } from '@stripe/react-stripe-js'
import { makeStyles, Typography, TextField, Button } from '@material-ui/core'
import { colors, spacing, fontSizes, radius } from '../styling'

const CARD_OPTIONS: StripeCardElementOptions = {
  style: {
    base: {
      backgroundColor: colors.grayLightest,
      fontFamily: 'Roboto',
      fontSize: `${fontSizes.md}px`,
      iconColor: colors.grayDark,
      color: colors.grayDarkest,
      '::placeholder': {
        color: colors.gray,
      },
    },
    invalid: {
      iconColor: colors.danger,
      color: colors.danger,
    },
  },
}

type Props = {
  data: ICreditCard
  onCancel: () => void
}

export const CreditCardForm: React.FC<Props> = ({ data, onCancel }) => {
  const css = useStyles()
  const stripe = useStripe()
  const elements = useElements()
  const [error, setError] = useState<StripeCardElementChangeEvent['error'] | PaymentMethodResult['error']>()
  const [cardComplete, setCardComplete] = useState<boolean>(false)
  const [processing, setProcessing] = useState<boolean>(false)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodResult['paymentMethod']>()
  const [billingDetails, setBillingDetails] = useState({
    email: '',
    phone: '',
    name: '',
  })

  const handleSubmit = async event => {
    event.preventDefault()

    if (!stripe || !elements) return

    if (error) {
      elements.getElement('card')?.focus()
      return
    }

    if (cardComplete) {
      setProcessing(true)
    }

    const payload = await stripe.createPaymentMethod({
      type: 'card',
      card: elements.getElement(CardElement),
      billing_details: billingDetails,
    })

    setProcessing(false)

    if (payload.error) {
      setError(payload.error)
    } else {
      setPaymentMethod(payload.paymentMethod)
    }
  }

  // const reset = () => {
  //   setError(null)
  //   setProcessing(false)
  //   setPaymentMethod(null)
  //   setBillingDetails({
  //     email: '',
  //     phone: '',
  //     name: '',
  //   })
  // }

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <TextField
          required
          fullWidth
          variant="filled"
          label="Name"
          size="small"
          placeholder="Jane Doe"
          autoComplete="name"
          value={billingDetails.name}
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
          value={billingDetails.email}
          onChange={e => setBillingDetails({ ...billingDetails, email: e.target.value })}
        />
        <TextField
          required
          fullWidth
          variant="filled"
          label="Phone"
          size="small"
          placeholder="(800) 555-0123"
          autoComplete="tel"
          value={billingDetails.phone}
          onChange={e => setBillingDetails({ ...billingDetails, phone: e.target.value })}
        />
      </div>
      <div className={css.card}>
        <CardElement
          options={CARD_OPTIONS}
          onChange={e => {
            setError(e.error)
            setCardComplete(e.complete)
          }}
        />
      </div>
      {/* {error && <ErrorMessage>{error.message}</ErrorMessage>} */}
      <Button type="submit" color="primary" variant="contained" disabled={!stripe || !!error}>
        {processing ? 'Processing...' : 'Save'}
      </Button>
      <Button onClick={onCancel}>Cancel</Button>
    </form>
  )
}

const useStyles = makeStyles({
  card: {
    // minHeight: spacing.xxl,
    padding: spacing.sm,
    backgroundColor: colors.grayLightest,
    // position: 'relative',
    borderRadius: radius,
    // display: 'flex',
    // alignItems: 'center',
    // justifyContent: 'center',
  },
})
