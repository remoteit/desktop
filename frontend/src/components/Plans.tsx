import React from 'react'
import { Gutters } from './Gutters'
import { PlanCard } from './PlanCard'
import { currencyFormatter } from '../helpers/utilHelper'
import { makeStyles, List, ListItem, ListItemText, Typography, TextField, Divider, Button } from '@material-ui/core'
import { REMOTEIT_PRODUCT_ID, PERSONAL_PLAN_ID } from '../models/licensing'
import { ApplicationState, Dispatch } from '../store'
import { useSelector, useDispatch } from 'react-redux'
import { spacing, fontSizes, colors } from '../styling'
import { Icon } from './Icon'

export const Plans: React.FC = () => {
  const css = useStyles()
  const dispatch = useDispatch<Dispatch>()
  const { plans, license, purchasing } = useSelector((state: ApplicationState) => ({
    plans: state.licensing.plans.filter(p => p.product.id === REMOTEIT_PRODUCT_ID),
    license: state.licensing.license,
    purchasing: state.licensing.purchasing,
  }))
  const getDefaults = () => ({
    planId: license?.plan?.id,
    priceId: license?.price?.id,
    quantity: license?.quantity || 1,
    successUrl: window.location.href,
    cancelUrl: window.location.href, //TODO add the state to the url?
  })

  const [form, setForm] = React.useState<IPurchase>(getDefaults())

  React.useEffect(() => {
    setForm(getDefaults())
  }, [license])

  const setQuantity = value => {
    setForm({ ...form, quantity: Math.max(Math.min(+value, 9999), 0) })
  }

  const unchanged = () =>
    form.planId === license?.plan?.id &&
    form.priceId === license?.price?.id &&
    form.quantity === (license?.quantity || 1)

  const selectedPlan = plans.find(plan => plan.id === form.planId)
  const selectedPrice = selectedPlan?.prices.find(price => price.id === form.priceId)

  return (
    <Gutters size="md" top="xl" className={css.plans}>
      <PlanCard
        name="Personal"
        description="For non-commercial use"
        price={0}
        caption="Free"
        selected={form.planId === PERSONAL_PLAN_ID}
        button="Select"
        onClick={() => setForm({ ...form, planId: PERSONAL_PLAN_ID })}
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
      {plans.map(plan => (
        <PlanCard
          key={plan.id}
          name={plan.description}
          description="For business use"
          price={5}
          caption="per month / per user"
          selected={form.planId === plan.id}
          button="Select"
          showChildren={!!selectedPlan?.prices.length}
          onClick={() => setForm({ ...form, planId: plan.id, priceId: plan.prices[0].id })}
          feature="Endpoints are not limited*"
          features={[
            '30 days of activity logs',
            'User groups - coming soon',
            'Commercial use',
            'APIs',
            'Mobile app',
            'Non-commercial',
            'SSO with Google',
          ]}
        >
          <List>
            <ListItem>Subscription type</ListItem>
            <ListItem>
              <div className={css.group}>
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
              </div>
            </ListItem>
            <ListItem>Number of seats</ListItem>
            <ListItem>
              <div className={css.group}>
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
              </div>
            </ListItem>
            <ListItem>Total</ListItem>
            <ListItem>
              <Typography variant="h2">
                {currencyFormatter(selectedPrice?.currency, (selectedPrice?.amount || 0) * form.quantity)}
                &nbsp;/&nbsp;
                {selectedPrice?.interval}
              </Typography>
            </ListItem>
          </List>
          <Divider />
          <List>
            <ListItem>
              <Button
                onClick={() => dispatch.licensing.subscribe(form)}
                size="small"
                color="primary"
                variant="contained"
                disabled={purchasing || unchanged() || !form.quantity}
              >
                {purchasing ? 'Processing...' : 'Purchase'}
              </Button>
              <Button size="small" onClick={() => setForm(getDefaults())} disabled={purchasing}>
                Cancel
              </Button>
            </ListItem>
          </List>
        </PlanCard>
      ))}
      <PlanCard
        name="Enterprise"
        description="For large volume and OEM"
        caption={
          <>
            Large-scale solutions
            <br /> or custom use cases
          </>
        }
        button="Contact Us"
        selected={false}
        feature="Volume endpoints or user accounts*"
        features={['1 year of activity logs', 'Slack support', 'Analytics and reporting']}
      />
    </Gutters>
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
