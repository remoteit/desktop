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
  SATELLITE_PLAN_ID,
  ENTERPRISE_PLAN_ID,
} from '../models/plans'
import { ApplicationState, Dispatch } from '../store'
import { useSelector, useDispatch } from 'react-redux'
import { NoticeCustomPlan } from '../components/NoticeCustomPlan'
import { useMediaQuery } from '@mui/material'
import { windowOpen } from '../services/Browser'
import { Confirm } from '../components/Confirm'
import { Icon } from '../components/Icon'

const Features = {
  [PERSONAL_PLAN_ID]: [
    '5 Devices',
    '7 days of activity logs',
    'Limited API usage',
    'Web/Desktop/Mobile apps',
    'SSO with Google',
  ],
  [PROFESSIONAL_PLAN_ID]: [
    '5 Devices + 3 per user',
    'Commercial usage',
    'Organization Management (basic roles)',
    'Basic device tagging',
    'Virtual Networks',
    '30 days of activity logs',
    'Limited API usage',
    'Forum support',
  ],
  [BUSINESS_PLAN_ID]: [
    '5 Devices + 10 per user',
    'Organization Management including custom roles',
    'Virtual networks with custom roles, enhanced device tagging',
    'SSO with SAML or select identity providers',
    'Scripting',
    '1 year of activity logs',
    'Unrestricted API usage',
    'Email support',
  ],
  [ENTERPRISE_PLAN_ID]: [
    'Volume based discounts for users and devices',
    'Statement of Work based projects: development, support, deployment & onboarding',
    'Custom activity log retention',
    'Additional support options: Slack, phone',
    'Provision of customer specific environments: custom portals, dedicated proxy, named device URLs, and more',
    'Fixed permanent named endpoint URLs',
    'Support for embedded devices and custom device packages',
    'Large-scale solutions for unique and custom use-cases',
  ],
  [SATELLITE_PLAN_ID]: [
    'User and device licenses',
    'Dedicated Proxy Server',
    'Custom activity log retention',
    'Fixed permanent named endpoint URLs',
    'Live setup and onboarding with technical account manager (TAM)',
    'Enterprise support options: Slack, phone',
    'Custom bundled feature pack for customers in CGNAT environments without a global IP address such a mobile 5G, Starlink, other Satellite networks, and more.',
  ],
}

export const Plans: React.FC = () => {
  const small = useMediaQuery(`(max-width:600px)`)
  const css = useStyles({ small })
  const location = useLocation()
  const dispatch = useDispatch<Dispatch>()
  const { initialized, accountId, plans, license, limits, purchasing } = useSelector((state: ApplicationState) => ({
    initialized: state.organization.initialized,
    accountId: state.user.id,
    plans: state.plans.plans.filter(p => p.product.id === REMOTEIT_PRODUCT_ID),
    purchasing: state.plans.purchasing,
    license: selectRemoteitLicense(state, state.user.id),
    limits: selectLimits(state, state.user.id),
  }))
  function getDefaults(): IPurchase {
    const plan = plans.find(plan => plan.id === license?.plan?.id) || plans[0]
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
  const satellite = !!license && license.plan.id === SATELLITE_PLAN_ID
  const userPlan = plans.find(plan => plan.id === license?.plan?.id) || plans[0]
  const personal = !license || license.plan.id === PERSONAL_PLAN_ID
  const deviceLimit = limits.find(l => l.name === 'iot-devices' && l.license?.id === license?.id)?.value

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
      {!enterprise && (
        <Gutters size="md" className={css.plans}>
          <PlanCard
            wide
            promoted
            name={
              <>
                <Icon name="satellite-dish" size="lg" type="solid" inlineLeft />
                Starlink Access
              </>
            }
            description="Bundle for Satellite, 5G, and other CGNAT environments"
            price={satellite ? undefined : '$500+'}
            caption={
              satellite ? (
                <>
                  For changes, see your <br />
                  administrator or
                </>
              ) : (
                'starting price per month'
              )
            }
            note={satellite ? undefined : 'when billed annually'}
            button="Contact Us"
            selected={satellite}
            onSelect={() => windowOpen('https://link.remote.it/contact', '_blank')}
            features={Features[SATELLITE_PLAN_ID]}
          />
        </Gutters>
      )}
      {license?.custom && (
        <Gutters size="lg" className={css.plans}>
          <NoticeCustomPlan className={css.notice} fullWidth />
        </Gutters>
      )}
      {!enterprise && !satellite && (
        <Gutters size="lg" className={css.plans}>
          <PlanCard
            name="Personal"
            description="For non-commercial use"
            price="$0"
            caption="Free"
            button={personal ? 'Current Plan' : 'Select'}
            selected={personal}
            disabled={personal}
            onSelect={() =>
              userPlan.name.toUpperCase() === 'BUSINESS' && !personal
                ? setForm({ ...form, confirm: true, checkout: false, planId: PERSONAL_PLAN_ID })
                : setForm({ ...form, confirm: false, checkout: true, planId: PERSONAL_PLAN_ID })
            }
            features={Features[PERSONAL_PLAN_ID]}
          />
          {plans.map(plan => {
            const planPrice = plan.prices && plan.prices.find(p => p.interval === 'YEAR')
            let price = currencyFormatter(planPrice?.currency, (planPrice?.amount || 1) / 12, 0)
            let caption = 'per user / per month'
            let note: string | undefined = 'when billed annually'
            const selected = license?.plan?.id === plan.id
            if (selected && license?.subscription?.total && license?.subscription?.price?.amount) {
              price =
                currencyFormatter(license?.subscription?.price.currency, license?.subscription?.total, 0) +
                ` / ${license?.subscription?.price.interval.toLowerCase()}`
              caption = `${license.quantity} seat${(license.quantity || 0) > 1 ? 's' : ''}`
              note = `${deviceLimit} devices`
            }
            const result = plan.prices?.find(p => p.id === form.priceId)
            const priceId = result?.id || (plan.prices && plan.prices[0].id)
            return (
              <PlanCard
                key={plan.id}
                name={plan.description}
                description="For business use"
                price={price}
                caption={caption}
                note={note}
                disabled={selected && license?.custom}
                button={selected ? 'Update' : 'Select'}
                selected={selected}
                loading={purchasing === plan.id}
                onSelect={() =>
                  userPlan.name.toUpperCase() === 'BUSINESS' && !selected
                    ? setForm({
                        ...form,
                        confirm: true,
                        checkout: false,
                        planId: plan.id,
                        priceId,
                      })
                    : setForm({
                        ...form,
                        confirm: false,
                        checkout: true,
                        planId: plan.id,
                        priceId,
                      })
                }
                features={plan.id && Features[plan.id]}
              />
            )
          })}
          <Confirm
            open={!!form.confirm}
            onConfirm={() => setForm({ ...form, confirm: false, checkout: true })}
            onDeny={() => setForm({ ...form, confirm: false })}
            title="Confirm Plan Change"
            action="Downgrade"
            maxWidth="sm"
          >
            <Notice severity="warning" fullWidth gutterBottom>
              Features only available in business will automatically change when downgrading.
            </Notice>
            <i> Do you want to proceed?</i>
            <ul>
              <li>Activity Log storage will be reduced</li>
              <li>Users with custom roles will be reverted to system roles</li>
              <li>SAML will be disabled</li>
            </ul>
          </Confirm>
        </Gutters>
      )}
      {!satellite && (
        <Gutters size="md" className={css.plans}>
          <PlanCard
            wide
            name="Enterprise"
            description="For large volume and OEM"
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
            features={enterprise ? undefined : Features[ENTERPRISE_PLAN_ID]}
          />
        </Gutters>
      )}
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
