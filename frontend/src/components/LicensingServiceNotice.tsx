import React from 'react'
import { selectFullLicense, lookupLicenseProductId, humanizeDays } from '../models/plans'
import { ApplicationState } from '../store'
import { LicensingTitle } from './LicensingTitle'
import { useSelector } from 'react-redux'
import { Button } from '@mui/material'
import { Notice } from './Notice'
import { Link } from './Link'

type Props = { device?: IDevice; license?: ILicense }

export const LicensingServiceNotice: React.FC<Props> = props => {
  const {
    noticeType,
    license,
    serviceLimit,
    evaluationLimit,
    managePath = '',
  } = useSelector((state: ApplicationState) => {
    let productId = props.license?.plan.product.id
    if (props.device && state.auth.user?.id === props.device.owner.id) productId = lookupLicenseProductId(props.device)
    return selectFullLicense(state, { productId })
  })

  if (!license) return null

  const title = `Your ${license.plan.description} license of ${license.plan.product.name}`

  if (noticeType === 'LIMIT_EXCEEDED')
    return (
      <Notice
        severity="warning"
        button={
          <Link to={managePath}>
            <Button color="primary" variant="contained" size="small">
              Upgrade
            </Button>
          </Link>
        }
      >
        {title} <LicensingTitle count={serviceLimit?.value} />
        <em>
          This service will be accessible for {humanizeDays(evaluationLimit?.value)}, unless you upgrade your license.
          <Link to={managePath}>Learn more.</Link>
        </em>
      </Notice>
    )

  return null
}
