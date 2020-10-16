import React from 'react'
import { getLicense } from '../models/licensing'
import { ListItem } from '@material-ui/core'
import { ApplicationState } from '../store'
import { useSelector } from 'react-redux'
import { dateOptions } from './Duration/Duration'
import { Notice } from './Notice'

type Props = { device?: IDevice; context?: 'service' | 'add' | 'account' }

export const LicensingNotice: React.FC<Props> = ({ device, context }) => {
  const { license, serviceLimit, evaluationDays } = useSelector((state: ApplicationState) => getLicense(state, device))
  const today = new Date()
  let notice
  let warnDate = new Date()
  warnDate.setDate(warnDate.getDate() + 5) // warn 5 days in advance

  if (!license || license.valid) return null

  if (serviceLimit?.actual > serviceLimit?.value)
    notice = (
      <Notice
        severity="warning"
        link="https://support.remote.it/hc/en-us/articles/360050474512-Step-1-Find-remote-it-in-the-AWS-Marketplace"
      >
        You are only licensed for {serviceLimit?.value} services.
        <em>
          You have {serviceLimit?.actual - serviceLimit?.value} unlicensed services
          {/* currently in the {evaluationDays}
          -day grace period*/}.
        </em>
      </Notice>
    )

  if (serviceLimit?.actual > serviceLimit?.value && context === 'add')
    notice = (
      <Notice
        severity="warning"
        link="https://support.remote.it/hc/en-us/articles/360050474512-Step-1-Find-remote-it-in-the-AWS-Marketplace"
      >
        You are only licensed for {serviceLimit?.value} services.
        <em>
          You will be allowed to add this service, but it will only be accessible for {evaluationDays}-days unless you
          upgrade your license to support additional services.
        </em>
      </Notice>
    )

  if (warnDate > license.expiration)
    notice = (
      <Notice
        severity="info"
        link="https://support.remote.it/hc/en-us/articles/360050474512-Step-1-Find-remote-it-in-the-AWS-Marketplace"
      >
        Your license is expiring on {license.expiration.toLocaleString(undefined, dateOptions)}.
        <em>You will not be able to access these services after the {evaluationDays}-day grace period.</em>
      </Notice>
    )

  if (today > license.expiration)
    notice = (
      <Notice
        severity="warning"
        link="https://support.remote.it/hc/en-us/articles/360050474512-Step-1-Find-remote-it-in-the-AWS-Marketplace"
      >
        Your license has expired.
        <em>You will not be able to access these services after the {evaluationDays}-day grace period.</em>
      </Notice>
    )

  return <ListItem>{notice}</ListItem>
}
