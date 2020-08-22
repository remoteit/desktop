import React from 'react'
import { emit } from '../../services/Controller'
import { ApplicationState, Dispatch } from '../../store'
import { useSelector, useDispatch } from 'react-redux'
import { serviceTypes, findType } from '../../services/serviceTypes'
import { InlineSelectSetting } from '../InlineSelectSetting'
import { InlineTextFieldSetting } from '../InlineTextFieldSetting'
import { ListItemSetting } from '../ListItemSetting'
import analytics from '../../helpers/Analytics'

type Props = { service: IService; targets?: ITarget[] }

export const ServiceSetting: React.FC<Props> = ({ service, targets }) => {
  const { ui } = useDispatch<Dispatch>()
  const tIndex = targets?.findIndex(t => t.uid === service.id)
  const { disabled } = useSelector((state: ApplicationState) => ({
    disabled: state.ui.setupServiceBusy === service.id,
  }))

  if (tIndex === undefined || !targets) return null

  const target = targets[tIndex]
  const update = () => {
    analytics.track('serviceUpdated', { ...target, id: target.uid })
    ui.set({ setupBusy: true, setupServiceBusy: true })
    targets[tIndex] = target
    emit('targets', targets)
  }

  return (
    <>
      <ListItemSetting
        label="Service Enabled"
        subLabel="Disabling your service will take it offline."
        icon="circle-check"
        toggle={!target.disabled}
        disabled={disabled}
        onClick={() => {
          target.disabled = !target.disabled
          update()
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
          update()
        }}
      />
      <InlineTextFieldSetting
        value={target.port}
        label="Service Port"
        resetValue={target.port}
        disabled={disabled}
        onSave={port => {
          target.port = Number(port)
          update()
        }}
      />
      <InlineTextFieldSetting
        value={target.hostname}
        label="Service Host Address"
        resetValue={target.hostname}
        disabled={disabled}
        onSave={hostname => {
          target.hostname = hostname.toString()
          update()
        }}
      />
    </>
  )
}
