import React from 'react'
import { emit } from '../../services/Controller'
import { fullVersion, version } from '../../helpers/versionHelper'
import { useSelector } from 'react-redux'
import { ListItemSetting } from '../ListItemSetting'
import { ApplicationState } from '../../store'
import analyticsHelper from '../../helpers/analyticsHelper'

export const UpdateSetting: React.FC = () => {
  const update = useSelector((state: ApplicationState) => state.backend.updateReady)
  const updateAvailable = update && update !== version
  return (
    <ListItemSetting
      label={updateAvailable ? 'New version available' : 'About'}
      subLabel={`${fullVersion()} —  © remot3.it inc.`}
      icon="info"
      onButtonClick={() => {
        emit('restart')
        analyticsHelper.track('update')
      }}
      button={updateAvailable ? 'Restart' : undefined}
    />
  )
}
