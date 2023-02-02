import React, { useState, useEffect } from 'react'
import { SelectSetting } from './SelectSetting'
import { ListItemQuote } from './ListItemQuote'
import { ListItemSetting } from './ListItemSetting'
import { InlineTextFieldSetting } from './InlineTextFieldSetting'
import { Typography, Collapse } from '@mui/material'
import { useDispatch } from 'react-redux'
import { ColorChip } from './ColorChip'
import { Dispatch } from '../store'

type ISecurity = 'PROTECTED' | 'OPEN'
const MAX_PASSWORD_LENGTH = 49

type Props = {
  connection: IConnection
  permissions: IPermission[]
}

export const ConnectLinkSetting: React.FC<Props> = ({ connection, permissions }) => {
  const dispatch = useDispatch<Dispatch>()
  const [security, setSecurity] = useState<ISecurity>(connection.password ? 'PROTECTED' : 'OPEN')
  const canManage = permissions.includes('MANAGE')

  useEffect(() => {
    setSecurity(connection.password ? 'PROTECTED' : 'OPEN')
  }, [connection.password])

  return (
    <>
      <ListItemSetting
        icon="globe"
        disabled={!canManage || (connection.enabled && !connection.connectLink) || connection.updating}
        label="Persistent public url"
        subLabel={
          canManage ? (
            'Create a fixed public endpoint for anyone to connect to'
          ) : (
            <Typography variant="caption" color="grayDarkest.main">
              Requires device 'Manage' permission
            </Typography>
          )
        }
        secondaryContent={
          <ColorChip label="BETA" size="small" typeColor="alwaysWhite" backgroundColor="success" inline />
        }
        secondaryContentWidth="140px"
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
            disabled={connection.updating}
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
              disabled={connection.updating}
              displayValue={connection.password?.replaceAll(/./g, '•')}
              modified={!!connection.password}
              value={connection.password || ''}
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
}
