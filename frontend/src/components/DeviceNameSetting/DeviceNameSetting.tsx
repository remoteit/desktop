import React from 'react'
import { MAX_NAME_LENGTH, REGEX_NAME_SAFE } from '../../shared/constants'
import { useSelector, useDispatch } from 'react-redux'
import { ApplicationState, Dispatch } from '../../store'
import { InlineTextFieldSetting } from '../InlineTextFieldSetting'
import { attributeName } from '../../shared/nameHelper'
import { safeHostname } from '../../shared/nameHelper'
import { LabelButton } from '../../buttons/LabelButton'
import { getDevices } from '../../models/accounts'
import { makeStyles } from '@material-ui/core'

export const DeviceNameSetting: React.FC<{ device: IDevice; targetDevice: ITargetDevice }> = ({
  device,
  targetDevice,
}) => {
  const css = useStyles()
  const { devices } = useDispatch<Dispatch>()
  const { hostname, nameBlacklist } = useSelector((state: ApplicationState) => ({
    hostname: state.backend.environment.hostname,
    nameBlacklist: getDevices(state)
      .filter((device: IDevice) => !device.shared)
      .map((d: IDevice) => d.name.toLowerCase()),
  }))

  if (!device) return null

  const name = attributeName(device)
  const defaultValue = device.id === targetDevice.uid ? safeHostname(hostname, nameBlacklist) : device.name

  return (
    <>
      <div className={css.overlap}>
        <LabelButton device={device} />
      </div>
      <InlineTextFieldSetting
        required
        value={name}
        label="Device Name"
        disabled={device.shared}
        resetValue={defaultValue}
        maxLength={MAX_NAME_LENGTH}
        filter={REGEX_NAME_SAFE}
        onSave={name => {
          if (device.shared) {
            // we use device attributes:
            device.attributes = { ...device.attributes, name: name.toString() }
            devices.setAttributes(device)
          } else {
            devices.renameDevice({ ...device, name: name.toString() })
          }
        }}
      />
    </>
  )
}

const useStyles = makeStyles({
  overlap: { position: 'absolute', left: 28, top: 20, zIndex: 1 },
})
