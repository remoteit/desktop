import React, { useEffect } from 'react'
import { Title } from '../components/Title'
import { Gutters } from '../components/Gutters'
import { Container } from '../components/Container'
import {
  makeStyles,
  List,
  ListItem,
  ListItemSecondaryAction,
  Divider,
  Typography,
  TextField,
  Collapse,
  Button,
} from '@material-ui/core'
import { REMOTEIT_PRODUCT_ID } from '../models/licensing'
import { ApplicationState, Dispatch } from '../store'
import { useSelector, useDispatch } from 'react-redux'
import { spacing, fontSizes, colors } from '../styling'
import { selectPlans } from '../models/billing'
import { Icon } from '../components/Icon'
import analyticsHelper from '../helpers/analyticsHelper'

export const PlansPage: React.FC = () => {
  const css = useStyles()
  const dispatch = useDispatch<Dispatch>()
  // const { license } = useSelector((state: ApplicationState) => selectLicense(state, REMOTEIT_PRODUCT_ID))
  const { plans, subscription, purchasing } = useSelector((state: ApplicationState) => ({
    plans: selectPlans(state, REMOTEIT_PRODUCT_ID),
    subscription: state.billing.subscription,
    purchasing: state.billing.purchasing,
  }))
  const [form, setForm] = React.useState<IPurchase>({
    planId: subscription?.plan.id,
    priceId: subscription?.price.id,
    quantity: subscription?.quantity || 1,
    successUrl: window.location.href,
    cancelUrl: window.location.href, //TODO add the state to the url?
  })

  useEffect(() => {
    analyticsHelper.page('PlansPage')
  }, [])

  const setQuantity = value => {
    setForm({ ...form, quantity: Math.max(Math.min(+value, 9999), 0) })
  }

  const unchanged = () =>
    form.planId === subscription?.plan.id &&
    form.priceId === subscription?.price.id &&
    form.quantity === (subscription?.quantity || 1)

  const selectedPlan = plans.find(plan => plan.id === form.planId)

  return (
    <Container
      gutterBottom
      header={
        <Typography variant="h1">
          <Title>Plans</Title>
        </Typography>
      }
    >
      <Gutters size="md" top="xl">
        <List>
          <ListItem>
            Selected plan
            <ListItemSecondaryAction>
              <span className={css.group}>
                {plans.map((plan: IPlan) => (
                  <Button
                    key={plan.id}
                    size="small"
                    variant={form.planId === plan.id ? 'contained' : undefined}
                    color={form.planId === plan.id ? 'primary' : undefined}
                    onClick={() => setForm({ ...form, planId: plan.id, priceId: plan.prices[0]?.id })}
                  >
                    {plan.description}
                  </Button>
                ))}
              </span>
            </ListItemSecondaryAction>
          </ListItem>
          <Collapse in={!!selectedPlan?.prices.length} timeout={200}>
            <ListItem>
              Subscription type
              <ListItemSecondaryAction>
                <span className={css.group}>
                  {selectedPlan?.prices?.map(price => (
                    <Button
                      key={price.id}
                      size="small"
                      variant={form.priceId === price.id ? 'contained' : undefined}
                      color={form.priceId === price.id ? 'primary' : undefined}
                      onClick={() => setForm({ ...form, priceId: price.id })}
                    >
                      {price.interval}
                    </Button>
                  ))}
                </span>
              </ListItemSecondaryAction>
            </ListItem>
            <ListItem>
              Number of seats
              <ListItemSecondaryAction>
                <span className={css.group}>
                  <Button
                    className={css.icon}
                    size="small"
                    variant="contained"
                    color="primary"
                    onClick={() => setQuantity(form.quantity - 1)}
                  >
                    <Icon name="minus" size="sm" />
                  </Button>
                  <TextField
                    size="small"
                    value={form.quantity}
                    hiddenLabel
                    color="primary"
                    onChange={e => setQuantity(e.target.value)}
                    className={css.quantity}
                  />
                  <Button
                    className={css.icon}
                    size="small"
                    variant="contained"
                    color="primary"
                    onClick={() => setQuantity(form.quantity + 1)}
                  >
                    <Icon name="plus" size="sm" />
                  </Button>
                </span>
              </ListItemSecondaryAction>
            </ListItem>
          </Collapse>
          <ListItem>
            <Button
              onClick={() => dispatch.billing.purchase(form)}
              color="primary"
              variant="contained"
              disabled={purchasing || unchanged() || !form.quantity}
            >
              {purchasing ? 'Please wait...' : 'Purchase'}
            </Button>
          </ListItem>
        </List>
      </Gutters>
    </Container>
  )
}

const useStyles = makeStyles({
  group: {
    border: `1px solid ${colors.grayLighter}`,
    borderRadius: spacing.md,
    display: 'inline-block',
    '& > .MuiButton-root': { height: 30, borderRadius: 0 },
    '& > .MuiButton-root + .MuiButton-root': { marginLeft: 0 },
    '& > .MuiButton-root:first-child': { borderTopLeftRadius: spacing.md, borderBottomLeftRadius: spacing.md },
    '& > .MuiButton-root:last-child': { borderTopRightRadius: spacing.md, borderBottomRightRadius: spacing.md },
  },
  icon: {
    padding: 0,
  },
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
