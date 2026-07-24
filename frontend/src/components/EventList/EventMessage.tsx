import React from 'react'
import { useTranslation } from 'react-i18next'
import i18n from '../../i18n'
import { combinedName } from '@common/nameHelper'
import { formatBytes, formatDuration, isUsageNumber } from '../../helpers/usageHelper'
import { Icon } from '../Icon'

export const EventActions = ['add', 'update']

export const EventState = {
  active: 'active',
  connected: 'connected',
}

export function EventMessage({
  item,
  device,
  loggedInUser,
}: {
  item: IEvent
  device?: IDevice
  loggedInUser: IUser
}): JSX.Element {
  const { t } = useTranslation()
  const target = item.target?.[0] //(item.target?.map(service => service.name) || []).join(' + ')
  let name = combinedName(target, target?.device, ' - ')
  if (!name)
    name = target?.id
      ? t('eventMessage.deletedTarget', { id: target.id, defaultValue: '{{id}} (deleted)' })
      : t('eventMessage.unknown', 'Unknown')
  const isActorSelf = item.actor?.email === loggedInUser.email
  const actorName = isActorSelf ? t('eventMessage.you', 'You') : item.actor?.email
  const actorAdjective = isActorSelf ? t('eventMessage.your', 'your') : t('eventMessage.their', 'their')

  const messageDevice = device || item.devices?.[0]
  const deviceName = messageDevice?.name || ''
  const users = item.users?.map(user => user.email || t('eventMessage.deletedUser', '(deleted)')) || []
  const userList =
    users.length === 1
      ? users[0]
      : `${users.slice(0, -1).join(', ')} ${t('eventMessage.and', 'and')} ${users.slice(-1)}`
  const isAffectedSelf = userList === loggedInUser.email
  const affected = isAffectedSelf ? t('eventMessage.youLower', 'you') : userList

  let message: JSX.Element | string = ''
  let detail: JSX.Element | null = null
  switch (item.type) {
    case 'AUTH_LOGIN':
      message = (
        <>
          <b>{actorName}</b> {t('eventMessage.loggedIn', 'logged in')}
        </>
      )
      break
    case 'AUTH_LOGIN_ATTEMPT':
      message = (
        <>
          <b>{actorName}</b> {t('eventMessage.attemptedToLogIn', 'attempted to log in')}
        </>
      )
      break
    case 'AUTH_PASSWORD_RESET':
      message = (
        <>
          <b>{actorName}</b>{' '}
          {t('eventMessage.resetPassword', { adjective: actorAdjective, defaultValue: 'reset {{adjective}} password' })}
        </>
      )
      break
    case 'AUTH_PHONE_CHANGE':
      message = t('eventMessage.phoneNumberChanged', 'Phone number changed')
      break
    case 'AUTH_MFA_ENABLED':
      message = t('eventMessage.mfaEnabled', 'Multi-factor authentication (MFA) enabled')
      break
    case 'AUTH_MFA_DISABLED':
      message = t('eventMessage.mfaDisabled', 'Multi-factor authentication (MFA) disabled')
      break
    case 'DEVICE_STATE':
      message = (
        <>
          <b>{name} </b>
          {item.state === EventState.active
            ? t('eventMessage.wentOnline', 'went online')
            : t('eventMessage.wentOffline', 'went offline')}
        </>
      )
      break

    case 'DEVICE_CONNECT':
      if (isUsageNumber(item.txBytes) || isUsageNumber(item.rxBytes) || isUsageNumber(item.lifetime)) {
        detail = (
          <div className="event-usage">
            <span className="event-usage-sent">
              <Icon name="chevron-up" color="primary" size="xxs" type="solid" title={t('eventMessage.sent', 'Sent')} />
              <strong>{formatBytes(item.txBytes)}</strong>
            </span>
            <span className="event-usage-received">
              <Icon
                name="chevron-down"
                color="primary"
                size="xxs"
                type="solid"
                title={t('eventMessage.received', 'Received')}
              />
              <strong>{formatBytes(item.rxBytes)}</strong>
            </span>
            <span className="event-usage-duration">
              <Icon name="clock" size="xxs" type="regular" title={t('eventMessage.duration', 'Duration')} />
              <strong>{formatDuration(item.lifetime)}</strong>
            </span>
          </div>
        )
      }
      message = (
        <>
          <b>{actorName}</b>{' '}
          {item.state === EventState.connected
            ? t('eventMessage.connectedTo', 'connected to')
            : t('eventMessage.disconnectedFrom', 'disconnected from')}{' '}
          <i>{name} </i>
        </>
      )
      break

    case 'DEVICE_SHARE':
      if (item.shared) {
        message = (
          <>
            {actorName} {t('eventMessage.shared', 'shared')} <i>{deviceName}</i> {t('eventMessage.and', 'and')}{' '}
            {item.scripting ? t('eventMessage.allowed', 'allowed') : t('eventMessage.restricted', 'restricted')}{' '}
            {t('eventMessage.scriptExecutionWith', 'script execution with')}
            <b>{affected}</b>
          </>
        )
      } else if (EventActions.includes(item.action)) {
        message = (
          <>
            {actorName} {t('eventMessage.shared', 'shared')} <i>{deviceName}</i>{' '}
            {t('eventMessage.with', 'with')} <b>{affected}</b>
          </>
        )
      } else if (isActorSelf && isAffectedSelf) {
        message = (
          <>
            {t('eventMessage.youLeftSharedDevice', 'You left the shared device')} <i>{deviceName}</i>
          </>
        )
      } else {
        message = (
          <>
            {actorName} {t('eventMessage.removedSharingOf', 'removed sharing of')} <i>{deviceName}</i>{' '}
            {t('eventMessage.from', 'from')} <b>{affected}</b>
          </>
        )
      }
      break

    case 'DEVICE_TRANSFER':
      message = (
        <>
          {actorName} {t('eventMessage.transferred', 'transferred')} <b>{deviceName}</b>{' '}
          {t('eventMessage.to', 'to')} <i>{affected}</i>
        </>
      )
      break

    case 'DEVICE_DELETE':
      message = (
        <>
          <i>{actorName}</i> {t('eventMessage.deleted', 'deleted')} <b>{name}</b>
        </>
      )
      break

    case 'LICENSE_UPDATED':
      message = <b>{t('eventMessage.licenseUpdated', 'Your license was updated')}</b>
      break

    case 'JOB':
      message = (
        <>
          {t('eventMessage.script', 'Script')} <b>{item.job?.file?.name}</b>{' '}
          {statusDisplay(item.action.toUpperCase() as IJobStatus)} {t('eventMessage.on', 'on')}{' '}
          <i>
            {t('eventMessage.deviceCount', {
              count: item.devices?.length ?? 0,
              defaultValue_one: '{{count}} device',
              defaultValue_other: '{{count}} devices',
            })}
          </i>
        </>
      )
      break

    case 'DEVICE_JOB':
      message = (
        <>
          {t('eventMessage.script', 'Script')} <b>{item.job?.file?.name}</b>{' '}
          {statusDisplay(item.action.toUpperCase() as IJobStatus)} {t('eventMessage.on', 'on')}{' '}
          <i>{item.devices?.[0].name}</i>
          {/* <b>
            <Pre>{item}</Pre>
          </b> */}
        </>
      )
      break

    default:
      message = (
        <>{t('eventMessage.unknownEventType', { type: item.type, defaultValue: 'Unknown event type {{type}} occurred' })}</>
      )
  }

  return (
    <div>
      <div>{message}</div>
      {detail}
    </div>
  )
}

function statusDisplay(status?: IJobStatus): string {
  switch (status) {
    case 'READY':
      return i18n.t('eventMessage.status.ready', 'was ready to run')
    case 'WAITING':
      return i18n.t('eventMessage.status.waiting', 'waited to run')
    case 'RUNNING':
      return i18n.t('eventMessage.status.running', 'ran')
    case 'FAILED':
      return i18n.t('eventMessage.status.failed', 'failed')
    case 'SUCCESS':
      return i18n.t('eventMessage.status.success', 'ran successfully')
    case 'CANCELLED':
      return i18n.t('eventMessage.status.cancelled', 'was cancelled')
    default:
      return i18n.t('eventMessage.status.unknown', 'did something strange')
  }
}
