import React from 'react'
import { emit } from '../../services/Controller'
import { environment } from '../../services/Browser'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../../store'
import { ListItemSetting } from '../ListItemSetting'
import { version } from '../../../package.json'
import analyticsHelper from '../../helpers/analyticsHelper'

export const UpdateSetting: React.FC = () => {
  const update = useSelector((state: ApplicationState) => state.backend.update)
  const updateAvailable = update && update !== version
  return (
    <ListItemSetting
      label={updateAvailable ? 'New version available' : 'About'}
      subLabel={`Version ${version} ${environment() === 'development' ? 'Development' : ''} —  © remot3.it inc.`}
      icon="info"
      onButtonClick={() => {
        emit('restart')
        analyticsHelper.track('update')
      }}
      button={updateAvailable ? 'Restart' : undefined}
    />
  )
}
