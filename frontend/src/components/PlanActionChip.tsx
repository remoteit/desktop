import React from 'react'
import {
  PERSONAL_PLAN_ID,
  PROFESSIONAL_PLAN_ID,
  BUSINESS_PLAN_ID,
  ENTERPRISE_PLAN_ID,
  SATELLITE_PLAN_ID,
} from '../models/plans'
import { useSelector } from 'react-redux'
import { selectRemoteitLicense } from '../selectors/organizations'
import { ApplicationState } from '../store'
import { ColorChip, Props as ChipProps } from './ColorChip'
import { useHistory } from 'react-router-dom'

export const PlanActionChip: React.FC<ChipProps> = ({ ...props }) => {
  const license = useSelector((state: ApplicationState) => selectRemoteitLicense(state))
  const history = useHistory()

  props.label ||= ''
  props.color ||= 'primary'

  switch (license?.plan.id) {
    case PERSONAL_PLAN_ID:
      props.label = 'Subscribe'
      props.variant = 'contained'
      break
    case PROFESSIONAL_PLAN_ID:
      props.label = 'Upgrade'
      break
    case BUSINESS_PLAN_ID:
      props.label = 'Update'
      break
    case ENTERPRISE_PLAN_ID:
    case SATELLITE_PLAN_ID:
    default:
      return null
  }

  return <ColorChip {...props} size="small" onClick={() => history.push('/account/plans')} />
}
