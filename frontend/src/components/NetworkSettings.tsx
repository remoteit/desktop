import React from 'react'
import { List } from '@mui/material'
import { Dispatch } from '../store'
import { useDispatch } from 'react-redux'
import { InlineTextFieldSetting } from './InlineTextFieldSetting'
import { ListItemSetting } from '../components/ListItemSetting'
import { MAX_NAME_LENGTH } from '../shared/constants'

export const NetworkSettings: React.FC<{ network: INetwork }> = ({ network }) => {
  const dispatch = useDispatch<Dispatch>()
  return (
    <List disablePadding>
      <InlineTextFieldSetting
        required
        icon="i-cursor"
        value={network.name}
        label="Network Name"
        maxLength={MAX_NAME_LENGTH}
        onSave={name => dispatch.networks.setNetwork({ ...network, name: name.toString() })}
      />
      <ListItemSetting
        icon="power-off"
        label="Enable"
        subLabel={`Start or stop all services. ${network.enabled ? 'New services will auto-start.' : ''}`}
        toggle={network.enabled}
        onClick={() => dispatch.networks.enable({ ...network, enabled: !network.enabled })}
      />
    </List>
  )
}
