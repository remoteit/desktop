import React from 'react'
import { MAX_NAME_LENGTH, REGEX_NAME_SAFE } from '../shared/constants'
import { useSelector, useDispatch } from 'react-redux'
import { ApplicationState, Dispatch } from '../store'
import { InlineTextFieldSetting } from './InlineTextFieldSetting'
import { attributeName } from '../shared/nameHelper'
import { safeHostname } from '../shared/nameHelper'
import { LabelButton } from '../buttons/LabelButton'
import { getDevices } from '../models/accounts'
import { makeStyles } from '@material-ui/core'

export const TagEditor: React.FC<{ device: IDevice }> = ({ device }) => {
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

  return (
    <>
      <InlineTextFieldSetting
        value={name}
        label="Tag Editor"
        disabled={device.shared}
        maxLength={MAX_NAME_LENGTH}
        filter={REGEX_NAME_SAFE}
        onSave={name => {
          devices.renameDevice({ ...device, name: name.toString() })
          // if we use device attributes:
          // device.attributes = { ...device.attributes, name: name.toString() }
          // devices.setAttributes(device)
        }}
      />
    </>
  )
}

const useStyles = makeStyles({
  overlap: { position: 'absolute', left: 28, top: 20, zIndex: 1 },
})
