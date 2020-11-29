import React from 'react'
import { selectLicense, lookupLicenseProductId } from '../models/licensing'
import { ListItem, Link } from '@material-ui/core'
import { ApplicationState } from '../store'
import { LicensingTitle } from './LicensingTitle'
import { useSelector } from 'react-redux'
import { dateOptions } from './Duration/Duration'
import { Notice } from './Notice'

type Props = { device?: IDevice; license?: ILicense }

const learnMoreLink = (
  <Link href="https://link.remote.it/documentation-aws/setup" target="_blank">
    Learn more.
  </Link>
)

export const LicensingNotice: React.FC<Props> = props => {
  const { noticeType, license, serviceLimit, upgradeUrl } = useSelector((state: ApplicationState) =>
    selectLicense(state, props.device ? lookupLicenseProductId(props.device) : props.license?.plan.product.id)
  )

  if (!license || !noticeType) return null

  let notice
  const title = `Your ${license.plan.description} plan of ${license.plan.product.name}`

  if (noticeType === 'EXPIRATION_WARNING')
    notice = (
      <Notice severity="info" link={upgradeUrl}>
        {title} will expire on {/* replace with countdown */}
        {license.expiration.toLocaleString(undefined, dateOptions)}.
      </Notice>
    )

  if (noticeType === 'LIMIT_EXCEEDED')
    notice = (
      <Notice severity="warning" link={upgradeUrl}>
        {title} <LicensingTitle count={serviceLimit?.value} />
        <em>
          You have exceeded your limit by {serviceLimit?.actual - serviceLimit?.value}.{learnMoreLink}
        </em>
      </Notice>
    )

  if (noticeType === 'EXPIRED')
    notice = (
      <Notice severity="warning" link={upgradeUrl}>
        {title} has expired.
        <em>Please upgrade your license.{learnMoreLink}</em>
      </Notice>
    )

  return <ListItem>{notice}</ListItem>
}
