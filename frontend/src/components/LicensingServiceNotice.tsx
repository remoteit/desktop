import React from 'react'
import { selectLicense, lookupLicenseProductId, evaluationDays } from '../models/licensing'
import { Link, Button } from '@material-ui/core'
import { ApplicationState } from '../store'
import { LicensingTitle } from './LicensingTitle'
import { useSelector } from 'react-redux'
import { Notice } from './Notice'

type Props = { device?: IDevice }

const learnMoreLink = (
  <Link href="https://link.remote.it/documentation-aws/setup" target="_blank">
    Learn more.
  </Link>
)

export const LicensingServiceNotice: React.FC<Props> = props => {
  const {
    noticeType,
    license,
    serviceLimit,
    evaluationLimit,
    upgradeUrl = '',
  } = useSelector((state: ApplicationState) => selectLicense(state, lookupLicenseProductId(props.device)))

  if (!license) return null

  const title = `Your ${license.plan.description} license of ${license.plan.product.name}`

  if (noticeType === 'LIMIT_EXCEEDED')
    return (
      <Notice
        severity="warning"
        button={
          <Button color="primary" variant="contained" href={upgradeUrl} size="small" target="_blank">
            Upgrade
          </Button>
        }
      >
        {title} <LicensingTitle count={serviceLimit?.value} />
        <em>
          This service will be accessible for {evaluationDays(evaluationLimit?.value)} days unless you upgrade your
          license.{learnMoreLink}
        </em>
      </Notice>
    )

  return null
}
