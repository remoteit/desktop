import React, { useContext } from 'react'
import { useDispatch } from 'react-redux'
import { Dispatch } from '../store'
import { useHistory } from 'react-router-dom'
import { MobileServiceName } from './MobileServiceName'
import { DeviceListContext } from '../services/Context'
import { AttributeValueMemo } from './AttributeValue'
import { ConnectionStateIcon } from './ConnectionStateIcon'
import { GridListItem } from './GridListItem'
import { Icon } from './Icon'
import { Box } from '@mui/material'

type Props = {
  restore?: boolean
  select?: boolean
  selected: string[]
  mobile?: boolean
  duplicateName?: boolean
  onClick?: () => void
}

export const DeviceListItem: React.FC<Props> = ({ restore, select, selected, mobile, duplicateName, onClick }) => {
  const dispatch = useDispatch<Dispatch>()
  const { connections, device, service, attributes, required } = useContext(DeviceListContext)
  const connection =
    connections && (service ? connections.find(c => c.id === service.id) : connections.find(c => c.enabled))
  const history = useHistory()

  if (!device) return null

  const isSelected = selected.includes(device.id)

  const onSelect = deviceId => {
    const select = [...selected]
    if (isSelected) {
      const index = select.indexOf(deviceId)
      select.splice(index, 1)
    } else {
      select.push(deviceId)
    }
    dispatch.ui.set({ selected: select })
  }

  const handleClick = () => {
    onClick?.()
    if (select) onSelect?.(device.id)
    else if (!restore) history.push(`/devices/${device.id}${service ? `/${service.id}/connect` : ''}`)
  }

  return (
    <GridListItem
      onClick={handleClick}
      selected={isSelected}
      icon={
        duplicateName ? null : select ? (
          isSelected ? (
            <Icon name="check-square" size="md" type="solid" color="primary" />
          ) : (
            <Icon name="square" size="md" />
          )
        ) : (
          <ConnectionStateIcon className="hoverHide" device={device} connection={connection} />
        )
      }
      required={
        mobile && service ? (
          <MobileServiceName {...{ mobile, device, service, connection, connections, duplicateName }} />
        ) : (
          !duplicateName && (
            <AttributeValueMemo {...{ mobile, device, service, connection, connections, attribute: required }} />
          )
        )
      }
      disableGutters
    >
      {!mobile &&
        attributes?.map(attribute => (
          <Box key={attribute.id}>
            <AttributeValueMemo {...{ mobile, device, service, attribute, connection, connections }} />
          </Box>
        ))}
    </GridListItem>
  )
}
