import React from 'react'
import { Dispatch } from '../store'
import { useDispatch } from 'react-redux'
import { List } from '@material-ui/core'
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
        label="Connected"
        toggle={network.enabled}
        onClick={() => dispatch.networks.enable({ ...network, enabled: !network.enabled })}
      />
    </List>
  )
}
