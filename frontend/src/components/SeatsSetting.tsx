import React from 'react'
import { PERSONAL_PLAN_ID, REMOTEIT_PRODUCT_ID } from '../models/licensing'
import { makeStyles, List, TextField, Button } from '@material-ui/core'
import { ApplicationState, Dispatch } from '../store'
import { spacing, fontSizes, colors } from '../styling'
import { useSelector, useDispatch } from 'react-redux'
import { currencyFormatter } from '../helpers/utilHelper'
import { InlineSetting } from './InlineSetting'
import { Confirm } from './Confirm'
import { Icon } from './Icon'

export const SeatsSetting: React.FC<{ license: ILicense | null }> = ({ license }) => {
  const css = useStyles()
  const dispatch = useDispatch<Dispatch>()
  const fieldRef = React.useRef<HTMLInputElement>(null)
  const { plans, purchasing } = useSelector((state: ApplicationState) => ({
    plans: state.licensing.plans.filter(p => p.product.id === REMOTEIT_PRODUCT_ID),
    purchasing: !!state.licensing.purchasing,
  }))

  const getDefaults = () => {
    const plan = plans.find(plan => plan.id === license?.plan?.id) || plans[0]
    const price = plan.prices?.find(p => p.id === license?.subscription?.price?.id) || plan.prices?.[0]
    return {
      priceId: price?.id,
      quantity: license?.quantity || 1,
    }
  }

  const [form, setForm] = React.useState<IPurchase>(getDefaults())
  const [confirm, setConfirm] = React.useState<boolean>(false)
  const selectedPlan = plans.find(plan => plan.id === license?.plan?.id)
  const selectedPrice = selectedPlan?.prices?.find(price => price.id === form.priceId)

  const setQuantity = (value: string | number) => {
    let quantity = Math.max(Math.min(+value, 9999), 0)
    if (isNaN(quantity)) quantity = 1
    setForm({ ...form, quantity })
  }

  if (license?.plan?.id === PERSONAL_PLAN_ID) return null

  return (
    <>
      <List>
        <InlineSetting
          hideIcon
          disabled={purchasing}
          label="User Licenses"
          warning="This will change your billing."
          value={form.quantity}
          resetValue={getDefaults().quantity}
          onResetClick={() => setForm(getDefaults())}
          onSubmit={async () => {
            if (form.quantity === getDefaults().quantity) return
            setConfirm(true)
          }}
          onCancel={() => setForm(getDefaults())}
          onShowEdit={() => setForm(getDefaults())}
        >
          <div className={css.group}>
            <Button size="small" variant="contained" color="primary" onClick={() => setQuantity(form.quantity - 1)}>
              <Icon name="minus" size="sm" />
            </Button>
            <TextField
              value={form.quantity}
              inputRef={fieldRef}
              hiddenLabel
              color="primary"
              onChange={e => setQuantity(e.target.value)}
              className={css.quantity}
            />
            <Button size="small" variant="contained" color="primary" onClick={() => setQuantity(form.quantity + 1)}>
              <Icon name="plus" size="sm" />
            </Button>
          </div>
          {selectedPrice?.amount ? (
            <>
              {currencyFormatter(selectedPrice?.currency, (selectedPrice?.amount || 0) * form.quantity)}
              &nbsp;/&nbsp;
              {selectedPrice?.interval.toLowerCase()}
            </>
          ) : (
            <em>Free</em>
          )}
        </InlineSetting>
        {confirm && (
          <Confirm
            open={confirm}
            title="Confirm Billing Change"
            onConfirm={() => {
              dispatch.licensing.updateSubscription(form)
              setConfirm(false)
            }}
            onDeny={() => {
              setForm(getDefaults())
              setConfirm(false)
            }}
          >
            Please confirm that you want to change your billing to &nbsp;
            <b>
              {currencyFormatter(selectedPrice?.currency, (selectedPrice?.amount || 0) * form.quantity)}
              &nbsp;/&nbsp;
              {selectedPrice?.interval.toLowerCase()}
            </b>
            &nbsp; for {form.quantity} user license{form.quantity > 1 ? 's' : ''}.
          </Confirm>
        )}
      </List>
    </>
  )
}

const useStyles = makeStyles({
  group: {
    border: `1px solid ${colors.grayLighter}`,
    borderRadius: spacing.md,
    backgroundColor: colors.white,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
    marginRight: spacing.md,
    display: 'inline-block',
    height: 30,
    overflow: 'hidden',
    '& > .MuiButton-root': { height: '100%', borderRadius: 0 },
    '& > .MuiButton-root + .MuiButton-root': { marginLeft: 0 },
    '& > .MuiButton-root:first-child': { borderTopLeftRadius: spacing.md, borderBottomLeftRadius: spacing.md },
    '& > .MuiButton-root:last-child': { borderTopRightRadius: spacing.md, borderBottomRightRadius: spacing.md },
  },
  quantity: {
    maxWidth: 60,
    '& .MuiInputBase-input': {
      fontSize: fontSizes.base,
      fontWeight: 500,
      textAlign: 'center',
      marginTop: 0,
    },
  },
})
