import React from 'react'
import { selectLicense, lookupLicenseProductId, evaluationDays } from '../models/licensing'
import { ListItem, Link } from '@material-ui/core'
import { ApplicationState } from '../store'
import { LicensingTitle } from './LicensingTitle'
import { useSelector } from 'react-redux'
import { dateOptions } from './Duration/Duration'
import { Notice } from './Notice'

type Props = { device?: IDevice; license?: ILicense; context?: 'service' | 'add' | 'account' }

const learnMoreLink = (
  <Link href="https://support.remote.it/hc/en-us/articles/360050474512" target="_blank">
    Learn more.
  </Link>
)

export const LicensingNotice: React.FC<Props> = ({ context, ...props }) => {
  const { license, limits, upgradeUrl } = useSelector((state: ApplicationState) =>
    selectLicense(state, props.device ? lookupLicenseProductId(props.device) : props.license?.plan.product.id)
  )
  const serviceLimit = limits.find(l => l.name === 'aws-services')
  const evaluationLimit = limits.find(l => l.name === 'aws-evaluation')

  let notice
  let warnDate = new Date()
  warnDate.setDate(warnDate.getDate() + 3) // warn 3 days in advance

  if (!license) return null
  const title = `Your ${license.plan.description} license of ${license.plan.product.name}`

  if (warnDate > license.expiration && license.plan.name === 'TRIAL' && !context)
    notice = (
      <Notice severity="info" link={upgradeUrl}>
        {title} will expire on {/* replace with countdown */}
        {license.expiration.toLocaleString(undefined, dateOptions)}.
      </Notice>
    )

  if (serviceLimit?.value !== null && serviceLimit?.actual > serviceLimit?.value && !context)
    notice = (
      <Notice severity="warning" link={upgradeUrl}>
        {title} <LicensingTitle count={serviceLimit?.value} />
        <em>
          You have exceeded your limit by {serviceLimit?.actual - serviceLimit?.value}.{learnMoreLink}
        </em>
      </Notice>
    )

  if (!license.valid && !context)
    notice = (
      <Notice severity="warning" link={upgradeUrl}>
        {title} has expired.
        <em>
          Please upgrade your {license.plan.product.name} license.{learnMoreLink}
        </em>
      </Notice>
    )

  if (serviceLimit?.value !== null && serviceLimit?.actual > serviceLimit?.value && context === 'add')
    notice = (
      <Notice severity="warning" link={upgradeUrl}>
        {title} <LicensingTitle count={serviceLimit?.value} />
        <em>
          This service will be accessible for {evaluationDays(evaluationLimit?.value)} days unless you upgrade your
          license.{learnMoreLink}
        </em>
      </Notice>
    )

  return <ListItem>{notice}</ListItem>
}
