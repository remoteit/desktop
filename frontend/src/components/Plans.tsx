import React from 'react'
import { Notice } from './Notice'
import { Overlay } from './Overlay'
import { Gutters } from './Gutters'
import { PlanCard } from './PlanCard'
import { makeStyles } from '@mui/styles'
import { useLocation } from 'react-router-dom'
import { PlanCheckout } from './PlanCheckout'
import { LoadingMessage } from './LoadingMessage'
import { currencyFormatter } from '../helpers/utilHelper'
import { PERSONAL_PLAN_ID, ENTERPRISE_PLAN_ID, planDetails, deviceUserTotal } from '../models/plans'
import { State, Dispatch } from '../store'
import { useSelector, useDispatch } from 'react-redux'
import { NoticeCustomPlan } from '../components/NoticeCustomPlan'
import { useMediaQuery } from '@mui/material'
import { windowOpen } from '../services/Browser'
import { Confirm } from '../components/Confirm'
import { Pre } from '../components/Pre'

type Props = {
  accountId: string
  license: ILicense | null
  plan?: IPlan
  plans: IPlan[]
  showEnterprise?: boolean
}

export const Plans: React.FC<Props> = ({ accountId, license, plan, plans, showEnterprise }) => {
  const small = useMediaQuery(`(max-width:600px)`)
  const css = useStyles({ small })
  const location = useLocation()
  const dispatch = useDispatch<Dispatch>()
  const initialized = useSelector((state: State) => state.organization.initialized)
  const purchasing = useSelector((state: State) => state.plans.purchasing)

  function getDefaults(): IPurchase {
    const price = plan?.prices?.find(p => p.id === license?.subscription?.price?.id) || plan?.prices?.[0]
    return {
      accountId,
      checkout: false,
      planId: plan?.id,
      priceId: price?.id,
      quantity: license?.quantity || 1,
      confirm: false,
    }
  }
  const [form, setForm] = React.useState<IPurchase>(getDefaults())
  const enterprise = !!license && license.plan.id === ENTERPRISE_PLAN_ID
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
        <Gutters size="lg" className={css.plans}>
          <NoticeCustomPlan className={css.notice} fullWidth />
        </Gutters>
      )}
      {!enterprise && (
        <>
          <Gutters size="lg" className={css.plans}>
            {plans.map(plan => {
              const planPrice = plan.prices && plan.prices.find(p => p.interval === 'YEAR')
              const details = plan.id ? planDetails[plan.id] : {}
              const selected = license?.plan?.id === plan.id
              let price = currencyFormatter(planPrice?.currency, (planPrice?.amount || 1) / 12, 0)
              let caption = 'per month / per license'
              let note = details.note
              if (selected && license?.subscription?.total && license?.subscription?.price?.amount) {
                price =
                  currencyFormatter(license?.subscription?.price.currency, license?.subscription?.total, 0) +
                  ` / ${license?.subscription?.price.interval?.toLowerCase()}`
                caption = `${license.quantity} license${(license.quantity || 0) > 1 ? 's' : ''}`
                note = `${totals.users} users + ${totals.devices} devices`
              }
              const result = plan.prices?.find(p => p.id === form.priceId)
              const priceId = result?.id || (plan.prices && plan.prices[0].id)
              const isDowngrade = plan.prices && plan.prices[0].amount < (license?.subscription?.price?.amount || 0)
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
          </Gutters>
          <Gutters size="lg" className={css.plans}>
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
          </Gutters>
        </>
      )}
      {showEnterprise && (
        <Gutters size="lg" className={css.plans}>
          <PlanCard
            wide
            name="Enterprise"
            description={planDetails[ENTERPRISE_PLAN_ID].description}
            caption={
              enterprise ? (
                <>
                  For changes, see
                  <br /> your administrator or
                </>
              ) : (
                <>
                  Large-scale solutions for
                  <br />
                  unique and custom use-cases
                </>
              )
            }
            button="Contact Us"
            selected={enterprise}
            onSelect={() => {
              if (enterprise) window.location.href = encodeURI(`mailto:sales@remote.it?subject=Enterprise Plan`)
              else windowOpen('https://link.remote.it/contact', '_blank')
            }}
            features={enterprise ? undefined : planDetails[ENTERPRISE_PLAN_ID].features}
          />
        </Gutters>
      )}
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
  plans: ({ small }: { small: boolean }) => ({
    display: 'flex',
    justifyContent: 'center',
    flexWrap: small ? 'wrap' : 'nowrap',
    marginBottom: 0,
    marginTop: 0,
    maxWidth: 840,
  }),
  notice: {
    maxWidth: 840,
  },
})
