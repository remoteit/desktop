import React, { useContext, useState } from 'react'
import { DeviceContext } from '../../services/Context'
import { State, Dispatch } from '../../store'
import { MAX_NAME_LENGTH } from '@common/constants'
import { useSelector, useDispatch } from 'react-redux'
import { safeHostname } from '@common/nameHelper'
import { useTranslation } from 'react-i18next'
import { Checkbox, FormControlLabel } from '@mui/material'
import { InlineTextFieldSetting, InlineTextFieldSettingProps } from '../InlineTextFieldSetting'
import { getDevices } from '../../selectors/devices'
import { useDeviceSessions } from '../../hooks/useDeviceSessions'
import { useDeviceSessionInfo } from '../../hooks/useDeviceSessionInfo'
import { setDeviceSubnetLabel, splitSubnetName, subnetLabel } from '../../services/subnetNames'

export const DeviceNameSetting: React.FC<InlineTextFieldSettingProps> = props => {
  const { device } = useContext(DeviceContext)
  const dispatch = useDispatch<Dispatch>()
  const { t } = useTranslation()
  const hostname = useSelector((state: State) => state.backend.environment.hostname)
  const nameBlacklist = useSelector(getDevices)
    .filter((device: IDevice) => !device.shared)
    .map((d: IDevice) => d.name.toLowerCase())
  const sessions = useDeviceSessions()
  const info = useDeviceSessionInfo(sessions ? device?.id : undefined)
  // The DNS name the rename was asked to move to as well — only the one shown when it was checked.
  const [alsoLabel, setAlsoLabel] = useState<string>()

  if (!device) return null

  const name = device.name
  const defaultValue = device.thisDevice ? safeHostname(hostname, nameBlacklist) : device.name

  // A device's DNS name is made from its first name and kept through renames. While it is still the one its current
  // name makes, a rename offers to move it too — unchecked: it changes what scripts and bookmarks reach.
  const subnet = info?.subnetName ? splitSubnetName(info.subnetName) : undefined
  const generated = !!subnet && subnet.label === subnetLabel(name)
  const offer = (value: string): string | undefined => {
    const label = subnetLabel(value)
    return subnet && generated && value.trim() !== name && label && label !== subnet.label ? label : undefined
  }

  return (
    <InlineTextFieldSetting
      required
      value={name}
      icon="i-cursor"
      label={t('deviceNameSetting.label', 'Device Name')}
      disabled={!device.permissions.includes('MANAGE')}
      resetValue={defaultValue}
      maxLength={MAX_NAME_LENGTH}
      helper={value => {
        const label = offer(value)
        if (!label) return null
        return (
          <FormControlLabel
            // Keeps the field focused: a blur ends the edit.
            onMouseDown={event => event.preventDefault()}
            control={
              <Checkbox
                size="small"
                checked={alsoLabel === label}
                onChange={event => setAlsoLabel(event.target.checked ? label : undefined)}
              />
            }
            label={t('deviceNameSetting.alsoSubnet', 'Also change its DNS name to {{name}}', {
              name: label + subnet!.rest,
            })}
          />
        )
      }}
      onSave={async value => {
        const label = offer(value.toString())
        const also = label && alsoLabel === label ? label : undefined
        setAlsoLabel(undefined)
        dispatch.accounts.setDevice({ id: device.id, device: { ...device, name: value.toString() } })
        const renamed = await dispatch.devices.rename({ id: device.id, name: value.toString() })
        if (also && renamed !== 'ERROR') await setDeviceSubnetLabel(device.id, also)
      }}
      {...props}
    />
  )
}
