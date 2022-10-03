import React from 'react'
import { isPortal } from '../services/Browser'
import { setConnection } from '../helpers/connectionHelper'
import { ListItemSetting } from './ListItemSetting'
import { useDispatch } from 'react-redux'
import { Dispatch } from '../store'

export const ConnectLinkSetting: React.FC<{ connection: IConnection; permissions: IPermission[] }> = ({
  connection,
  permissions,
}) => {
  const dispatch = useDispatch<Dispatch>()

  if (!permissions.includes('MANAGE')) return null

  return (
    <ListItemSetting
      icon="people-pants"
      label="Persistent public url"
      subLabel={'Create a fixed public endpoint for anyone to connect to'}
      toggle={!!connection.connectLink}
      onClick={() => {
        if (connection.connectLink) {
          const updated = { ...connection, public: false || isPortal(), connectLink: false }
          connection.enabled
            ? dispatch.ui.set({
                confirm: {
                  id: 'destroyLink',
                  callback: () => dispatch.connections.disableConnectLink(updated),
                },
              })
            : setConnection(updated)
        } else {
          setConnection({ ...connection, public: true, connectLink: true })
        }
      }}
    />
  )
}
