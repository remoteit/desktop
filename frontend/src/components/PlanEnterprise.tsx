import React from 'react'
import { PlanCard } from './PlanCard'
import { windowOpen } from '../services/browser'
import { PlanGutters } from './PlanGutters'
import { ENTERPRISE_PLAN_ID, planDetails } from '../models/plans'

type Props = { license: ILicense | null }

export const PlanEnterprise: React.FC<Props> = ({ license }) => {
  const enterprise = license?.plan.id === ENTERPRISE_PLAN_ID
  return (
    <PlanGutters>
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
              <br /> unique and custom use-cases
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
    </PlanGutters>
  )
}
