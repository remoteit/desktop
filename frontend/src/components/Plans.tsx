import React from 'react'
import { Overlay } from './Overlay'
import { Gutters } from './Gutters'
import { PlanCard } from './PlanCard'
import { PlanCheckout } from './PlanCheckout'
import { makeStyles, Typography } from '@material-ui/core'
import { REMOTEIT_PRODUCT_ID, PERSONAL_PLAN_ID } from '../models/licensing'
import { ApplicationState, Dispatch } from '../store'
import { useSelector, useDispatch } from 'react-redux'

export const Plans: React.FC = () => {
  const css = useStyles()
  const dispatch = useDispatch<Dispatch>()
  const { plans, license } = useSelector((state: ApplicationState) => ({
    plans: state.licensing.plans.filter(p => p.product.id === REMOTEIT_PRODUCT_ID),
    license: state.licensing.license,
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
        price={0}
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
      {plans.map(plan => (
        <PlanCard
          key={plan.id}
          name={plan.description}
          description="For business use"
          price={5}
          caption="per month / per user"
          button="Upgrade"
          allowUpdate={true}
          selected={license?.plan?.id === plan.id}
          onSelect={() => setForm({ ...form, checkout: true, planId: plan.id, priceId: plan.prices[0].id })}
          feature="Devices are not limited*"
          features={[
            '30 days of activity logs',
            'User groups - coming soon',
            'Commercial use',
            'APIs',
            'Mobile app',
            'Non-commercial',
            'SSO with Google',
          ]}
        ></PlanCard>
      ))}
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
        onSelect={() => (window.location.href = 'https://remote.it/contact-us/')}
        feature="Volume devices or user accounts*"
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
