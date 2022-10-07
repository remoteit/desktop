import React, { useState, useEffect } from 'react'
import { isPortal } from '../services/Browser'
import { setConnection } from '../helpers/connectionHelper'
import { SelectSetting } from './SelectSetting'
import { ListItemQuote } from './ListItemQuote'
import { ListItemSetting } from './ListItemSetting'
import { InlineTextFieldSetting } from './InlineTextFieldSetting'
import { Tooltip, Collapse } from '@mui/material'
import { useDispatch } from 'react-redux'
import { Dispatch } from '../store'
import { ColorChip } from './ColorChip'

type ISecurity = 'PROTECTED' | 'OPEN'
const MAX_PASSWORD_LENGTH = 49

export const ConnectLinkSetting: React.FC<{ connection: IConnection; permissions: IPermission[] }> = ({
  connection,
  permissions,
}) => {
  const dispatch = useDispatch<Dispatch>()
  const [security, setSecurity] = useState<ISecurity>(connection.password ? 'PROTECTED' : 'OPEN')
  const disabled = !permissions.includes('MANAGE')

  useEffect(() => {
    setSecurity(connection.password ? 'PROTECTED' : 'OPEN')
  }, [connection.password])

  const Setting = (
    <>
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
            dispatch.ui.set({
              confirm: {
                id: 'destroyLink',
                callback: () => dispatch.connections.removeConnectLink(connection),
              },
            })
          } else {
            dispatch.connections.setConnectLink(connection)
          }
        }}
      />
      <Collapse in={connection.connectLink}>
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

  return disabled ? (
    <Tooltip title="Requires device 'Manage' permission" placement="left" enterDelay={400} arrow>
      <span>{Setting}</span>
    </Tooltip>
  ) : (
    Setting
  )
}
