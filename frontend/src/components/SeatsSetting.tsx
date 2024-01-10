import React, { useState, useEffect } from 'react'
import browser from '../services/Browser'
import { PERSONAL_PLAN_ID, deviceUserTotal } from '../models/plans'
import { List, ListItem, Stack } from '@mui/material'
import { ApplicationState, Dispatch } from '../store'
import { useSelector, useDispatch } from 'react-redux'
import { currencyFormatter } from '../helpers/utilHelper'
import { selectRemoteitLicense, selectPlan } from '../selectors/organizations'
import { selectActiveAccountId } from '../selectors/accounts'
import { QuantitySelector } from './QuantitySelector'
import { NoticeCustomPlan } from './NoticeCustomPlan'
import { InlineSetting } from './InlineSetting'
import { Confirm } from './Confirm'
import { Icon } from './Icon'

export const SeatsSetting: React.FC<{ context?: 'user' | 'device' }> = ({ context }) => {
  const dispatch = useDispatch<Dispatch>()
  const { accountId, license, plan, purchasing } = useSelector((state: ApplicationState) => ({
    accountId: selectActiveAccountId(state),
    license: selectRemoteitLicense(state) || null,
    plan: selectPlan(state),
    purchasing: !!state.plans.purchasing,
  }))

  useEffect(() => {
    setForm(getDefaults())
  }, [license])

  const getDefaults = () => {
    const price = plan?.prices?.find(p => p.id === license?.subscription?.price?.id) || plan?.prices?.[0]
    return {
      accountId,
      priceId: price?.id,
      quantity: license?.quantity || 1,
    }
  }

  const [form, setForm] = useState<IPurchase>(getDefaults())
  const [confirm, setConfirm] = useState<boolean>(false)
  const enterprise = !!license && !license.plan.billing
  const price = plan?.prices?.find(price => price.id === form.priceId)
  const hide = context === 'user' && !plan?.limits?.find(l => l.name === 'org-users')?.scale
  const totals = deviceUserTotal(form.quantity, plan)

  const setQuantity = (value: string | number) => {
    let quantity = Math.max(Math.min(+value, 9999), 0)
    if (isNaN(quantity)) quantity = 1
    setForm({ ...form, quantity })
  }

  if (license?.plan?.id === PERSONAL_PLAN_ID || enterprise || !browser.hasBilling || hide) return null

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
        label="Licensing"
        warning="This will change your billing."
        value={form.quantity}
        displayValue={
          <Stack flexDirection="row" alignItems="center" sx={{ '&>*': { marginLeft: 0.7, marginRight: 2 } }}>
            {totals.users}
            <Icon name="user" size="xxs" type="solid" color="gray" />
            {totals.devices}
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
        {price?.amount && (
          <>
            &nbsp; &nbsp; &nbsp;
            {currencyFormatter(price?.currency, (price?.amount || 0) * form.quantity)}
            &nbsp;/&nbsp;
            {price?.interval?.toLowerCase()} &nbsp; &nbsp;
            <Icon name="user" size="sm" type="solid" color="gray" fixedWidth inlineLeft inline />
            {totals.users} users
            <Icon name="unknown" size="lg" platformIcon inline inlineLeft />
            {totals.devices} devices
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
            {currencyFormatter(price?.currency, (price?.amount || 0) * form.quantity)}
            &nbsp;/&nbsp;
            {price?.interval?.toLowerCase()}
          </b>
          &nbsp; for {form.quantity} user license{form.quantity > 1 ? 's' : ''}.
        </Confirm>
      )}
    </List>
  )
}
