import React, { useState, useEffect } from 'react'
import { Notice } from './Notice'
import { windowOpen } from '../services/Browser'
import { Typography, Collapse, ButtonBase, Box, Stack } from '@mui/material'
import { ListItemSetting } from './ListItemSetting'
import { ListItemQuote } from './ListItemQuote'
import { CopyCodeBlock } from './CopyCodeBlock'
import { IconButton } from '../buttons/IconButton'
import { useDispatch } from 'react-redux'
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
                  ? 'Your Service Key has been generated. Use the key below to establish programmatic connections through our SDK. Keep it secure and do not share it publicly. You can delete it to create a new one.'
                  : 'Generate a Service Key to establish an authenticated, programmatic connection to this service through our SDK.'
                : "Requires device 'Manage' permission"}
            </Typography>
          </>
        }
        toggle={!!enabled}
        onClick={() => {
          setLoading(true)
          dispatch.devices.setLink({ serviceId: service.id, enabled: !service.link?.enabled })
        }}
        confirm={!enabled && !service.link?.code}
        confirmProps={{
          color: 'warning',
          action: 'Generate Key',
          title: 'Are you sure?',
          children: (
            <Notice severity="warning" gutterBottom fullWidth>
              You are generating a new Service Key. <em>Anyone with this key will be able to connect.</em>
            </Notice>
          ),
        }}
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
                  onClick={() => windowOpen('https://github.com/remoteit/warp-js')}
                  inlineLeft
                />
                <ButtonBase
                  sx={{ marginTop: 1 }}
                  onClick={() => windowOpen('https://www.npmjs.com/package/@remote.it/warp')}
                >
                  <img src="https://badge.fury.io/js/%40remote.it%2Fwarp.svg" />
                </ButtonBase>
              </Stack>
              <IconButton
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
