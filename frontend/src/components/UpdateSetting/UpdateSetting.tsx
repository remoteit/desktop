import React from 'react'
import { fullVersion, version } from '../../helpers/versionHelper'
import { useSelector, useDispatch } from 'react-redux'
import { ListItemSetting } from '../ListItemSetting'
import { ApplicationState, Dispatch } from '../../store'

export const UpdateSetting: React.FC = () => {
  const update = useSelector((state: ApplicationState) => state.backend.updateReady)
  const dispatch = useDispatch<Dispatch>()
  const updateAvailable = update && update !== version
  return (
    <ListItemSetting
      label={updateAvailable ? 'New version available' : 'About'}
      subLabel={`${fullVersion()} —  © remot3.it inc.`}
      icon="info"
      onButtonClick={dispatch.backend.restart}
      button={updateAvailable ? 'Restart' : undefined}
    />
  )
}
