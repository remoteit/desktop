import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Notice } from './Notice'
import { windowOpen } from '../services/browser'
import { Typography, Collapse, ButtonBase, Box, Stack } from '@mui/material'
import { ListItemSetting } from './ListItemSetting'
import { ListItemQuote } from './ListItemQuote'
import { CopyCodeBlock } from './CopyCodeBlock'
import { ConfirmIconButton } from '../buttons/ConfirmIconButton'
import { useDispatch } from 'react-redux'
import { IconButton } from '../buttons/IconButton'
import { ColorChip } from './ColorChip'
import { Dispatch } from '../store'
import { Icon } from './Icon'

type Props = {
  connection: IConnection
  service: IService
  permissions: IPermission[]
  disabled?: boolean
}

export const ServiceKeySetting: React.FC<Props> = ({ connection, service, permissions, disabled }) => {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const dispatch = useDispatch<Dispatch>()
  const canManage = permissions.includes('MANAGE')
  const enabled = service.link?.enabled
  disabled = disabled || loading || !canManage || connection.updating

  useEffect(() => {
    setLoading(false)
  }, [service.link])

  return (
    <>
      <ListItemSetting
        icon="key"
        disabled={disabled}
        label={
          <>
            {t('serviceKeySetting.label', 'Service Key')} &nbsp;
            <ColorChip label={t('serviceKeySetting.beta', 'BETA')} size="small" color="primary" variant="contained" />
            {/* What is a Service Key? Help link... */}
          </>
        }
        subLabel={
          <>
            <Typography variant="caption" sx={{ display: 'block', lineHeight: 1.2, marginTop: 0.4 }}>
              {canManage
                ? enabled
                  ? t(
                      'serviceKeySetting.enabledSubLabel',
                      'Your Service Key has been generated. Use the key below to authorize connections through our SDK. Keep it secure and do not share it publicly. You can delete it to create a new one.'
                    )
                  : t(
                      'serviceKeySetting.disabledSubLabel',
                      'Generate a Service Key to use authorize connections to this service through our SDK.'
                    )
                : t('serviceKeySetting.permissionSubLabel', "Requires device 'Manage' permission")}
            </Typography>
          </>
        }
        toggle={!!enabled}
        onClick={() => {
          setLoading(true)
          dispatch.devices.setLink({ serviceId: service.id, enabled: !service.link?.enabled })
        }}
        confirm
        confirmProps={
          enabled
            ? {
                action: t('serviceKeySetting.disableAction', 'Disable'),
                title: t('serviceKeySetting.disableTitle', 'Disable Service Key?'),
                children: t('serviceKeySetting.disableBody', 'Anyone with this key will no longer be able to connect.'),
              }
            : service.link?.code
            ? {
                action: t('serviceKeySetting.enableAction', 'Enable'),
                title: t('serviceKeySetting.enableTitle', 'Enable Service Key?'),
                children: t('serviceKeySetting.enableBody', 'Anyone with this key will be able to connect.'),
              }
            : {
                action: t('serviceKeySetting.generateAction', 'Generate Key'),
                title: t('serviceKeySetting.generateTitle', 'Generate Service Key?'),
                children: (
                  <Notice fullWidth>
                    {t('serviceKeySetting.generateBodyPrefix', 'You are generating a new Service Key.')}{' '}
                    <em>{t('serviceKeySetting.generateBodySuffix', 'Anyone with this key will be able to connect.')}</em>
                  </Notice>
                ),
              }
        }
      />
      <Collapse in={enabled && !!service.link?.code} timeout={400}>
        <ListItemQuote>
          <Box marginLeft={3} marginRight={3}>
            <CopyCodeBlock value={service.link?.code} sx={{ marginTop: 1, marginBottom: 1 }} hideCopyLabel />
            <Stack flexDirection="row" justifyContent="space-between">
              <Stack flexDirection="row" alignItems="flex-start">
                <IconButton
                  type="brands"
                  name="github"
                  title={
                    <>
                      {t('serviceKeySetting.nodePackage', 'Get the Node.js package')}
                      <Icon name="launch" size="xs" inline />
                    </>
                  }
                  size="xl"
                  buttonBaseSize="small"
                  onClick={() => windowOpen('https://github.com/remoteit/socket-link.js')}
                  inlineLeft
                />
                <ButtonBase
                  sx={{ marginTop: 1 }}
                  onClick={() => windowOpen('https://www.npmjs.com/package/@remote.it/socket-link')}
                >
                  <img src="https://badge.fury.io/js/%40remote.it%2Fsocket-link.svg" />
                </ButtonBase>
              </Stack>
              <ConfirmIconButton
                confirm
                confirmProps={{
                  color: 'error',
                  action: t('serviceKeySetting.deleteAction', 'Delete Key'),
                  title: t('serviceKeySetting.deleteTitle', 'Delete Service Key?'),
                  children: (
                    <Notice severity="error" gutterBottom fullWidth>
                      {t('serviceKeySetting.deleteBodyPrefix', 'This action cannot be undone.')}{' '}
                      <em>{t('serviceKeySetting.deleteBodySuffix', 'Anyone with this key will no longer be able to connect.')}</em>
                    </Notice>
                  ),
                }}
                disabled={disabled}
                name="trash"
                title={t('serviceKeySetting.deleteKeyTitle', 'Delete Key')}
                onClick={() => {
                  setLoading(true)
                  dispatch.devices.removeLink(service.id)
                }}
              />
            </Stack>
          </Box>
        </ListItemQuote>
      </Collapse>
    </>
  )
}
