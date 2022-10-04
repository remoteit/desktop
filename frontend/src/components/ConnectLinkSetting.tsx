import React from 'react'
import { isPortal } from '../services/Browser'
import { setConnection } from '../helpers/connectionHelper'
import { ListItemSetting } from './ListItemSetting'
import { useDispatch } from 'react-redux'
import { Dispatch } from '../store'
import { ColorChip } from './ColorChip'
import { Tooltip } from '@mui/material'

export const ConnectLinkSetting: React.FC<{ connection: IConnection; permissions: IPermission[] }> = ({
  connection,
  permissions,
}) => {
  const dispatch = useDispatch<Dispatch>()
  const disabled = !permissions.includes('MANAGE')

  const Setting = (
    <ListItemSetting
      icon="globe"
      label={
        <>
          <ColorChip label="BETA" size="small" typeColor="alwaysWhite" backgroundColor="success" />
          &nbsp;Persistent public url
        </>
      }
      disabled={disabled}
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

  return disabled ? (
    <Tooltip title="Requires device 'Manage' permission" placement="left" enterDelay={400} arrow>
      <span>{Setting}</span>
    </Tooltip>
  ) : (
    Setting
  )
}
