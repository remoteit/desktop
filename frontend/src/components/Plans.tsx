import React from 'react'
import { Overlay } from './Overlay'
import { Gutters } from './Gutters'
import { PlanCard } from './PlanCard'
import { makeStyles } from '@material-ui/core'
import { useLocation } from 'react-router-dom'
import { PlanCheckout } from './PlanCheckout'
import { getRemoteitLicense } from '../models/licensing'
import { currencyFormatter } from '../helpers/utilHelper'
import { REMOTEIT_PRODUCT_ID, PERSONAL_PLAN_ID, PROFESSIONAL_PLAN_ID, BUSINESS_PLAN_ID } from '../models/licensing'
import { ApplicationState, Dispatch } from '../store'
import { useSelector, useDispatch } from 'react-redux'
import { windowOpen } from '../services/Browser'

const Features = {
  [PERSONAL_PLAN_ID]: [
    'Up to 5 devices*',
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
    'Devices* are not limited',
    'Commercial usage',
    '30 days of activity logs',
    'Basic device tagging',
    'Email or Zoom support',
  ],
  [BUSINESS_PLAN_ID]: [
    'Devices* are not limited',
    'Commercial resale usage',
    '1 year of activity logs',
    'Custom user roles',
    'Device tagging user access',
    'SAML single sign on (SSO)',
    'Enhanced support',
    'Unrestricted API usage',
  ],
  enterprise: [
    'Volume devices* or user accounts',
    '1 year of activity logs',
    'Slack support',
    'Analytics and reporting',
    'Dedicated proxy available',
  ],
}

export const Plans: React.FC = () => {
  const css = useStyles()
  const location = useLocation()
  const dispatch = useDispatch<Dispatch>()
  const { plans, license, purchasing } = useSelector((state: ApplicationState) => ({
    plans: state.licensing.plans.filter(p => p.product.id === REMOTEIT_PRODUCT_ID),
    purchasing: state.licensing.purchasing,
    license: getRemoteitLicense(state),
  }))
  const getDefaults = () => {
    const plan = plans.find(plan => plan.id === license?.plan?.id) || plans[0]
    const price = plan.prices?.find(p => p.id === license?.subscription?.price?.id) || plan.prices?.[0]
    return {
      checkout: false,
      planId: plan.id,
      priceId: price?.id,
      quantity: license?.quantity || 1,
    }
  }
  const [form, setForm] = React.useState<IPurchase>(getDefaults())
  const enterprise = !license?.plan?.billing
  const personal = license?.plan?.id === PERSONAL_PLAN_ID

  React.useEffect(() => {
    setForm(getDefaults())
  }, [license])

  React.useEffect(() => {
    if (location.pathname.includes('success')) dispatch.licensing.restore()
  }, [])
  console.log('plans', plans)
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
              onSelect={() => setForm({ ...form, checkout: true, planId: PERSONAL_PLAN_ID })}
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
                    setForm({
                      ...form,
                      checkout: true,
                      planId: plan.id,
                      priceId,
                    })
                  }
                  features={plan.id && Features[plan.id]}
                />
              )
            })}
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
