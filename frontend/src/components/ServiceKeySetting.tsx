import React from 'react'
import { Notice } from './Notice'
import { Typography, Collapse } from '@mui/material'
import { ListItemSetting } from './ListItemSetting'
import { ListItemQuote } from './ListItemQuote'
import { CopyCodeBlock } from './CopyCodeBlock'
import { useDispatch } from 'react-redux'
import { Dispatch } from '../store'
import { Gutters } from './Gutters'
import { Icon } from './Icon'

type Props = {
  connection: IConnection
  service: IService
  permissions: IPermission[]
  disabled?: boolean
}

export const ServiceKeySetting: React.FC<Props> = ({ connection, service, permissions, disabled }) => {
  const dispatch = useDispatch<Dispatch>()
  const canManage = permissions.includes('MANAGE')
  const enabled = service.link?.enabled
  disabled = disabled || !canManage || (connection.enabled && !connection.connectLink) || connection.updating

  return (
    <>
      <ListItemSetting
        icon="key"
        disabled={disabled}
        label="Service Key"
        subLabel={
          <Typography variant="caption" sx={{ display: 'block', lineHeight: 1.2, marginTop: 0.4 }}>
            {canManage
              ? enabled
                ? 'Your Service Key has been generated. Use this key to establish programmatic connections through our SDK. Keep it secure and do not share it publicly. You can delete it to create a new one.'
                : 'Generate a Service Key to establish an authenticated, programmatic connection to this service through our SDK.'
              : "Requires device 'Manage' permission"}
          </Typography>
        }
        secondaryContentWidth="140px"
        button={enabled ? <Icon name="trash" /> : undefined}
        toggle={!!enabled}
        onButtonClick={() => dispatch.devices.removeLink(service.id)}
        onClick={() => dispatch.devices.setLink({ serviceId: service.id, enabled: !service.link?.enabled })}
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
          <Gutters size="lg" top={null} bottom={null}>
            <CopyCodeBlock value={service.link?.code} sx={{ marginTop: 1, marginBottom: 1 }} hideCopyLabel />
          </Gutters>
        </ListItemQuote>
      </Collapse>
    </>
  )
}
