import React from 'react'
import Controller from '../../services/Controller'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../../store'
import { SettingsListItem } from '../SettingsListItem'
import { version } from '../../../package.json'

export const UninstallSetting: React.FC = () => {
  const update = useSelector((state: ApplicationState) => state.backend.update)

  const warning = () =>
    window.confirm(
      'Are you sure? This will remove this system as a device, all the connection data and the command line utilities.'
    ) && Controller.emit('uninstall')

  return (
    <SettingsListItem
      label="Uninstall"
      subLabel={`Completely remove all saved data and installed command line tools.`}
      icon="trash-alt"
      onClick={warning}
    />
  )
}
