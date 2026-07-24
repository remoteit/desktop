import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Notice } from './Notice'
import { SelectSetting } from './SelectSetting'
import { ListItemQuote } from './ListItemQuote'
import { ListItemSetting } from './ListItemSetting'
import { InlineTextFieldSetting } from './InlineTextFieldSetting'
import { useDispatch } from 'react-redux'
import { Typography } from '@mui/material'
import { Dispatch } from '../store'

type ISecurity = 'PROTECTED' | 'OPEN'
const MAX_PASSWORD_LENGTH = 49

type Props = {
  connection: IConnection
  permissions: IPermission[]
  reverseProxy?: boolean
  disabled?: boolean
}

export const ConnectLinkSetting: React.FC<Props> = ({ connection, permissions, reverseProxy, disabled }) => {
  const { t } = useTranslation()
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
        label={t('connectLinkSetting.label', 'Persistent public url')}
        subLabel={
          <Typography
            variant="caption"
            color={disabled ? undefined : 'grayDark.main'}
            sx={{ display: 'block', lineHeight: 1.2, marginTop: 0.4 }}
          >
            {canManage
              ? disabled
                ? t('connectLinkSetting.disabledSubLabel', 'Fixed public endpoints are only available for http(s) services.')
                : t('connectLinkSetting.enabledSubLabel', 'Create a fixed public endpoint for anyone to connect to')
              : t('connectLinkSetting.permissionSubLabel', "Requires device 'Manage' permission")}
          </Typography>
        }
        toggle={!!connection.connectLink}
        onClick={() => {
          if (connection.connectLink) dispatch.connections.setConnectLink({ ...connection, enabled: false })
          else dispatch.connections.setConnectLink({ ...connection, enabled: true })
        }}
        confirm={!connection.connectLink}
        confirmProps={{
          color: connection.password ? undefined : 'warning',
          action: t('connectLinkSetting.makePublicAction', 'Make Public'),
          title: t('common.areYouSure', 'Are you sure?'),
          children: (
            <>
              {connection.password ? (
                <Notice severity="info" gutterBottom fullWidth>
                  {t('connectLinkSetting.passwordProtectedNotice', 'This endpoint has password protection.')}
                </Notice>
              ) : (
                <Notice severity="warning" gutterBottom fullWidth>
                  {t('connectLinkSetting.noPasswordNotice', 'This endpoint has no password protection.')}
                </Notice>
              )}
              <Typography variant="body2">
                {connection.password
                  ? t(
                      'connectLinkSetting.confirmBodyWithPassword',
                      'This will create a fixed public endpoint for anyone with the password to connect to.'
                    )
                  : t(
                      'connectLinkSetting.confirmBody',
                      'This will create a fixed public endpoint for anyone to connect to.'
                    )}
              </Typography>
            </>
          ),
        }}
      />
      {canManage && reverseProxy && (
        <ListItemQuote>
          <SelectSetting
            hideIcon
            disabled={connection.updating || disabled}
            label={t('connectLinkSetting.webAuthenticationLabel', 'Web Authentication')}
            value={security}
            values={[
              { name: t('connectLinkSetting.authNone', 'None'), key: 'OPEN' },
              { name: t('connectLinkSetting.authPassword', 'Password'), key: 'PROTECTED' },
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
              label={t('connectLinkSetting.passwordLabel', 'Password')}
              resetValue=""
              maxLength={MAX_PASSWORD_LENGTH}
              onSave={password => dispatch.connections.setConnectLink({ ...connection, password: password.toString() })}
            />
          )}
        </ListItemQuote>
      )}
    </>
  )
}
