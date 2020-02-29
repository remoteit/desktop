import React from 'react'
import Controller from '../../services/Controller'
import { environment } from '../../services/Browser'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../../store'
import { SettingsListItem } from '../SettingsListItem'
import { version } from '../../../package.json'

export const UpdateSetting: React.FC = () => {
  const update = useSelector((state: ApplicationState) => state.backend.update)
  const updateAvailable = update && update !== version
  return (
    <SettingsListItem
      label={updateAvailable ? 'New version available' : 'About'}
      subLabel={`Version ${version} ${environment() === 'development' ? 'Development' : ''} —  © remot3.it inc.`}
      icon="info-circle"
      onClick={updateAvailable ? () => Controller.emit('restart') : undefined}
      button={updateAvailable ? 'Restart' : undefined}
    />
  )
}
