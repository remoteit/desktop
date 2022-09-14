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
import { selectOwnRemoteitLicense } from '../models/plans'
import { REMOTEIT_PRODUCT_ID, PERSONAL_PLAN_ID, PROFESSIONAL_PLAN_ID, BUSINESS_PLAN_ID } from '../models/plans'
import { ApplicationState, Dispatch } from '../store'
import { useSelector, useDispatch } from 'react-redux'
import { windowOpen } from '../services/Browser'
import { Confirm } from '../components/Confirm'

const Features = {
  [PERSONAL_PLAN_ID]: [
    'Endpoints: 5',
    'Prototyping / POC',
    '7 days of activity logs',
    'Web support',
    'Scripts',
    'Limited API usage',
    'Mobile app',
    'Non-commercial use',
    'SSO with Google',
  ],
  [PROFESSIONAL_PLAN_ID]: [
    'Endpoints: no limit',
    'Commercial usage',
    '30 days of activity logs',
    'Basic end-point tagging',
    'Email support',
  ],
  [BUSINESS_PLAN_ID]: [
    'Endpoints: no limit',
    'Commercial usage',
    'Organizations',
    '1 year of activity logs',
    'Custom user roles',
    'User access control',
    'SAML single sign on (SSO)',
    'Enhanced support',
    'Unrestricted API usage',
  ],
  enterprise: [
    'Volume endpoints or user accounts',
    'Custom activity logs',
    'Slack support',
    'Analytics and reporting',
    'Dedicated infrastructure available',
  ],
}

export const Plans: React.FC = () => {
  const css = useStyles()
  const location = useLocation()
  const dispatch = useDispatch<Dispatch>()
  const { initialized, accountId, plans, license, purchasing } = useSelector((state: ApplicationState) => ({
    initialized: state.organization.initialized,
    accountId: state.user.id,
    plans: state.plans.plans.filter(p => p.product.id === REMOTEIT_PRODUCT_ID),
    purchasing: state.plans.purchasing,
    license: selectOwnRemoteitLicense(state),
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
  const enterprise = !!license && !license.plan.billing
  const userPlan = plans.find(plan => plan.id === license?.plan?.id) || plans[0]
  const personal = !license || license.plan.id === PERSONAL_PLAN_ID

  React.useEffect(() => {
    setForm(getDefaults())
  }, [license])

  React.useEffect(() => {
    if (location.pathname.includes('success')) dispatch.plans.restore()
  }, [])

  if (!initialized) return <LoadingMessage />

  return (
    <>
      <Gutters size="lg" top="xl" className={css.plans}>
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
          <>
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
              let caption = 'per month / per user'
              let note: string | undefined = 'when billed annually'
              const selected = license?.plan?.id === plan.id
              if (selected && license?.subscription?.total && license?.subscription?.price?.amount) {
                price =
                  currencyFormatter(license?.subscription?.price.currency, license?.subscription?.total, 0) +
                  ` / ${license?.subscription?.price.interval.toLowerCase()}`
                caption = `${license.quantity} seat${(license.quantity || 0) > 1 ? 's' : ''}`
                note = undefined
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
          </>
        )}
      </Gutters>
      <Gutters size="md" top={null} bottom="xxl" className={css.plans}>
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
                Large-scale solutions
                <br /> or custom use cases
              </>
            )
          }
          button="Contact Us"
          selected={enterprise}
          onSelect={() => {
            if (enterprise) window.location.href = encodeURI(`mailto:sales@remote.it?subject=Enterprise Plan`)
            else windowOpen('https://remote.it/contact-us/', '_blank')
          }}
          features={enterprise ? undefined : Features.enterprise}
        />
      </Gutters>
    </>
  )
}

const useStyles = makeStyles({
  plans: {
    display: 'flex',
    justifyContent: 'center',
  },
})
