import React from 'react'
import { emit } from '../../services/Controller'
import { useDispatch } from 'react-redux'
import { Dispatch } from '../../store'
import { ListItemSetting } from '../ListItemSetting'
import analyticsHelper from '../../helpers/analyticsHelper'

export const UninstallSetting: React.FC = () => {
  const { ui } = useDispatch<Dispatch>()

  const warning = () => {
    if (
      window.confirm(
        'Are you sure?\n\nYou will remove this system as a host, your connections and command line utilities.'
      )
    ) {
      emit('uninstall')
      ui.set({ uninstalling: true })
      analyticsHelper.track('uninstall')
    }
  }

  return (
    <ListItemSetting
      label="Uninstall command line tools"
      subLabel={`De-register this device, completely remove all saved data, and uninstall the command line tools. 
        Do this before removing, or uninstalling the application from your system.`}
      icon="trash-alt"
      onClick={warning}
    />
  )
}
