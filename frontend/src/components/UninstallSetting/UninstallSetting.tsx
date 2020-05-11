import React from 'react'
import { emit } from '../../services/Controller'
import { useDispatch } from 'react-redux'
import { Dispatch } from '../../store'
import { SettingsListItem } from '../SettingsListItem'
import analytics from '../../helpers/Analytics'

export const UninstallSetting: React.FC = () => {
  const { ui } = useDispatch<Dispatch>()

  const warning = () => {
    window.confirm(
      'Are you sure? \nYou will remove this system as a host, your connections and command line utilities.'
    ) &&
      emit('uninstall') &&
      ui.set({ uninstalling: true })
    analytics.track('uninstall')
  }

  return (
    <SettingsListItem
      label="Uninstall command line tools"
      subLabel={`De-register this device, completely remove all saved data, and uninstall the command line tools. 
        Do this before removing, or uninstalling the application from your system.`}
      icon="trash-alt"
      onClick={warning}
    />
  )
}
