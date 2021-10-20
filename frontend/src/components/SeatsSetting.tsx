import React from 'react'
import { PERSONAL_PLAN_ID } from '../models/licensing'
import {
  makeStyles,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  TextField,
  InputLabel,
  Button,
} from '@material-ui/core'
import { ApplicationState, Dispatch } from '../store'
import { spacing, fontSizes, colors } from '../styling'
import { useSelector, useDispatch } from 'react-redux'
import { getRemoteitLicense } from '../models/licensing'
import { currencyFormatter } from '../helpers/utilHelper'
import { REMOTEIT_PRODUCT_ID } from '../models/licensing'
import { ConfirmButton } from '../buttons/ConfirmButton'
import { IconButton } from '../buttons/IconButton'
import { Icon } from './Icon'

export const SeatsSetting: React.FC = () => {
  const css = useStyles()
  const dispatch = useDispatch<Dispatch>()
  const { plans, license, purchasing } = useSelector((state: ApplicationState) => ({
    plans: state.licensing.plans.filter(p => p.product.id === REMOTEIT_PRODUCT_ID),
    purchasing: !!state.licensing.purchasing,
    license: getRemoteitLicense(state),
  }))

  const getDefaults = () => ({
    priceId: license?.subscription?.price?.id,
    quantity: license?.quantity || 1,
  })

  const [form, setForm] = React.useState<IPurchase>(getDefaults())
  const selectedPlan = plans.find(plan => plan.id === license?.plan?.id)
  const selectedPrice = selectedPlan?.prices?.find(price => price.id === form.priceId)

  const setQuantity = (value: string | number) => {
    let quantity = Math.max(Math.min(+value, 9999), 0)
    if (isNaN(quantity)) quantity = 1
    setForm({ ...form, quantity })
  }

  const unchanged = () =>
    form.priceId === license?.subscription?.price?.id && form.quantity === (license?.quantity || 1)

  if (license?.plan?.id === PERSONAL_PLAN_ID) return null

  return (
    <>
      <List className={css.seats}>
        <ListItem>
          <ListItemText>
            <InputLabel shrink>Seats</InputLabel>
            {selectedPrice?.amount ? (
              <>
                {currencyFormatter(selectedPrice?.currency, (selectedPrice?.amount || 0) * form.quantity)}
                &nbsp;/&nbsp;
                {selectedPrice?.interval.toLowerCase()}
              </>
            ) : (
              <em>Free</em>
            )}
          </ListItemText>
          <ListItemSecondaryAction>
            {!unchanged() && !!form.quantity && (
              <>
                {/* <IconButton title="Reset" icon="undo" type="solid" onClick={() => setForm(getDefaults())} /> */}
                <IconButton
                  title="Cancel"
                  icon="times"
                  size="md"
                  disabled={purchasing}
                  onClick={() => setForm(getDefaults())}
                />
                <ConfirmButton
                  title="Purchase"
                  icon="check"
                  color="primary"
                  size="md"
                  loading={purchasing}
                  disabled={purchasing}
                  onClick={() => dispatch.licensing.updateSubscription(form)}
                  confirm
                  confirmTitle="Confirm Billing Change"
                  confirmMessage={
                    <>
                      Please confirm that you want to change your billing to
                      <b>
                        {' '}
                        {currencyFormatter(selectedPrice?.currency, (selectedPrice?.amount || 0) * form.quantity)}
                        &nbsp;/&nbsp;
                        {selectedPrice?.interval.toLowerCase()}
                      </b>{' '}
                      for {form.quantity} seat{form.quantity > 1 ? 's' : ''}.
                    </>
                  }
                />
              </>
            )}
            <div className={css.group}>
              <Button size="small" variant="contained" color="primary" onClick={() => setQuantity(form.quantity - 1)}>
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
              <Button size="small" variant="contained" color="primary" onClick={() => setQuantity(form.quantity + 1)}>
                <Icon name="plus" size="sm" />
              </Button>
            </div>
          </ListItemSecondaryAction>
          {/* <Button onClick={onCancel}  disabled={purchasing}>Cancel</Button> */}
        </ListItem>
      </List>
    </>
  )
}

const useStyles = makeStyles({
  seats: {
    '& .MuiListItem-root': {
      paddingLeft: spacing.md,
    },
    '& .MuiListItemSecondaryAction-root': {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
    },
  },
  group: {
    border: `1px solid ${colors.grayLighter}`,
    borderRadius: spacing.md,
    backgroundColor: colors.white,
    marginLeft: spacing.md,
    display: 'inline-block',
    height: 32,
    overflow: 'hidden',
    '& > .MuiButton-root': { height: '100%', borderRadius: 0 },
    '& > .MuiButton-root + .MuiButton-root': { marginLeft: 0 },
    '& > .MuiButton-root:first-child': { borderTopLeftRadius: spacing.md, borderBottomLeftRadius: spacing.md },
    '& > .MuiButton-root:last-child': { borderTopRightRadius: spacing.md, borderBottomRightRadius: spacing.md },
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
