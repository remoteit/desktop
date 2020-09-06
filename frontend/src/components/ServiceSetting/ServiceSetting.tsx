import React from 'react'
import { ApplicationState } from '../../store'
import { useSelector } from 'react-redux'
import { serviceTypes } from '../../services/serviceTypes'
import { InlineSelectSetting } from '../InlineSelectSetting'
import { InlineTextFieldSetting } from '../InlineTextFieldSetting'
import { ListItemSetting } from '../ListItemSetting'

type Props = {
  disabled?: boolean
  target?: ITarget
  onUpdate: (target: ITarget) => void
}

export const ServiceSetting: React.FC<Props> = ({ disabled, target, onUpdate }) => {
  const busy = useSelector((state: ApplicationState) => state.ui.setupServiceBusy === target?.uid)
  disabled = disabled || busy

  if (!target) return null

  return (
    <>
      <ListItemSetting
        label="Enable service"
        subLabel="Disabling your service will take it offline."
        icon="circle-check"
        toggle={!target.disabled}
        disabled={disabled}
        onClick={() => {
          target.disabled = !target.disabled
          onUpdate(target)
        }}
      />
      <InlineSelectSetting
        value={target.type}
        label="Service Type"
        values={serviceTypes}
        resetValue={target.type}
        disabled={disabled}
        onSave={type => {
          target.type = Number(type)
          onUpdate(target)
        }}
      />
      <InlineTextFieldSetting
        value={target.port}
        label="Service Port"
        resetValue={target.port}
        disabled={disabled}
        onSave={port => {
          target.port = Number(port)
          onUpdate(target)
        }}
      />
      <InlineTextFieldSetting
        value={target.hostname}
        label="Service Host Address"
        resetValue={target.hostname}
        disabled={disabled}
        onSave={hostname => {
          target.hostname = hostname.toString()
          onUpdate(target)
        }}
      />
    </>
  )
}
