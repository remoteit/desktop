import React, { useState, useRef, useEffect } from 'react'
import { PERSONAL_PLAN_ID, REMOTEIT_PRODUCT_ID } from '../models/plans'
import { makeStyles } from '@mui/styles'
import { List, TextField, Button } from '@mui/material'
import { ApplicationState, Dispatch } from '../store'
import { spacing, fontSizes } from '../styling'
import { useSelector, useDispatch } from 'react-redux'
import { currencyFormatter } from '../helpers/utilHelper'
import { getActiveAccountId } from '../models/accounts'
import { InlineSetting } from './InlineSetting'
import { Confirm } from './Confirm'
import { Icon } from './Icon'

export const SeatsSetting: React.FC<{ license: ILicense | null }> = ({ license }) => {
  const css = useStyles()
  const dispatch = useDispatch<Dispatch>()
  const fieldRef = useRef<HTMLInputElement>(null)
  const { accountId, plans, purchasing } = useSelector((state: ApplicationState) => ({
    accountId: getActiveAccountId(state),
    plans: state.plans.plans.filter(p => p.product.id === REMOTEIT_PRODUCT_ID),
    purchasing: !!state.plans.purchasing,
  }))

  useEffect(() => {
    setForm(getDefaults())
  }, [license])

  const getDefaults = () => {
    const plan = plans.find(plan => plan.id === license?.plan?.id) || plans[0]
    const price = plan?.prices?.find(p => p.id === license?.subscription?.price?.id) || plan?.prices?.[0]
    return {
      accountId,
      priceId: price?.id,
      quantity: license?.quantity || 1,
    }
  }

  const [form, setForm] = useState<IPurchase>(getDefaults())
  const [confirm, setConfirm] = useState<boolean>(false)
  const selectedPlan = plans.find(plan => plan.id === license?.plan?.id)
  const selectedPrice = selectedPlan?.prices?.find(price => price.id === form.priceId)
  const enterprise = !!license && !license.plan.billing

  const setQuantity = (value: string | number) => {
    let quantity = Math.max(Math.min(+value, 9999), 0)
    if (isNaN(quantity)) quantity = 1
    setForm({ ...form, quantity })
  }

  if (license?.plan?.id === PERSONAL_PLAN_ID || enterprise) return null

  return (
    <List>
      <InlineSetting
        hideIcon
        disabled={purchasing}
        loading={purchasing}
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
        {selectedPrice?.amount && (
          <>
            {currencyFormatter(selectedPrice?.currency, (selectedPrice?.amount || 0) * form.quantity)}
            &nbsp;/&nbsp;
            {selectedPrice?.interval.toLowerCase()}
          </>
        )}
      </InlineSetting>
      {confirm && (
        <Confirm
          open={confirm}
          title="Confirm Billing Change"
          onConfirm={() => {
            dispatch.plans.updateSubscription(form)
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
  )
}

const useStyles = makeStyles(({ palette }) => ({
  group: {
    border: `1px solid ${palette.grayLighter.main}`,
    borderRadius: spacing.md,
    backgroundColor: palette.white.main,
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
      marginLeft: 0,
      paddingTop: spacing.xxs,
    },
  },
}))
