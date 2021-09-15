import React from 'react'
import { Overlay } from './Overlay'
import { Gutters } from './Gutters'
import { PlanCard } from './PlanCard'
import { makeStyles } from '@material-ui/core'
import { PlanCheckout } from './PlanCheckout'
import { getRemoteitLicense } from '../models/licensing'
import { currencyFormatter } from '../helpers/utilHelper'
import { REMOTEIT_PRODUCT_ID, PERSONAL_PLAN_ID } from '../models/licensing'
import { ApplicationState } from '../store'
import { useSelector } from 'react-redux'

export const Plans: React.FC = () => {
  const css = useStyles()
  const { plans, license } = useSelector((state: ApplicationState) => ({
    plans: state.licensing.plans.filter(p => p.product.id === REMOTEIT_PRODUCT_ID),
    license: getRemoteitLicense(state),
  }))
  const getDefaults = () => ({
    checkout: false,
    planId: license?.plan?.id,
    priceId: license?.price?.id,
    quantity: license?.quantity || 1,
  })
  const [form, setForm] = React.useState<IPurchase>(getDefaults())

  React.useEffect(() => {
    setForm(getDefaults())
  }, [license])

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
      <PlanCard
        name="Personal"
        description="For non-commercial use"
        price="$0"
        caption="Free"
        button="Select"
        selected={license?.plan?.id === PERSONAL_PLAN_ID}
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
        if (selected && license?.total && license.price?.amount) {
          price =
            currencyFormatter(license.price.currency, license.total, 0) + ` / ${license.price.interval.toLowerCase()}`
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
            button="Upgrade"
            allowUpdate={true}
            selected={selected}
            onSelect={() => setForm({ ...form, checkout: true, planId: plan.id, priceId: plan.prices[0].id })}
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
      <PlanCard
        name="Enterprise"
        description="For large volume and OEM"
        caption={
          <>
            Large-scale solutions
            <br /> or custom use cases
          </>
        }
        button="Contact Us"
        selected={false}
        onSelect={() => window.open('https://remote.it/contact-us/', '_blank')}
        feature="Volume devices* or user accounts"
        features={['1 year of activity logs', 'Slack support', 'Analytics and reporting']}
      />
    </Gutters>
  )
}

const useStyles = makeStyles({
  plans: {
    display: 'flex',
    position: 'relative',
    '& > div': { width: '33%', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  },
})
