import React from 'react'
import { makeStyles } from '@mui/styles'
import { PERSONAL_PLAN_ID, deviceUserTotal } from '../models/plans'
import { Divider, List, ListItem, ListItemSecondaryAction, Typography, Button } from '@mui/material'
import { State, Dispatch } from '../store'
import { useSelector, useDispatch } from 'react-redux'
import { currencyFormatter } from '../helpers/utilHelper'
import { QuantitySelector } from './QuantitySelector'
import { spacing } from '../styling'
import { Icon } from './Icon'
import { Pre } from './Pre'

type Props = {
  plans: IPlan[]
  form: IPurchase
  license: ILicense | null
  onChange: (form: IPurchase) => void
  onCancel: () => void
  onSuccess: () => void
}

export const PlanCheckout: React.FC<Props> = ({ plans, form, license, onChange, onCancel, onSuccess }) => {
  const css = useStyles()
  const dispatch = useDispatch<Dispatch>()
  const purchasing = useSelector((state: State) => state.plans.purchasing === form.planId)
  const selectedPlan = plans.find(plan => plan.id === form.planId)
  const selectedPrice = selectedPlan?.prices?.find(price => price.id === form.priceId)
  const totals = deviceUserTotal(form.quantity, selectedPlan)

  const setQuantity = (value: string | number) => {
    let quantity = Math.ceil(Math.max(Math.min(+value, 9999), 0))
    if (isNaN(quantity)) quantity = 1
    onChange({ ...form, quantity })
  }

  const setNextInterval = () => {
    const priceArray = selectedPlan?.prices || []
    const next = priceArray.findIndex(p => form.priceId === p.id) + 1
    const index = priceArray.length <= next ? 0 : next
    const priceId = priceArray[index]?.id
    onChange({ ...form, priceId })
  }

  const onSubmit = async () => {
    if (license?.subscription) await dispatch.plans.updateSubscription(form)
    else await dispatch.plans.subscribe(form)
    onSuccess()
  }

  const unchanged = () =>
    form.planId === license?.plan?.id &&
    form.priceId === license?.subscription?.price?.id &&
    form.quantity === (license?.quantity || 1)

  if (form.planId === PERSONAL_PLAN_ID)
    return (
      <>
        <List className={css.list}>
          <ListItem>
            <Typography variant="h1">Personal plan</Typography>
          </ListItem>
          <ListItem>
            <Typography variant="body1">
              Are you sure you want to switch to the Personal plan? This will cancel your subscription.
            </Typography>
          </ListItem>
        </List>
        <List className={css.list}>
          <ListItem>
            <Button
              onClick={async () => {
                await dispatch.plans.unsubscribe(form)
                onSuccess()
              }}
              color="primary"
              variant="contained"
              disabled={purchasing}
            >
              {purchasing ? 'Processing...' : 'Downgrade'}
            </Button>
            <Button onClick={onCancel} disabled={purchasing}>
              Cancel
            </Button>
          </ListItem>
        </List>
      </>
    )

  return (
    <>
      <List className={css.list}>
        <ListItem>
          <Typography variant="h2">{selectedPlan?.description} plan</Typography>
        </ListItem>
      </List>
      <List className={css.list}>
        <ListItem onClick={() => setNextInterval()}>
          <Typography variant="h3">Interval</Typography>
          <ListItemSecondaryAction>
            <div className={css.group}>
              {selectedPlan?.prices?.map(price => (
                <Button
                  key={price.id}
                  size="small"
                  variant={form.priceId === price.id ? 'contained' : undefined}
                  color={form.priceId === price.id ? 'primary' : undefined}
                  onClick={() => onChange({ ...form, priceId: price.id })}
                >
                  {price.interval}
                </Button>
              ))}
            </div>
          </ListItemSecondaryAction>
        </ListItem>
        <ListItem onClick={() => setQuantity(form.quantity + 1)}>
          <Typography variant="h3">Licenses</Typography>
          <ListItemSecondaryAction>
            <QuantitySelector quantity={form.quantity} onChange={setQuantity} />
          </ListItemSecondaryAction>
        </ListItem>
        <ListItem>
          <Typography variant="h3">Users</Typography>
          <ListItemSecondaryAction>
            <Typography variant="h3" display="flex" alignItems="center" color="grayDarker.main">
              {totals.users}
              <Icon name="user" size="base" type="solid" color="gray" fixedWidth inline />
            </Typography>
          </ListItemSecondaryAction>
        </ListItem>
        <ListItem>
          <Typography variant="h3">Devices</Typography>
          <ListItemSecondaryAction>
            <Typography variant="h3" display="flex" color="grayDarker.main">
              {totals.devices}
              <Icon name="unknown" size="lg" platformIcon inline />
            </Typography>
          </ListItemSecondaryAction>
        </ListItem>
      </List>
      <List className={css.list}>
        <Divider />
        <ListItem>
          <Typography variant="h3">Total</Typography>
          <ListItemSecondaryAction>
            <Typography variant="h3">
              {selectedPrice?.amount ? (
                <>
                  {currencyFormatter(selectedPrice?.currency, (selectedPrice?.amount || 0) * form.quantity)}
                  &nbsp;/&nbsp;
                  {selectedPrice?.interval?.toLowerCase()}
                </>
              ) : (
                <em>Free</em>
              )}
            </Typography>
          </ListItemSecondaryAction>
        </ListItem>
      </List>
      <List className={css.list}>
        <ListItem>
          <Button
            onClick={onSubmit}
            color="primary"
            variant="contained"
            disabled={purchasing || unchanged() || !form.quantity}
          >
            {purchasing ? 'Processing...' : license?.subscription ? 'Update' : 'Checkout'}
          </Button>
          <Button onClick={onCancel} disabled={purchasing}>
            Cancel
          </Button>
        </ListItem>
      </List>
    </>
  )
}

export const useStyles = makeStyles(({ palette }) => ({
  list: {
    width: '50%',
    minWidth: 400,
    '& .MuiListItem-root': { padding: spacing.sm },
    '& h2': { textTransform: 'capitalize' },
  },
  group: {
    border: `1px solid ${palette.grayLighter.main}`,
    borderRadius: spacing.md,
    backgroundColor: palette.white.main,
    display: 'inline-block',
    '& > .MuiButton-root': { height: 30, borderRadius: 0 },
    '& > .MuiButton-root + .MuiButton-root': { marginLeft: 0 },
    '& > .MuiButton-root:first-of-type': { borderTopLeftRadius: spacing.md, borderBottomLeftRadius: spacing.md },
    '& > .MuiButton-root:last-child': { borderTopRightRadius: spacing.md, borderBottomRightRadius: spacing.md },
  },
}))
