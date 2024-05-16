import React, { useState, useEffect } from 'react'
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
            Service Key &nbsp;
            <ColorChip label="BETA" size="small" color="primary" variant="contained" />
            {/* What is a Service Key? Help link... */}
          </>
        }
        subLabel={
          <>
            <Typography variant="caption" sx={{ display: 'block', lineHeight: 1.2, marginTop: 0.4 }}>
              {canManage
                ? enabled
                  ? 'Your Service Key has been generated. Use the key below to authorize connections through our SDK. Keep it secure and do not share it publicly. You can delete it to create a new one.'
                  : 'Generate a Service Key to use authorize connections to this service through our SDK.'
                : "Requires device 'Manage' permission"}
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
                action: 'Disable',
                title: 'Disable Service Key?',
                children: 'Anyone with this key will no longer be able to connect.',
              }
            : service.link?.code
            ? {
                action: 'Enable',
                title: 'Enable Service Key?',
                children: 'Anyone with this key will be able to connect.',
              }
            : {
                action: 'Generate Key',
                title: 'Generate Service Key?',
                children: (
                  <Notice fullWidth>
                    You are generating a new Service Key. <em>Anyone with this key will be able to connect.</em>
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
                      Get the Node.js package
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
                  action: 'Delete Key',
                  title: 'Delete Service Key?',
                  children: (
                    <Notice severity="error" gutterBottom fullWidth>
                      This action cannot be undone. <em>Anyone with this key will no longer be able to connect.</em>
                    </Notice>
                  ),
                }}
                disabled={disabled}
                name="trash"
                title="Delete Key"
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
