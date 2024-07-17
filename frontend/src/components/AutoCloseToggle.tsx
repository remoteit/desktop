import React from 'react'
import { Application } from '@common/applications'
import { ListItemSetting } from './ListItemSetting'
import { setConnection, launchSettingHidden } from '../helpers/connectionHelper'

export const AutoCloseToggle: React.FC<{ app: Application; disabled?: boolean }> = ({ app, disabled }) => {
  if (launchSettingHidden(app.connection)) return null
  if (!app.launchMethod.disconnect) return null

  return (
    <ListItemSetting
      icon="circle-stop"
      label="Auto Close"
      subLabel={app.launchMethod.disconnectDisplay || 'Run cleanup command on disconnect'}
      toggle={!!app.connection?.autoClose}
      disabled={disabled}
      onClick={() =>
        app.connection &&
        setConnection({
          ...app.connection,
          autoClose: !app.connection.autoClose,
        })
      }
    />
  )
}
