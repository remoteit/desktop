import React, { useState, useEffect } from 'react'
import { IconButton } from '../buttons/IconButton'
import { SelectSetting } from './SelectSetting'
import { ListItemQuote } from './ListItemQuote'
import { ListItemSetting } from './ListItemSetting'
import { InlineTextFieldSetting } from './InlineTextFieldSetting'
import { Tooltip, Collapse } from '@mui/material'
import { useDispatch } from 'react-redux'
import { ColorChip } from './ColorChip'
import { Dispatch } from '../store'

type ISecurity = 'PROTECTED' | 'OPEN'
const MAX_PASSWORD_LENGTH = 49

export const ConnectLinkSetting: React.FC<{ connection: IConnection; permissions: IPermission[] }> = ({
  connection,
  permissions,
}) => {
  const dispatch = useDispatch<Dispatch>()
  const [security, setSecurity] = useState<ISecurity>(connection.password ? 'PROTECTED' : 'OPEN')
  const canManage = !permissions.includes('MANAGE')
  const hadLink = connection.host?.includes('connect.remote.it')

  useEffect(() => {
    setSecurity(connection.password ? 'PROTECTED' : 'OPEN')
  }, [connection.password])

  const Setting = (
    <>
      <ListItemSetting
        icon="globe"
        disabled={canManage || (connection.enabled && !connection.connectLink)}
        label="Persistent public url"
        subLabel="Create a fixed public endpoint for anyone to connect to"
        secondaryContent={
          <>
            {!connection.connectLink && hadLink && (
              <IconButton
                name="trash"
                color="grayDark"
                title="Reset URL"
                onClick={() =>
                  dispatch.ui.set({
                    confirm: {
                      id: 'destroyLink',
                      callback: () => dispatch.connections.removeConnectLink(connection),
                    },
                  })
                }
              />
            )}
            <ColorChip label="BETA" size="small" typeColor="alwaysWhite" backgroundColor="success" inline />
          </>
        }
        toggle={!!connection.connectLink}
        onClick={() => {
          if (connection.connectLink) dispatch.connections.setConnectLink({ ...connection, enabled: false })
          else dispatch.connections.setConnectLink({ ...connection, enabled: true })
        }}
      />
      <Collapse in={connection.connectLink} timeout={800}>
        <ListItemQuote>
          <SelectSetting
            hideIcon
            label="Authentication"
            value={security}
            values={[
              { name: 'None', key: 'OPEN' },
              { name: 'Password', key: 'PROTECTED' },
            ]}
            onChange={value => {
              setSecurity(value as ISecurity)
              if (value === 'OPEN') dispatch.connections.setConnectLink({ ...connection, password: undefined })
            }}
          />
          {security === 'PROTECTED' && (
            <InlineTextFieldSetting
              required
              hideIcon
              displayValue={connection.password?.replaceAll(/./g, '•')}
              modified={!!connection.password}
              value={connection.password}
              label="Password"
              resetValue=""
              maxLength={MAX_PASSWORD_LENGTH}
              onSave={password => dispatch.connections.setConnectLink({ ...connection, password: password.toString() })}
            />
          )}
        </ListItemQuote>
      </Collapse>
    </>
  )

  return canManage ? (
    <Tooltip title="Requires device 'Manage' permission" placement="left" enterDelay={400} arrow>
      <span>{Setting}</span>
    </Tooltip>
  ) : (
    Setting
  )
}
