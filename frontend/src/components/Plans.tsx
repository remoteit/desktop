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
import { selectRemoteitLicense, selectLimits } from '../selectors/organizations'
import {
  REMOTEIT_PRODUCT_ID,
  PERSONAL_PLAN_ID,
  PROFESSIONAL_PLAN_ID,
  BUSINESS_PLAN_ID,
  FLEET_PLAN_ID,
  ENTERPRISE_PLAN_ID,
  deviceUserTotal,
} from '../models/plans'
import { ApplicationState, Dispatch } from '../store'
import { useSelector, useDispatch } from 'react-redux'
import { NoticeCustomPlan } from '../components/NoticeCustomPlan'
import { useMediaQuery } from '@mui/material'
import { windowOpen } from '../services/Browser'
import { Confirm } from '../components/Confirm'
import { Pre } from '../components/Pre'

const PlanDetails = {
  [PERSONAL_PLAN_ID]: {
    description: 'For non-commercial usage only',
    features: [
      '5 Devices',
      '7 days of activity logs',
      'Limited API usage',
      'Web/Desktop/Mobile apps',
      'SSO with Google',
    ],
  },
  [PROFESSIONAL_PLAN_ID]: {
    description: 'Basic commercial use plan',
    note: 'when billed annually',
    features: [
      '5 Devices + 3 users per license',
      'Commercial usage',
      'Organization Management (basic roles)',
      'Basic device tagging',
      'Virtual Networks',
      '30 days of activity logs',
      'Limited API usage',
      'Forum support',
    ],
  },
  [BUSINESS_PLAN_ID]: {
    description: 'Simplifies network management',
    note: 'when billed annually',
    features: [
      '5 Devices + 10 users per license',
      'Organization Management including custom roles',
      'Virtual networks with custom roles, enhanced device tagging',
      'SSO with SAML or select identity providers',
      'Scripting',
      '1 year of activity logs',
      'Unrestricted API usage',
      'Email support',
    ],
  },
  [FLEET_PLAN_ID]: {
    description: 'Device centric business plan',
    note: 'discounted monthly price',
    features: [
      '100 devices per license',
      '5 user accounts',
      'Add additional devices in 100 device increments',
      'Discounted monthly pricing matches annual pricing',
      'Includes all Business Plan features',
    ],
  },
  [ENTERPRISE_PLAN_ID]: {
    description: 'Custom plan for large scale deployment',
    features: [
      'Volume based discounts for users and devices',
      'Statement of Work based projects: development, support, deployment & onboarding',
      'Custom activity log retention',
      'Additional support options: Slack, phone',
      'Provision of customer specific environments: custom portals, dedicated proxy, named device URLs, and more',
      'Fixed permanent named endpoint URLs',
      'Support for embedded devices and custom device packages',
      'Large-scale solutions for unique and custom use-cases',
    ],
  },
}

export const Plans: React.FC = () => {
  const small = useMediaQuery(`(max-width:600px)`)
  const css = useStyles({ small })
  const location = useLocation()
  const dispatch = useDispatch<Dispatch>()
  const { initialized, accountId, plans, license, purchasing } = useSelector((state: ApplicationState) => ({
    initialized: state.organization.initialized,
    accountId: state.user.id,
    plans: state.plans.plans.filter(p => p.product.id === REMOTEIT_PRODUCT_ID),
    purchasing: state.plans.purchasing,
    license: selectRemoteitLicense(state, state.user.id),
  }))
  const plan = plans.find(plan => plan.id === license?.plan?.id) || plans[0]
  function getDefaults(): IPurchase {
    const price = plan.prices?.find(p => p.id === license?.subscription?.price?.id) || plan.prices?.[0]
    return {
      accountId,
      checkout: false,
      planId: plan.id,
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
        <Gutters size="lg" className={css.plans}>
          {plans.map(plan => {
            const planPrice = plan.prices && plan.prices.find(p => p.interval === 'YEAR')
            const details = plan.id ? PlanDetails[plan.id] : {}
            const selected = license?.plan?.id === plan.id
            let price = currencyFormatter(planPrice?.currency, (planPrice?.amount || 1) / 12, 0)
            let caption = 'per month / per license'
            let note = details.note
            if (selected && license?.subscription?.total && license?.subscription?.price?.amount) {
              price =
                currencyFormatter(license?.subscription?.price.currency, license?.subscription?.total, 0) +
                ` / ${license?.subscription?.price.interval?.toLowerCase()}`
              caption = `${license.quantity} license${(license.quantity || 0) > 1 ? 's' : ''}`
              note = `${totals?.users} users + ${totals?.devices} devices`
            }
            const result = plan.prices?.find(p => p.id === form.priceId)
            const priceId = result?.id || (plan.prices && plan.prices[0].id)
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
                    confirm: !selected,
                    checkout: selected,
                    planId: plan.id,
                    priceId,
                  })
                }
                features={details.features}
              />
            )
          })}
        </Gutters>
      )}
      <Gutters size="md" className={css.plans}>
        <PlanCard
          wide
          name="Personal"
          description={PlanDetails[PERSONAL_PLAN_ID].description}
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
          features={PlanDetails[PERSONAL_PLAN_ID].features}
        />
      </Gutters>
      <Gutters size="md" className={css.plans}>
        <PlanCard
          wide
          name="Enterprise"
          description={PlanDetails[ENTERPRISE_PLAN_ID].description}
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
          features={enterprise ? undefined : PlanDetails[ENTERPRISE_PLAN_ID].features}
        />
      </Gutters>
      <Confirm
        open={!!form.confirm}
        onConfirm={() => setForm({ ...form, confirm: false, checkout: true })}
        onDeny={() => setForm({ ...form, confirm: false })}
        title="Change Plans?"
        action="Change Plan"
        color="warning"
        maxWidth="xs"
      >
        <Notice severity="warning" fullWidth>
          Plan changes will take effect immediately.
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
  }),
  notice: {
    maxWidth: 840,
  },
})
