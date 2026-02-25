import React from 'react'
import { PlanCard } from './PlanCard'
import { PlanGutters } from './PlanGutters'
import { RESELLER_PLAN_ID, planDetails } from '../models/plans'

type Props = {
  license: ILicense | null
}

export const PlanReseller: React.FC<Props> = ({ }) => {
  return (
    <PlanGutters>
      <PlanCard
        wide
        selected
        name="Reseller"
        button="Contact Us"
        onSelect={() => (window.location.href = encodeURI('mailto:support@remote.it?subject=Reseller Support'))}
        {...planDetails[RESELLER_PLAN_ID]}
      />
    </PlanGutters>
  )
}
