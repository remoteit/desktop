import React from 'react'
import { emit } from '../../services/Controller'
import { environment } from '../../services/Browser'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../../store'
import { ListItemSetting } from '../ListItemSetting'
import { version } from '../../../package.json'
import { isPortal, isRemote } from '../../services/Browser'
import analyticsHelper from '../../helpers/analyticsHelper'

export const UpdateSetting: React.FC = () => {
  const update = useSelector((state: ApplicationState) => state.backend.updateReady)
  const updateAvailable = update && update !== version
  let platform = isPortal() ? 'Portal' : 'Desktop'
  if (isRemote()) platform = 'Remote'
  return (
    <ListItemSetting
      label={updateAvailable ? 'New version available' : 'About'}
      subLabel={`${platform} Version ${version} ${
        environment() === 'development' ? 'Development' : ''
      } —  © remot3.it inc.`}
      icon="info"
      onButtonClick={() => {
        emit('restart')
        analyticsHelper.track('update')
      }}
      button={updateAvailable ? 'Restart' : undefined}
    />
  )
}
