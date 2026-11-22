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
        label={t('connectLinkSetting.permanentLabel', 'Permanent public address')}
        subLabel={
          <Typography
            variant="caption"
            color={disabled ? undefined : 'grayDark.main'}
            sx={{ display: 'block', lineHeight: 1.2, marginTop: 0.4 }}
          >
            {canManage
              ? disabled
                ? t('connectLinkSetting.webOnly', 'Only web services can have a permanent public address.')
                : t('connectLinkSetting.anyoneSubLabel', 'A fixed web address anyone can open')
              : t('connectLinkSetting.manageNeeded', 'Needs Manage permission on the device')}
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
          action: t('connectLinkSetting.createAction', 'Create public address'),
          title: t('common.areYouSure', 'Are you sure?'),
          children: (
            <>
              {connection.password ? (
                <Notice severity="info" gutterBottom fullWidth>
                  {t('connectLinkSetting.hasPassword', 'This address asks for a password.')}
                </Notice>
              ) : (
                <Notice severity="warning" gutterBottom fullWidth>
                  {t('connectLinkSetting.noPassword', 'This address has no password.')}
                </Notice>
              )}
              <Typography variant="body2">
                {connection.password
                  ? t(
                      'connectLinkSetting.anyoneWithPassword',
                      'Anyone with the address and password can open this service.'
                    )
                  : t('connectLinkSetting.anyoneOpens', 'Anyone with the address can open this service.')}
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
            label={t('connectLinkSetting.signInLabel', 'Web sign-in')}
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
