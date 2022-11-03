import React from 'react'
import { PERSONAL_PLAN_ID, PROFESSIONAL_PLAN_ID, BUSINESS_PLAN_ID, ENTERPRISE_PLAN_ID } from '../models/plans'
import { ColorChip, Props as ChipProps } from './ColorChip'
import { useHistory } from 'react-router-dom'

type Props = { license: ILicense }

export const PlanActionChip: React.FC<Props> = ({ license }) => {
  const history = useHistory()

  let props: ChipProps = {
    label: '',
    typeColor: 'grayDarker',
    backgroundColor: 'grayLightest',
  }

  switch (license?.plan.id) {
    case PERSONAL_PLAN_ID:
      props.label = 'Subscribe'
      props.typeColor = 'alwaysWhite'
      props.backgroundColor = 'primary'
      break
    case PROFESSIONAL_PLAN_ID:
      props.label = 'Upgrade'
      props.typeColor = 'primary'
      break
    case BUSINESS_PLAN_ID:
      props.label = 'Change'
      break
    case ENTERPRISE_PLAN_ID:
      return null
  }

  return <ColorChip {...props} size="small" onClick={() => history.push('/account/plans')} />
}
