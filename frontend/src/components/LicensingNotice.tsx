import React from 'react'
import { getLicense } from '../models/licensing'
import { ListItem } from '@material-ui/core'
import { ApplicationState } from '../store'
import { LicensingTitle } from './LicensingTitle'
import { useSelector } from 'react-redux'
import { dateOptions } from './Duration/Duration'
import { Notice } from './Notice'

type Props = { device?: IDevice; context?: 'service' | 'add' | 'account' }

export const LicensingNotice: React.FC<Props> = ({ device, context }) => {
  const { license, serviceLimit, evaluationDays } = useSelector((state: ApplicationState) => getLicense(state, device))

  let notice
  let warnDate = new Date()
  warnDate.setDate(warnDate.getDate() + 5) // warn 5 days in advance

  if (!license) return null

  if (warnDate > license.expiration)
    notice = (
      <Notice
        severity="info"
        link="https://support.remote.it/hc/en-us/articles/360050474512-Step-1-Find-remote-it-in-the-AWS-Marketplace"
      >
        Your {license.plan.description} license of {license.plan.product.name} is expiring on{' '}
        {license.expiration.toLocaleString(undefined, dateOptions)}.
        <em>You will not be able to access these services after the {evaluationDays}-day grace period.</em>
      </Notice>
    )

  if (serviceLimit?.value !== null && serviceLimit?.actual > serviceLimit?.value)
    notice = (
      <Notice
        severity="warning"
        link="https://support.remote.it/hc/en-us/articles/360050474512-Step-1-Find-remote-it-in-the-AWS-Marketplace"
      >
        <LicensingTitle count={serviceLimit?.value} />
        <em>
          You currently have {serviceLimit?.actual} services, {serviceLimit?.actual - serviceLimit?.value} are
          unlicensed.
        </em>
      </Notice>
    )

  if (!license.valid)
    notice = (
      <Notice
        severity="warning"
        link="https://support.remote.it/hc/en-us/articles/360050474512-Step-1-Find-remote-it-in-the-AWS-Marketplace"
      >
        Your license has expired.
        <em>You will not be able to access these services after a {evaluationDays}-day grace period.</em>
      </Notice>
    )

  if (serviceLimit?.value !== null && serviceLimit?.actual > serviceLimit?.value && context === 'add')
    notice = (
      <Notice
        severity="warning"
        link="https://support.remote.it/hc/en-us/articles/360050474512-Step-1-Find-remote-it-in-the-AWS-Marketplace"
      >
        <LicensingTitle count={serviceLimit?.value} />
        <em>
          You will be allowed to add this service, but it will only be accessible for {evaluationDays}-days unless you
          upgrade your license to support additional services.
        </em>
      </Notice>
    )

  return <ListItem>{notice}</ListItem>
}
