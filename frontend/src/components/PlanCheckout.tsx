import React from 'react'
import { makeStyles, List, ListItem, ListItemSecondaryAction, Typography, TextField, Button } from '@material-ui/core'
import { REMOTEIT_PRODUCT_ID, PERSONAL_PLAN_ID } from '../models/licensing'
import { ApplicationState, Dispatch } from '../store'
import { spacing, fontSizes, colors } from '../styling'
import { useSelector, useDispatch } from 'react-redux'
import { currencyFormatter } from '../helpers/utilHelper'
import { Icon } from './Icon'

type Props = {
  form: IPurchase
  license: ILicense | null
  onChange: (form: IPurchase) => void
  onCancel: () => void
}

export const PlanCheckout: React.FC<Props> = ({ form, license, onChange, onCancel }) => {
  const css = useStyles()
  const dispatch = useDispatch<Dispatch>()
  const { plans, purchasing } = useSelector((state: ApplicationState) => ({
    plans: state.licensing.plans.filter(p => p.product.id === REMOTEIT_PRODUCT_ID),
    license: state.licensing.license,
    purchasing: state.licensing.purchasing,
  }))

  const onSubmit = () => dispatch.licensing.subscribe(form)
  const setQuantity = value => onChange({ ...form, quantity: Math.max(Math.min(+value, 9999), 0) })
  const selectedPlan = plans.find(plan => plan.id === form.planId)
  const selectedPrice = selectedPlan?.prices.find(price => price.id === form.priceId)

  const unchanged = () =>
    form.planId === license?.plan?.id &&
    form.priceId === license?.price?.id &&
    form.quantity === (license?.quantity || 1)

  if (form.planId === PERSONAL_PLAN_ID)
    return (
      <>
        <List className={css.list}>
          <ListItem>
            <Typography variant="h1">Personal plan</Typography>
          </ListItem>
          <ListItem>
            <Typography variant="body1"> Are you sure you want to switch to the Personal plan?</Typography>
          </ListItem>
        </List>
        <List className={css.list}>
          <ListItem>
            <Button onClick={dispatch.licensing.unsubscribe} color="primary" variant="contained" disabled={purchasing}>
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
          <Typography variant="h1">{selectedPlan?.description} plan</Typography>
        </ListItem>
      </List>
      <List className={css.list}>
        <ListItem>
          <Typography variant="h2">Interval</Typography>
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
        <ListItem>
          <Typography variant="h2">Seats</Typography>
          <ListItemSecondaryAction>
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
          </ListItemSecondaryAction>
        </ListItem>
        <ListItem>
          <Typography variant="h2">Total</Typography>
          <ListItemSecondaryAction>
            <Typography variant="h2">
              {selectedPrice?.amount ? (
                <>
                  {currencyFormatter(selectedPrice?.currency, (selectedPrice?.amount || 0) * form.quantity)}
                  &nbsp;/&nbsp;
                  {selectedPrice?.interval}
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
            {purchasing ? 'Processing...' : 'Checkout'}
          </Button>
          <Button onClick={onCancel} disabled={purchasing}>
            Cancel
          </Button>
        </ListItem>
      </List>
    </>
  )
}

const useStyles = makeStyles({
  list: {
    width: '50%',
    minWidth: 400,
    '& .MuiListItem-root': { marginBottom: spacing.sm },
    '& h1': { textTransform: 'capitalize' },
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
