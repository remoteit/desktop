import React from 'react'
import { emit } from '../../services/Controller'
import { useDispatch, useSelector } from 'react-redux'
import { ApplicationState, Dispatch } from '../../store'
import { SettingsListItem } from '../SettingsListItem'

export const UninstallSetting: React.FC = () => {
  const { ui } = useDispatch<Dispatch>()

  const { guest } = useSelector((state: ApplicationState) => ({
    guest: state.backend.admin && state.auth.user && state.auth.user.username !== state.backend.admin,
  }))

  if (guest) return null

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
