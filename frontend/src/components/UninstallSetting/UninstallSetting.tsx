import React from 'react'
import { emit } from '../../services/Controller'
import { useDispatch } from 'react-redux'
import { Dispatch } from '../../store'
import { SettingsListItem } from '../SettingsListItem'
import { usePermissions } from '../../hooks/usePermissions'

export const UninstallSetting: React.FC = () => {
  const { ui } = useDispatch<Dispatch>()

  const warning = () =>
    window.confirm(
      'Are you sure? \nYou will remove this system as a host, your connections and command line utilities.'
    ) &&
    emit('uninstall') &&
    ui.setUninstalling()

  return (
    <SettingsListItem
      label="Uninstall"
      subLabel={`Completely remove all saved data and installed command line tools.`}
      icon="trash-alt"
      onClick={warning}
    />
  )
}
