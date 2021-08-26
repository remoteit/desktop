import React, { useEffect } from 'react'
import { Tag } from '../components/Tag'
import { Title } from '../components/Title'
import { Gutters } from '../components/Gutters'
import { Container } from '../components/Container'
import { makeStyles, Typography, TextField, ButtonGroup, Button } from '@material-ui/core'
import { REMOTEIT_PRODUCT_ID, selectLicense } from '../models/licensing'
import { ApplicationState, Dispatch } from '../store'
import { useSelector, useDispatch } from 'react-redux'
import { spacing, fontSizes } from '../styling'
import analyticsHelper from '../helpers/analyticsHelper'

type IPurchase = {
  plan: 'PERSONAL' | 'PROFESSIONAL' | string
  quantity: number
  interval: 'MONTH' | 'YEAR'
  successUrl: string
  cancelUrl: string
}

export const PlansPage: React.FC = () => {
  const css = useStyles()
  const dispatch = useDispatch<Dispatch>()
  const { license } = useSelector((state: ApplicationState) => selectLicense(state, REMOTEIT_PRODUCT_ID))
  const [form, setForm] = React.useState<IPurchase>({
    plan: license?.plan.name || 'PERSONAL',
    quantity: 1,
    interval: 'YEAR',
    successUrl: window.location.href,
    cancelUrl: window.location.href,
  })

  useEffect(() => {
    analyticsHelper.page('PlansPage')
  }, [])

  const setQuantity = value => {
    setForm({ ...form, quantity: Math.max(+value, 0) })
  }

  return (
    <Container
      gutterBottom
      header={
        <>
          <Typography variant="h1">
            <Title>Plans</Title>
          </Typography>
        </>
      }
    >
      <Gutters top="xl">
        <ButtonGroup>
          <Button
            size="small"
            variant={form.interval === 'MONTH' ? 'contained' : undefined}
            color={form.interval === 'MONTH' ? 'primary' : undefined}
            onClick={() => setForm({ ...form, interval: 'MONTH' })}
          >
            Monthly
          </Button>
          <Button
            size="small"
            variant={form.interval === 'YEAR' ? 'contained' : undefined}
            color={form.interval === 'YEAR' ? 'primary' : undefined}
            onClick={() => setForm({ ...form, interval: 'YEAR' })}
          >
            Yearly
          </Button>
        </ButtonGroup>
      </Gutters>
      <Gutters top="md">
        <ButtonGroup>
          <Button size="small" variant="contained" color="primary" onClick={() => setQuantity(form.quantity - 1)}>
            -
          </Button>
          <TextField
            size="small"
            value={form.quantity}
            hiddenLabel
            color="primary"
            onChange={e => setQuantity(e.target.value)}
            className={css.quantity}
          />

          <Button size="small" variant="contained" color="primary" onClick={() => setQuantity(form.quantity + 1)}>
            +
          </Button>
        </ButtonGroup>
        <pre>{JSON.stringify(license, null, 2)}</pre>
      </Gutters>
    </Container>
  )
}

const useStyles = makeStyles({
  quantity: {
    maxWidth: 60,
    '& .MuiInputBase-input': {
      height: spacing.md,
      fontSize: fontSizes.base,
      fontWeight: 500,
      padding: spacing.xs,
      textAlign: 'center',
    },
  },
})
