import React, { useState, useEffect } from 'react'
import { Notice } from './Notice'
import { SelectSetting } from './SelectSetting'
import { ListItemQuote } from './ListItemQuote'
import { ListItemSetting } from './ListItemSetting'
import { InlineTextFieldSetting } from './InlineTextFieldSetting'
import { useDispatch } from 'react-redux'
import { Typography } from '@mui/material'
import { ColorChip } from './ColorChip'
import { Dispatch } from '../store'

type ISecurity = 'PROTECTED' | 'OPEN'
const MAX_PASSWORD_LENGTH = 49

type Props = {
  connection: IConnection
  permissions: IPermission[]
  disabled?: boolean
}

export const ConnectLinkSetting: React.FC<Props> = ({ connection, permissions, disabled }) => {
  const dispatch = useDispatch<Dispatch>()
  const [security, setSecurity] = useState<ISecurity>(connection.password ? 'PROTECTED' : 'OPEN')
  const canManage = permissions.includes('MANAGE')
  disabled = disabled || !canManage || (connection.enabled && !connection.connectLink) || connection.updating

  useEffect(() => {
    setSecurity(connection.password ? 'PROTECTED' : 'OPEN')
  }, [connection.password])

  return (
    <>
      <ListItemSetting
        icon="globe"
        disabled={disabled}
        label="Persistent public url"
        subLabel={
          <Typography variant="caption" color={disabled ? 'grayDarkest.main' : 'grayDark.main'}>
            {canManage
              ? disabled
                ? 'Fixed public endpoints are only available for http(s) services.'
                : 'Create a fixed public endpoint for anyone to connect to'
              : "Requires device 'Manage' permission"}
          </Typography>
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
        confirm={!connection.connectLink}
        confirmProps={{
          color: connection.password ? undefined : 'error',
          action: 'Make Public',
          title: 'Are you sure?',
          children: (
            <>
              {connection.password ? (
                <Notice severity="info" gutterBottom fullWidth>
                  This endpoint has password protection.
                </Notice>
              ) : (
                <Notice severity="error" gutterBottom fullWidth>
                  This endpoint has no password protection.
                </Notice>
              )}
              <Typography variant="body2">
                This will create a fixed public endpoint for anyone {connection.password && 'with the password'} to
                connect to.
              </Typography>
            </>
          ),
        }}
      />
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
    </>
  )
}
