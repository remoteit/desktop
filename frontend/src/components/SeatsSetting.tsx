import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import browser from '../services/browser'
import { PERSONAL_PLAN_ID, ENTERPRISE_PLAN_ID, deviceUserTotal } from '../models/plans'
import { List, Stack } from '@mui/material'
import { State, Dispatch } from '../store'
import { useSelector, useDispatch } from 'react-redux'
import { currencyFormatter } from '../helpers/utilHelper'
import { selectRemoteitLicense, selectPlan, selectLimit } from '../selectors/organizations'
import { selectActiveAccountId } from '../selectors/accounts'
import { QuantitySelector } from './QuantitySelector'
import { NoticeCustomPlan } from './NoticeCustomPlan'
import { InlineSetting } from './InlineSetting'
import { Confirm } from './Confirm'
import { Gutters } from './Gutters'
import { Icon } from './Icon'

export const SeatsSetting: React.FC<{ context?: 'user' | 'device' }> = ({ context }) => {
  const { t } = useTranslation()
  const dispatch = useDispatch<Dispatch>()
  const accountId = useSelector(selectActiveAccountId)
  const userLimit = useSelector((state: State) => selectLimit(state, undefined, 'org-users'))
  const deviceLimit = useSelector((state: State) => selectLimit(state, undefined, 'iot-devices'))
  const license = useSelector(selectRemoteitLicense) || null
  const plan = useSelector(selectPlan)
  const purchasing = useSelector((state: State) => !!state.plans.purchasing)

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
  const enterprise = license?.plan.id === ENTERPRISE_PLAN_ID
  const price = plan?.prices?.find(price => price.id === form.priceId)
  const displayOnly = context === 'user' && !plan?.limits?.find(l => l.name === 'org-users')?.scale
  const totals = deviceUserTotal(form.quantity, plan)

  const setQuantity = (value: string | number) => {
    let quantity = Math.max(Math.min(+value, 9999), 0)
    if (isNaN(quantity)) quantity = 1
    setForm({ ...form, quantity })
  }

  if (license?.plan?.id === PERSONAL_PLAN_ID || enterprise || !browser.hasBilling) return null

  const display = (
    <Stack flexDirection="row" alignItems="center" gap={2}>
      <Stack flexDirection="row" alignItems="center" gap={0.7}>
        <Icon name="user" size="sm" type="solid" color="gray" />
        {userLimit?.value == null
          ? t('seatsSetting.usersCount', {
              count: userLimit?.actual ?? 0,
              defaultValue_one: '{{count}} user',
              defaultValue_other: '{{count}} users',
            })
          : t('seatsSetting.usersUsed', {
              count: userLimit.value,
              actual: userLimit.actual ?? 0,
              defaultValue_one: '{{actual}} of {{count}} user',
              defaultValue_other: '{{actual}} of {{count}} users',
            })}
      </Stack>
      <Stack flexDirection="row" alignItems="center" gap={0.7}>
        <Icon name="unknown" size="md" platformIcon />
        {deviceLimit?.value == null
          ? t('seatsSetting.devicesCount', {
              count: deviceLimit?.actual ?? 0,
              defaultValue_one: '{{count}} device',
              defaultValue_other: '{{count}} devices',
            })
          : t('seatsSetting.devicesUsed', {
              count: deviceLimit.value,
              actual: deviceLimit.actual ?? 0,
              defaultValue_one: '{{actual}} of {{count}} device',
              defaultValue_other: '{{actual}} of {{count}} devices',
            })}
      </Stack>
    </Stack>
  )

  const bare = <Gutters>{display}</Gutters>

  if (license?.custom)
    return (
      <>
        {bare}
        <Gutters size="sm">
          <NoticeCustomPlan />
        </Gutters>
      </>
    )

  if (displayOnly) return bare

  return (
    <List>
      <InlineSetting
        hideIcon
        disabled={purchasing}
        loading={purchasing}
        label={t('seatsSetting.label', 'Licensing')}
        warning={t('seatsSetting.warning', 'This will change your billing.')}
        value={form.quantity}
        displayValue={display}
        resetValue={getDefaults().quantity}
        onResetClick={() => setForm(getDefaults())}
        onSubmit={async () => {
          if (form.quantity === getDefaults().quantity) return
          setConfirm(true)
        }}
        onCancel={() => setForm(getDefaults())}
        onShowEdit={() => setForm(getDefaults())}
      >
        <Stack flexDirection="row" flexWrap="wrap" alignItems="center">
          <QuantitySelector quantity={form.quantity} onChange={setQuantity} />
          &nbsp; &nbsp; &nbsp;
          {price?.amount && (
            <Stack flexDirection="row" alignItems="center" minWidth={300} marginY={1}>
              {currencyFormatter(price?.currency, (price?.amount || 0) * form.quantity)}
              &nbsp;/&nbsp;
              {price?.interval?.toLowerCase()} &nbsp; &nbsp;
              <Icon name="user" size="sm" type="solid" color="gray" fixedWidth inlineLeft inline />
              {t('seatsSetting.usersCount', {
                count: totals.users,
                defaultValue_one: '{{count}} user',
                defaultValue_other: '{{count}} users',
              })}
              <Icon name="unknown" size="lg" platformIcon inline inlineLeft />
              {t('seatsSetting.devicesCount', {
                count: totals.devices,
                defaultValue_one: '{{count}} device',
                defaultValue_other: '{{count}} devices',
              })}
            </Stack>
          )}
        </Stack>
      </InlineSetting>
      {confirm && (
        <Confirm
          open={confirm}
          title={t('seatsSetting.confirmTitle', 'Confirm Billing Change')}
          onConfirm={() => {
            dispatch.plans.updateSubscription(form)
            setConfirm(false)
          }}
          onDeny={() => {
            setForm(getDefaults())
            setConfirm(false)
          }}
        >
          {t('seatsSetting.confirmBefore', 'Please confirm that you want to change your billing to')} &nbsp;
          <b>
            {currencyFormatter(price?.currency, (price?.amount || 0) * form.quantity)}
            &nbsp;/&nbsp;
            {price?.interval?.toLowerCase()}
          </b>
          &nbsp;{' '}
          {t('seatsSetting.confirmAfter', {
            count: form.quantity,
            defaultValue_one: 'for {{count}} user license.',
            defaultValue_other: 'for {{count}} user licenses.',
          })}
        </Confirm>
      )}
    </List>
  )
}
