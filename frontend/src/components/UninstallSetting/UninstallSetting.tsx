import React from 'react'
import { emit } from '../../services/Controller'
import { useDispatch } from 'react-redux'
import { Dispatch } from '../../store'
import { SettingsListItem } from '../SettingsListItem'
import Analytics from '../../helpers/Analytics'

export const UninstallSetting: React.FC = () => {
  const { ui } = useDispatch<Dispatch>()

  const warning = () => {
    window.confirm(
      'Are you sure? \nYou will remove this system as a host, your connections and command line utilities.'
    ) &&
      emit('uninstall') &&
      ui.setUninstalling()
    Analytics.Instance.track('Uninstall')
  }

  return (
    <SettingsListItem
      label="Uninstall command line tools"
      subLabel={`Completely remove all saved data and installed command line tools. 
        Do this before removing, or uninstalling the application from your system.`}
      icon="trash-alt"
      onClick={warning}
    />
  )
}
