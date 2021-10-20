import React from 'react'
import { PERSONAL_PLAN_ID } from '../models/licensing'
import { makeStyles, List, ListItem, ListItemSecondaryAction, Typography, Button } from '@material-ui/core'
import { ApplicationState, Dispatch } from '../store'
import { spacing, fontSizes, colors } from '../styling'
import { useSelector, useDispatch } from 'react-redux'
import { currencyFormatter } from '../helpers/utilHelper'

type Props = {
  plans: IPlan[]
  form: IPurchase
  license: ILicense | null
  onChange: (form: IPurchase) => void
  onCancel: () => void
}

export const PlanCheckout: React.FC<Props> = ({ plans, form, license, onChange, onCancel }) => {
  const css = useStyles()
  const dispatch = useDispatch<Dispatch>()
  const purchasing = useSelector((state: ApplicationState) => !!state.licensing.purchasing)
  const selectedPlan = plans.find(plan => plan.id === form.planId)
  const selectedPrice = selectedPlan?.prices?.find(price => price.id === form.priceId)

  const setNextInterval = () => {
    const priceArray = selectedPlan?.prices || []
    const next = priceArray.findIndex(p => form.priceId === p.id) + 1
    const index = priceArray.length <= next ? 0 : next
    const priceId = priceArray[index]?.id
    onChange({ ...form, priceId })
  }

  const onSubmit = () => {
    if (license?.plan?.id === form.planId) dispatch.licensing.updateSubscription(form)
    else dispatch.licensing.subscribe(form)
  }

  const unchanged = () => form.planId === license?.plan?.id && form.priceId === license?.subscription?.price?.id

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
          <Typography variant="h2">{selectedPlan?.description} plan</Typography>
        </ListItem>
      </List>
      <List className={css.list}>
        <ListItem button onClick={() => setNextInterval()}>
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
        <ListItem>
          <Typography variant="h3">Total</Typography>
          <ListItemSecondaryAction>
            <Typography variant="h3">
              {selectedPrice?.amount ? (
                <>
                  {currencyFormatter(selectedPrice?.currency, (selectedPrice?.amount || 0) * form.quantity)}
                  &nbsp;/&nbsp;
                  {selectedPrice?.interval.toLowerCase()}
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
          <Button onClick={onSubmit} color="primary" variant="contained" disabled={purchasing || unchanged()}>
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
    '& .MuiListItem-root': { padding: spacing.sm },
    '& h2': { textTransform: 'capitalize' },
  },
  group: {
    border: `1px solid ${colors.grayLighter}`,
    borderRadius: spacing.md,
    backgroundColor: colors.white,
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
