import React from 'react'
import { Notice } from './Notice'
import { Overlay } from './Overlay'
import { PlanCard } from './PlanCard'
import { makeStyles } from '@mui/styles'
import { PlanGutters } from './PlanGutters'
import { useLocation } from 'react-router-dom'
import { PlanCheckout } from './PlanCheckout'
import { LoadingMessage } from './LoadingMessage'
import { State, Dispatch } from '../store'
import { currencyFormatter } from '../helpers/utilHelper'
import { useSelector, useDispatch } from 'react-redux'
import { PERSONAL_PLAN_ID, planDetails, deviceUserTotal } from '../models/plans'
import { NoticeCustomPlan } from '../components/NoticeCustomPlan'
import { Confirm } from '../components/Confirm'

type Props = {
  accountId: string
  license: ILicense | null
  includeLicenseId?: boolean
  plan?: IPlan
  plans: IPlan[]
}

export const Plans: React.FC<Props> = ({ accountId, license, includeLicenseId, plan, plans }) => {
  const css = useStyles()
  const location = useLocation()
  const dispatch = useDispatch<Dispatch>()
  const initialized = useSelector((state: State) => state.organization.initialized)
  const purchasing = useSelector((state: State) => state.plans.purchasing)

  function getDefaults(): IPurchase {
    const price = plan?.prices?.find(p => p.id === license?.subscription?.price?.id) || plan?.prices?.[0]
    return {
      checkout: false,
      planId: plan?.id,
      priceId: price?.id,
      quantity: license?.quantity || 1,
      confirm: false,
      licenseId: includeLicenseId ? license?.id : undefined,
    }
  }
  const [form, setForm] = React.useState<IPurchase>(getDefaults())
  const personal = !license || license.plan.id === PERSONAL_PLAN_ID
  const totals = deviceUserTotal(license?.quantity || 1, plan)

  React.useEffect(() => {
    setForm(getDefaults())
  }, [license])

  React.useEffect(() => {
    if (location.pathname.includes('success')) dispatch.plans.restore()
  }, [])

  if (!initialized) return <LoadingMessage />

  return (
    <>
      {form.checkout && (
        <Overlay>
          <PlanCheckout
            plans={plans}
            form={form}
            license={license}
            onChange={form => setForm(form)}
            onCancel={() => setForm(getDefaults())}
          />
        </Overlay>
      )}
      {license?.custom && (
        <PlanGutters>
          <NoticeCustomPlan className={css.notice} fullWidth />
        </PlanGutters>
      )}
      <PlanGutters>
        {plans.map(plan => {
          const details = plan.id ? planDetails[plan.id] : {}
          const selected = license?.plan?.id === plan.id

          let note = details.note
          let caption = 'per month / per license'
          let planPrice: IPrice | undefined
          let planInterval: string
          let price: string = '-'

          if (plan.prices) {
            planInterval = 'YEAR'
            planPrice = plan.prices.find(p => p.interval === planInterval)
            price = currencyFormatter(planPrice?.currency, (planPrice?.amount || 1) / 12, 0)
            if (!planPrice) {
              planInterval = 'MONTH'
              planPrice = plan.prices.find(p => p.interval === planInterval)
              price = currencyFormatter(planPrice?.currency, planPrice?.amount || 1, 0)
              note = 'billed monthly'
            }
          }

          if (selected && license?.subscription?.total && license?.subscription?.price?.amount) {
            price =
              currencyFormatter(license.subscription.price.currency, license.subscription.total, 0) +
              ` / ${license.subscription.price.interval?.toLowerCase()}`
            caption = `${license.quantity} license${(license.quantity || 0) > 1 ? 's' : ''}`
            note = `${totals.users} users + ${totals.devices} devices`
          }

          const result = plan.prices?.find(p => p.id === form.priceId)
          const priceId = result?.id || (plan.prices && plan.prices[0].id)
          const downgradePrice = plan.prices?.find(p => p.interval === license?.subscription?.price?.interval)?.amount
          const isDowngrade = (downgradePrice || 0) < (license?.subscription?.price?.amount || 0)

          return (
            <PlanCard
              key={plan.id}
              name={plan.description}
              description={details.description}
              price={price}
              caption={caption}
              note={note}
              disabled={selected && license?.custom}
              button={selected ? 'Update' : 'Select'}
              selected={selected}
              loading={purchasing === plan.id}
              onSelect={() =>
                setForm({
                  ...form,
                  confirm: isDowngrade,
                  checkout: !isDowngrade,
                  planId: plan.id,
                  priceId,
                })
              }
              features={details.features}
            />
          )
        })}
      </PlanGutters>
      <PlanGutters>
        <PlanCard
          wide
          name="Personal"
          description={planDetails[PERSONAL_PLAN_ID].description}
          price="$0"
          caption="Free Plan"
          button={personal ? 'Current Plan' : 'Select'}
          selected={personal}
          disabled={personal}
          onSelect={() =>
            personal
              ? setForm({ ...form, confirm: false, checkout: true, planId: PERSONAL_PLAN_ID })
              : setForm({ ...form, confirm: true, checkout: false, planId: PERSONAL_PLAN_ID })
          }
          features={planDetails[PERSONAL_PLAN_ID].features}
        />
      </PlanGutters>
      <Confirm
        open={!!form.confirm}
        onConfirm={() => setForm({ ...form, confirm: false, checkout: true })}
        onDeny={() => setForm({ ...form, confirm: false })}
        title="Downgrade Plan?"
        action="Downgrade"
        color="warning"
        maxWidth="xs"
      >
        <Notice severity="warning" fullWidth>
          This plan will downgrade your service.
          <em>You will lose access to some features and may lose access to some devices.</em>
        </Notice>
      </Confirm>
    </>
  )
}

const useStyles = makeStyles({
  notice: {
    maxWidth: 840,
  },
})
