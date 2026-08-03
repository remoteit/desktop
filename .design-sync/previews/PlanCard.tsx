import React from 'react'
import { PlanCard } from 'remoteit-desktop-frontend'

// PlanCard styles sibling spacing off `.planCard + .planCard`, so a row is just
// a flex container — no extra gap needed.
const Row: React.FC<{ children?: React.ReactNode; width?: number }> = ({ children, width = 860 }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', width: '100%', maxWidth: width }}>{children}</div>
)

export const PlanRow = () => (
  <Row>
    <PlanCard
      name="Personal"
      description="For hobbyists and evaluation"
      price="Free"
      caption="Up to 5 devices"
      button="Select"
      features={['5 devices', 'Unlimited connections', 'Community support']}
    />
    <PlanCard
      name="Professional"
      description="For individual developers"
      price="$10"
      caption="per month"
      note="billed annually"
      button="Select"
      features={['Unlimited devices', 'Persistent public URLs', 'Email support']}
    />
    <PlanCard
      name="Business"
      description="For teams and organizations"
      price="$25"
      caption="per user / month"
      note="billed annually"
      button="Select"
      promoted
      features={['Everything in Professional', 'Organization roles & tags', 'SAML single sign-on']}
    />
  </Row>
)

export const CurrentPlan = () => (
  <Row width={520}>
    <PlanCard
      selected
      name="Professional"
      description="For individual developers"
      price="$10"
      caption="per month"
      note="renews Sep 1, 2026"
      button="Manage"
      features={['Unlimited devices', 'Persistent public URLs', 'Email support']}
    />
  </Row>
)

export const Enterprise = () => (
  <Row width={720}>
    <PlanCard
      wide
      name="Enterprise"
      description="For fleets at scale"
      caption="Volume pricing for 1,000+ devices"
      button="Contact sales"
      features={[
        'Everything in Business',
        'Bulk device registration & scripting',
        'Dedicated cloud proxy regions',
        'Custom data retention',
        'Onboarding and 24/7 support',
      ]}
    />
  </Row>
)

export const States = () => (
  <Row width={560}>
    <PlanCard
      loading
      name="Business"
      description="For teams and organizations"
      price="$25"
      caption="per user / month"
      button="Select"
      features={['Organization roles & tags', 'SAML single sign-on']}
    />
    <PlanCard
      disabled
      name="Personal"
      description="For hobbyists and evaluation"
      price="Free"
      caption="Up to 5 devices"
      note="Not available — you have 38 devices"
      button="Downgrade"
      features={['5 devices', 'Community support']}
    />
  </Row>
)
