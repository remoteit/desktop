import React from 'react'
import { emit } from '../../services/Controller'
import { List } from '@material-ui/core'
import { ApplicationState, Dispatch } from '../../store'
import { useSelector, useDispatch } from 'react-redux'
import { serviceTypes, findType } from '../../services/serviceTypes'
import { InlineSelectSetting } from '../InlineSelectSetting'
import { InlineTextFieldSetting } from '../InlineTextFieldSetting'
import { attributeName } from '../../shared/nameHelper'

type Props = { service: IService; target?: ITarget }

export const ServiceSetting: React.FC<Props> = ({ service, target }) => {
  const { devices } = useDispatch<Dispatch>()
  const { disabled } = useSelector((state: ApplicationState) => ({
    disabled: state.ui.setupServiceBusy === service.id,
  }))

  return (
    <List>
      <InlineTextFieldSetting
        value={attributeName(service)}
        label="Service Name"
        resetValue={service.name}
        onSave={name => {
          service.attributes.name = name.toString()
          devices.setServiceAttributes(service)
        }}
      />
      {target && (
        <>
          <InlineSelectSetting
            value={target.type}
            label="Service Type"
            values={serviceTypes}
            resetValue={target.type}
            onSave={value => {
              const type: number = Number(value)
              // setState({ ...state, type, port: findType(type).defaultPort || state.port })
            }}
          />
          <InlineTextFieldSetting
            value={target.port}
            label="Service Port"
            resetValue={target.port}
            disabled={disabled}
            onSave={port => {
              // update('port', +port)
            }}
          />
          <InlineTextFieldSetting
            value={target.hostname}
            label="Service Host Address"
            resetValue={target.hostname}
            disabled={disabled}
            onSave={hostname => {
              // update('hostname', hostname)
            }}
          />
        </>
      )}
    </List>
  )
}
