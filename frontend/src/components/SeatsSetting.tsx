import React, { useState, useEffect } from 'react'
import { PERSONAL_PLAN_ID, REMOTEIT_PRODUCT_ID } from '../models/plans'
import { List } from '@mui/material'
import { ApplicationState, Dispatch } from '../store'
import { useSelector, useDispatch } from 'react-redux'
import { currencyFormatter } from '../helpers/utilHelper'
import { getActiveAccountId } from '../selectors/accounts'
import { QuantitySelector } from './QuantitySelector'
import { InlineSetting } from './InlineSetting'
import { Confirm } from './Confirm'

export const SeatsSetting: React.FC<{ license: ILicense | null }> = ({ license }) => {
  const dispatch = useDispatch<Dispatch>()
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
        <QuantitySelector quantity={form.quantity} onChange={setQuantity} />
        {selectedPrice?.amount && (
          <>
            &nbsp; &nbsp; &nbsp;
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
