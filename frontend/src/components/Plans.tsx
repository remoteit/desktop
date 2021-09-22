import React from 'react'
import { Overlay } from './Overlay'
import { Gutters } from './Gutters'
import { PlanCard } from './PlanCard'
import { makeStyles } from '@material-ui/core'
import { useLocation } from 'react-router-dom'
import { PlanCheckout } from './PlanCheckout'
import { getRemoteitLicense } from '../models/licensing'
import { currencyFormatter } from '../helpers/utilHelper'
import { REMOTEIT_PRODUCT_ID, PERSONAL_PLAN_ID } from '../models/licensing'
import { ApplicationState, Dispatch } from '../store'
import { useSelector, useDispatch } from 'react-redux'

export const Plans: React.FC = () => {
  const css = useStyles()
  const location = useLocation()
  const dispatch = useDispatch<Dispatch>()
  const { plans, license, purchasing } = useSelector((state: ApplicationState) => ({
    plans: state.licensing.plans.filter(p => p.product.id === REMOTEIT_PRODUCT_ID),
    purchasing: !!state.licensing.purchasing,
    license: getRemoteitLicense(state),
  }))
  const getDefaults = () => ({
    checkout: false,
    planId: license?.plan?.id,
    priceId: license?.subscription?.price?.id,
    quantity: license?.quantity || 1,
  })
  const [form, setForm] = React.useState<IPurchase>(getDefaults())
  const enterprise = !license?.plan?.billing
  const personal = license?.plan?.id === PERSONAL_PLAN_ID

  React.useEffect(() => {
    setForm(getDefaults())
  }, [license])

  React.useEffect(() => {
    if (location.pathname.includes('success')) dispatch.licensing.restore()
  }, [])

  return (
    <Gutters size="md" top="xxl" className={css.plans}>
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
            feature="Up to 5 devices*"
            features={[
              'Prototyping / POC',
              '7 days of activity logs',
              'Web support',
              'Scripts',
              'APIs',
              'Mobile app',
              'Non-commercial',
              'SSO with Google',
            ]}
          />
          {plans.map(plan => {
            let price = '$5'
            let caption = 'per month / per user'
            let note: string | undefined = 'when billed annually'
            const selected = license?.plan?.id === plan.id
            if (selected && license?.subscription?.total && license?.subscription?.price?.amount) {
              price =
                currencyFormatter(license?.subscription?.price.currency, license?.subscription?.total, 0) +
                ` / ${license?.subscription?.price.interval.toLowerCase()}`
              caption = `${license.quantity} user${(license.quantity || 0) > 1 ? 's' : ''}`
              note = undefined
            }
            return (
              <PlanCard
                key={plan.id}
                name={plan.description}
                description="For business use"
                price={price}
                caption={caption}
                note={note}
                button={selected ? 'Update' : 'Upgrade'}
                selected={selected}
                loading={purchasing}
                onSelect={() =>
                  setForm({
                    ...form,
                    checkout: true,
                    planId: plan.id,
                    priceId: form.priceId || (plan.prices && plan.prices[0].id),
                  })
                }
                feature="Devices* are not limited"
                features={[
                  '30 days of activity logs',
                  'User groups (coming soon)',
                  'Commercial use',
                  'Email or Zoom support',
                ]}
              />
            )
          })}
        </>
      )}
      <PlanCard
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
          else window.open('https://remote.it/contact-us/', '_blank')
        }}
        feature={enterprise ? undefined : 'Volume devices* or user accounts'}
        features={enterprise ? undefined : ['1 year of activity logs', 'Slack support', 'Analytics and reporting']}
      />
    </Gutters>
  )
}

const useStyles = makeStyles({
  plans: {
    display: 'flex',
    position: 'relative',
    justifyContent: 'center',
  },
})
