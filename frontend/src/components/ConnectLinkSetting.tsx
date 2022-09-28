import React from 'react'
import { isPortal } from '../services/Browser'
import { setConnection } from '../helpers/connectionHelper'
import { useApplication } from '../hooks/useApplication'
import { ListItemSetting } from './ListItemSetting'

export const ConnectLinkSetting: React.FC<{ connection: IConnection; permissions: IPermission[] }> = ({
  connection,
  permissions,
}) => {
  const app = useApplication(undefined, connection)

  if (!permissions.includes('MANAGE') || !app.allowConnectLink) return null

  return (
    <ListItemSetting
      icon="people-pants"
      label="Persistent public url"
      subLabel={'Create a fixed public endpoint for anyone to connect to'}
      toggle={!!connection.connectLink}
      onClick={() =>
        setConnection({
          ...connection,
          public: !connection.connectLink || isPortal(),
          connectLink: !connection.connectLink,
        })
      }
    />
  )
}
