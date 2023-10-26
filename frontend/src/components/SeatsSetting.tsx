import React, { useState, useEffect } from 'react'
import { PERSONAL_PLAN_ID, REMOTEIT_PRODUCT_ID, devicesTotal } from '../models/plans'
import { List, ListItem, Stack } from '@mui/material'
import { ApplicationState, Dispatch } from '../store'
import { useSelector, useDispatch } from 'react-redux'
import { currencyFormatter } from '../helpers/utilHelper'
import { selectActiveAccountId } from '../selectors/accounts'
import { QuantitySelector } from './QuantitySelector'
import { NoticeCustomPlan } from './NoticeCustomPlan'
import { InlineSetting } from './InlineSetting'
import { selectLimits } from '../selectors/organizations'
import { Confirm } from './Confirm'
import { Icon } from './Icon'

export const SeatsSetting: React.FC<{ license: ILicense | null }> = ({ license }) => {
  const dispatch = useDispatch<Dispatch>()
  const { accountId, plans, purchasing, limits } = useSelector((state: ApplicationState) => ({
    accountId: selectActiveAccountId(state),
    plans: state.plans.plans.filter(p => p.product.id === REMOTEIT_PRODUCT_ID),
    purchasing: !!state.plans.purchasing,
    limits: selectLimits(state, state.user.id),
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
  const deviceLimit = limits.find(l => l.name === 'iot-devices' && l.license?.id === license?.id)?.value

  const setQuantity = (value: string | number) => {
    let quantity = Math.max(Math.min(+value, 9999), 0)
    if (isNaN(quantity)) quantity = 1
    setForm({ ...form, quantity })
  }

  if (license?.plan?.id === PERSONAL_PLAN_ID || enterprise) return null
  if (license?.custom)
    return (
      <List>
        <ListItem>
          <NoticeCustomPlan />
        </ListItem>
      </List>
    )

  return (
    <List>
      <InlineSetting
        hideIcon
        disabled={purchasing}
        loading={purchasing}
        label="Licenses"
        warning="This will change your billing."
        value={form.quantity}
        displayValue={
          <Stack flexDirection="row" alignItems="center" sx={{ '&>*': { marginLeft: 0.7, marginRight: 2 } }}>
            {form.quantity}
            <Icon name="user" size="xxs" type="solid" color="gray" />
            {deviceLimit}
            <Icon name="unknown" size="sm" platformIcon />
          </Stack>
        }
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
            {selectedPrice?.interval?.toLowerCase()} &nbsp;
            <Icon name="unknown" size="lg" platformIcon inline inlineLeft />
            {devicesTotal(form.quantity, selectedPlan?.id)} devices
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
            {selectedPrice?.interval?.toLowerCase()}
          </b>
          &nbsp; for {form.quantity} user license{form.quantity > 1 ? 's' : ''}.
        </Confirm>
      )}
    </List>
  )
}
