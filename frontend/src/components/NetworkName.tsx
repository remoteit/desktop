import React from 'react'
import { Dispatch } from '../store'
import { useDispatch } from 'react-redux'
import { InlineTextFieldSetting } from './InlineTextFieldSetting'
import { MAX_NAME_LENGTH } from '../shared/constants'

export const NetworkName: React.FC<{ network: INetwork }> = ({ network }) => {
  const dispatch = useDispatch<Dispatch>()
  return (
    <InlineTextFieldSetting
      required
      icon="i-cursor"
      value={network.name}
      label="Network Name"
      maxLength={MAX_NAME_LENGTH}
      onSave={name => dispatch.networks.setNetwork({ ...network, name: name.toString() })}
    />
  )
}
