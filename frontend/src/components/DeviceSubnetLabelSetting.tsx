import React, { useContext } from 'react'
import { useTranslation } from 'react-i18next'
import { DeviceContext } from '../services/Context'
import { useDeviceSessions } from '../hooks/useDeviceSessions'
import { useDeviceSessionInfo } from '../hooks/useDeviceSessionInfo'
import { NAME_MAX, setDeviceSubnetLabel, splitSubnetName, validLabel } from '../services/subnetNames'
import { InlineTextFieldSetting } from './InlineTextFieldSetting'

/* The device's name in device subnets, <name>-<owner slug>.<domain>, and its name part edited in place: lower case
   letters and digits, checked as it is typed; whether it is free in the account, and whether this person may change
   it, graphql decides — a refusal is shown as the app shows any. Made from the device's first name and kept through
   renames (the rename offers to change it, DeviceNameSetting). Absent where the API does not serve device sessions. */
export const DeviceSubnetLabelSetting: React.FC = () => {
  const { t } = useTranslation()
  const { device } = useContext(DeviceContext)
  const enabled = useDeviceSessions()
  const info = useDeviceSessionInfo(enabled ? device?.id : undefined)

  if (!enabled || !device || !info?.subnetName) return null

  const { label, rest } = splitSubnetName(info.subnetName)

  return (
    <InlineTextFieldSetting
      required
      icon="globe"
      label={t('deviceSubnetLabel.label', 'DNS Name')}
      value={label}
      displayValue={info.subnetName}
      maxLength={NAME_MAX}
      disabled={!device.permissions.includes('MANAGE')}
      validate={value =>
        !validLabel(value)
          ? t('deviceSubnetLabel.problem', 'Lower case letters and digits, at most 29, no dashes')
          : undefined
      }
      helper={value =>
        t('deviceSubnetLabel.hint', '{{name}} — the old name keeps working for 30 days', {
          name: value.trim().toLowerCase() + rest,
        })
      }
      onSave={value => {
        if (value.toString().trim().toLowerCase() !== label) setDeviceSubnetLabel(device.id, value.toString())
      }}
    />
  )
}
