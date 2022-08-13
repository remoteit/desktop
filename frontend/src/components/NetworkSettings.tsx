import React from 'react'
import { List } from '@mui/material'
import { Dispatch } from '../store'
import { useDispatch } from 'react-redux'
import { FormDisplay } from './FormDisplay'
import { InlineTextFieldSetting } from './InlineTextFieldSetting'
import { ListItemSetting } from '../components/ListItemSetting'
import { MAX_NAME_LENGTH } from '../shared/constants'
import { Avatar } from '../components/Avatar'

export const NetworkSettings: React.FC<{ network: INetwork; owner: string }> = ({ network, owner }) => {
  const dispatch = useDispatch<Dispatch>()
  const disabled = network.permissions.includes('MANAGE')

  return (
    <List disablePadding>
      <InlineTextFieldSetting
        required
        disabled={disabled}
        icon="i-cursor"
        value={network.name}
        label="Network Name"
        maxLength={MAX_NAME_LENGTH}
        onSave={name => dispatch.networks.updateNetwork({ ...network, name: name.toString() })}
      />
      <ListItemSetting
        icon="power-off"
        label="Enable Connections"
        subLabel={`Start or stop all services. ${network.enabled ? 'New services will auto-start.' : ''}`}
        toggle={network.enabled}
        onClick={() => dispatch.networks.enable({ ...network, enabled: !network.enabled })}
      />
      <FormDisplay
        icon={<Avatar email={network.owner.email} size={24} tooltip />}
        label="Owner"
        value={owner}
        displayOnly
      />
    </List>
  )
}
