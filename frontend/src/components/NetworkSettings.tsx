import React from 'react'
import { List } from '@mui/material'
import { Dispatch } from '../store'
import { useDispatch } from 'react-redux'
import { InlineTextFieldSetting } from './InlineTextFieldSetting'
import { MAX_NAME_LENGTH } from '../shared/constants'

export const NetworkSettings: React.FC<{ network: INetwork; orgName: string }> = ({ network, orgName }) => {
  const dispatch = useDispatch<Dispatch>()
  const disabled = !network.permissions.includes('MANAGE')

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
      {/* <ListItemSetting
        icon="power-off"
        label="Auto start"
        subLabel="Auto start connections when added"
        toggle={network.enabled}
        onClick={() => dispatch.networks.updateNetwork({ ...network, enabled: !network.enabled })}
      /> */}
    </List>
  )
}
