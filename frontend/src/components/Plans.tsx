import React from 'react'
import { Gutters } from './Gutters'
import { PlanCard } from './PlanCard'
import { makeStyles, List, ListItem, ListItemSecondaryAction, TextField, Collapse, Button } from '@material-ui/core'
import { REMOTEIT_PRODUCT_ID } from '../models/licensing'
import { ApplicationState, Dispatch } from '../store'
import { useSelector, useDispatch } from 'react-redux'
import { spacing, fontSizes, colors } from '../styling'
import { Icon } from './Icon'

export const Plans: React.FC = () => {
  const css = useStyles()
  const dispatch = useDispatch<Dispatch>()
  const { plans, subscription, purchasing } = useSelector((state: ApplicationState) => ({
    plans: state.licensing.plans.filter(p => p.product.id === REMOTEIT_PRODUCT_ID),
    subscription: state.licensing.license,
    purchasing: state.licensing.purchasing,
  }))
  const [form, setForm] = React.useState<IPurchase>({
    planId: subscription?.plan?.id,
    priceId: subscription?.price?.id,
    quantity: subscription?.quantity || 1,
    successUrl: window.location.href,
    cancelUrl: window.location.href, //TODO add the state to the url?
  })

  const setQuantity = value => {
    setForm({ ...form, quantity: Math.max(Math.min(+value, 9999), 0) })
  }

  const unchanged = () =>
    form.planId === subscription?.plan?.id &&
    form.priceId === subscription?.price?.id &&
    form.quantity === (subscription?.quantity || 1)

  const selectedPlan = plans.find(plan => plan.id === form.planId)

  return (
    <>
      <Gutters size="md" top="xl" className={css.plans}>
        <PlanCard
          name="Personal"
          description="For non-commercial use"
          price={0}
          caption="Free"
          feature="Up to 5 devices*"
          features={[
            'Prototyping / POC',
            '7 days of activity logs',
            'Web support',
            'Scripts',
            'APIs',
            'Mobile app',
            'Non-commercial',
            'SSO with Google',
          ]}
        />
        <PlanCard
          name="Professional"
          description="For business use"
          price={5}
          caption="per month / per user"
          feature="Endpoints are not limited.*"
          features={[
            '30 days of activity logs',
            'User groups - comming soon',
            'Commercial use',
            'APIs',
            'Mobile app',
            'Non-commercial',
            'SSO with Google',
          ]}
        />
        <PlanCard
          name="Enterprise"
          description="For large volume and OEM"
          caption="Large-scale solutions or custom usee cases."
          feature="Volume endpoints or user accounts*"
          features={['1 year of activity logs', 'Slack support', 'Analytics and reporting']}
        />
      </Gutters>
      <Gutters>
        <List>
          <ListItem>
            Selected plan
            <ListItemSecondaryAction>
              <span className={css.group}>
                {plans.map((plan: IPlan, index) => (
                  <Button
                    key={index}
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
          <Collapse in={!!selectedPlan?.prices.length} timeout={400}>
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
              onClick={() => dispatch.licensing.subscribe(form)}
              color="primary"
              variant="contained"
              disabled={purchasing || unchanged() || !form.quantity}
            >
              {purchasing ? 'Processing...' : 'Purchase'}
            </Button>
          </ListItem>
        </List>
      </Gutters>
    </>
  )
}

const useStyles = makeStyles({
  plans: {
    display: 'flex',
    '& > div': { width: '33%' },
  },
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
